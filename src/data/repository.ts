// Repository local-first, puro: nessun import React Native, così è testabile in
// node (vedi repository.check.ts). Il cablaggio ad AsyncStorage sta in store.ts.
import type { Deck, DeckEntry, DeckEntryInput, Format, Snapshot, WishlistItem, Zone } from '@/domain/types';

/**
 * Deck + copie nel MAIN (Extra/Side esclusi: la card mostra il numero che conta per il
 * formato, 40-60), read-model per la lista (evita di caricare le entries per ogni deck).
 * Qui `coverCardId` è la copertina RISOLTA (esplicita ?? prima carta), non la scelta grezza
 * della riga `Deck`: la lista mostra un'immagine e non ha mai bisogno del valore esplicito.
 * `null` solo se il deck è vuoto. Il dettaglio usa invece `Deck.coverCardId` (esplicito) per la stella.
 */
export type DeckSummary = Deck & { cardCount: number };

/** Copie nel Main di un deck (Extra/Side non contano per il 40-60). */
export const countMain = (entries: { zone: Zone; count: number }[]): number =>
  entries.reduce((n, e) => (e.zone === 'main' ? n + e.count : n), 0);

/**
 * KV minimale cross-platform. AsyncStorage soddisfa questa firma direttamente
 * (web + native); i test passano un Map in memoria.
 */
export interface KVStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/**
 * La sola parte cablata nell'app oggi: la Wishlist. L'impl viva è `NeonRepository`
 * (Data API + RLS, client-only, vedi docs/adr/0005); l'impl locale sotto la
 * soddisfa ancora per i test e come base dei Deck futuri.
 */
export interface WishlistRepository {
  getWishlist(): Promise<WishlistItem[]>;
  /**
   * Riconcilia le rarità di una Card: per ogni (rarity, count) fa upsert se
   * count>0, rimuove se count<=0; le altre rarità del cardId restano intatte. Se
   * il risultato lascia almeno una rarità desiderata (count>0) la carta torna
   * Wanted (azzera `obtainedAt` su tutte le sue righe: invariante "stato
   * per-carta", vedi CONTEXT.md); una pura rimozione non riattiva.
   */
  setWishlistEntries(cardId: number, entries: { rarity: string; count: number }[]): Promise<void>;
  /** Segna/desegna come "Presa" tutte le righe di una Card (stato Obtained, per-carta). */
  setObtained(cardId: number, obtained: boolean): Promise<void>;
  /** Rimuove COMPLETAMENTE una Card dalla wishlist: tutte le sue righe (ogni rarità). */
  deleteCard(cardId: number): Promise<void>;
}

/** La parte Deck del seam. L'impl viva è `neonDecks` (Neon + RLS); l'impl locale sotto resta per i test. */
export interface DeckRepository {
  /** Lista dei Deck dell'utente col conteggio carte, senza caricarne le entries. */
  getDecks(): Promise<DeckSummary[]>;
  getDeck(id: string): Promise<{ deck: Deck; entries: DeckEntry[] } | null>;
  /** Crea un Deck; se `entries` è dato (import .ydk), le inserisce in blocco. */
  createDeck(name: string, format: Format, entries?: DeckEntryInput[]): Promise<Deck>;
  /** Rinomina un Deck. Bumpa updatedAt: è un edit significativo. */
  setDeckName(deckId: string, name: string): Promise<void>;
  /**
   * Rimpiazza IN BLOCCO le entries di un Deck con `entries` (delete-all + insert).
   * Sorgente unica per il Salva dell'editor (l'intera bozza) e per il re-import .ydk.
   * Bumpa updatedAt. La cover esplicita resta: se la carta non c'è più, `resolveCover` fa fallback.
   */
  replaceDeckEntries(deckId: string, entries: DeckEntryInput[]): Promise<void>;
  /** Imposta (o azzera, con `null`) la carta "in evidenza" esplicita di un Deck. */
  setDeckCover(deckId: string, cardId: number | null): Promise<void>;
  /** Cambia il Format (banlist) di un Deck. Bumpa updatedAt: è un edit significativo. */
  setDeckFormat(deckId: string, format: Format): Promise<void>;
  /** Rende il Deck pubblico/privato. NON bumpa updatedAt: cambio di visibilità, non di contenuto. */
  setDeckPublic(deckId: string, isPublic: boolean): Promise<void>;
  deleteDeck(id: string): Promise<void>;
}

/** Il seam completo: wishlist + deck. Oggi solo l'impl locale lo implementa tutto. Vedi docs/adr/0001. */
export interface Repository extends WishlistRepository, DeckRepository {
  /** Upsert su (deckId, cardId, zone); count <= 0 rimuove la voce. */
  setDeckEntry(deckId: string, cardId: number, zone: Zone, count: number): Promise<void>;

  /** Dump relazionale completo, pronto per l'import in Postgres/Drizzle. */
  exportAll(): Promise<Snapshot>;
}

const ZONE_RANK: Record<Zone, number> = { main: 0, extra: 1, side: 2 };

/**
 * Copertina risolta di un Deck: la scelta esplicita se ancora presente tra le carte,
 * altrimenti la "prima" carta = Main con card_id minimo, poi extra, poi side (deterministico:
 * `deck_entries` non memorizza ordine). `null` solo se il deck è vuoto.
 */
export function resolveCover(coverCardId: number | null, entries: { cardId: number; zone: Zone }[]): number | null {
  if (coverCardId != null && entries.some((e) => e.cardId === coverCardId)) return coverCardId;
  const first = [...entries].sort((a, b) => ZONE_RANK[a.zone] - ZONE_RANK[b.zone] || a.cardId - b.cardId)[0];
  return first?.cardId ?? null;
}

// wishlist_items_v2: la wishlist ora vive su (cardId, rarity), non più (…, setCode).
// Bump della chiave = wipe dei dati v1 incompatibili, senza codice di migrazione.
const KEYS = { wishlist: 'wishlist_items_v2', decks: 'decks', entries: 'deck_entries' } as const;

// ponytail: id locale sufficiente; store.ts inietta uuid v4 (expo-crypto) per Postgres.
const defaultId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export function createRepository(
  kv: KVStore,
  newId: () => string = defaultId,
  now: () => string = () => new Date().toISOString(),
): Repository {
  const read = async <T>(key: string): Promise<T[]> => {
    const raw = await kv.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  };
  const write = <T>(key: string, rows: T[]) => kv.setItem(key, JSON.stringify(rows));

  return {
    async getWishlist() {
      return read<WishlistItem>(KEYS.wishlist);
    },
    async setWishlistEntries(cardId, entries) {
      const items = await read<WishlistItem>(KEYS.wishlist);
      const wanted = entries.some((e) => e.count > 0); // resta desiderata almeno una rarità?
      const touched = new Set(entries.map((e) => e.rarity));
      // parto da: righe di altre carte + rarità di QUESTA carta non toccate dal
      // payload (drift, non le tocco). Se `wanted`, l'intera carta torna Wanted.
      const next = items
        .filter((i) => i.cardId !== cardId || !touched.has(i.rarity))
        .map((i) => (wanted && i.cardId === cardId && i.obtainedAt ? { ...i, obtainedAt: undefined } : i));
      // upsert delle rarità desiderate; count<=0 è già fuori da `next` = rimossa
      for (const { rarity, count } of entries) {
        if (count <= 0) continue;
        const existing = items.find((i) => i.cardId === cardId && i.rarity === rarity);
        // id/addedAt stabili sull'upsert; una riga desiderata è per definizione Wanted
        next.push({ id: existing?.id ?? newId(), cardId, rarity, count, addedAt: existing?.addedAt ?? now() });
      }
      await write(KEYS.wishlist, next);
    },
    async setObtained(cardId, obtained) {
      const items = await read<WishlistItem>(KEYS.wishlist);
      const obtainedAt = obtained ? now() : undefined;
      await write(
        KEYS.wishlist,
        items.map((i) => (i.cardId === cardId ? { ...i, obtainedAt } : i)),
      );
    },
    async deleteCard(cardId) {
      const items = await read<WishlistItem>(KEYS.wishlist);
      await write(
        KEYS.wishlist,
        items.filter((i) => i.cardId !== cardId),
      );
    },

    async getDecks() {
      const decks = await read<Deck>(KEYS.decks);
      const entries = await read<DeckEntry>(KEYS.entries);
      return decks.map((d) => {
        const own = entries.filter((e) => e.deckId === d.id);
        return {
          ...d,
          cardCount: countMain(own),
          coverCardId: resolveCover(d.coverCardId, own), // read-model: copertina risolta (vedi DeckSummary)
        };
      });
    },
    async getDeck(id) {
      const deck = (await read<Deck>(KEYS.decks)).find((d) => d.id === id);
      if (!deck) return null;
      const entries = (await read<DeckEntry>(KEYS.entries)).filter((e) => e.deckId === id);
      return { deck, entries };
    },
    async createDeck(name, format, entries) {
      const decks = await read<Deck>(KEYS.decks);
      const ts = now();
      const deck: Deck = { id: newId(), name, format, coverCardId: null, isPublic: false, createdAt: ts, updatedAt: ts };
      await write(KEYS.decks, [...decks, deck]);
      if (entries?.length) {
        const rows = await read<DeckEntry>(KEYS.entries);
        await write(KEYS.entries, [
          ...rows,
          ...entries.map((e) => ({ id: newId(), deckId: deck.id, ...e })),
        ]);
      }
      return deck;
    },
    async setDeckName(deckId, name) {
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, name, updatedAt: now() } : d)),
      );
    },
    async replaceDeckEntries(deckId, entries) {
      // delete-all delle entries di QUESTO deck + reinserimento in blocco della bozza.
      const rows = await read<DeckEntry>(KEYS.entries);
      const others = rows.filter((e) => e.deckId !== deckId);
      await write(KEYS.entries, [...others, ...entries.map((e) => ({ id: newId(), deckId, ...e }))]);
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, updatedAt: now() } : d)),
      );
    },
    async setDeckCover(deckId, cardId) {
      // scelta estetica: NON tocco updatedAt (non riordino la lista per un cambio copertina).
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, coverCardId: cardId } : d)),
      );
    },
    async setDeckFormat(deckId, format) {
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, format, updatedAt: now() } : d)),
      );
    },
    async setDeckPublic(deckId, isPublic) {
      // cambio di visibilità, non di contenuto: NON tocco updatedAt (come setDeckCover).
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, isPublic } : d)),
      );
    },
    async deleteDeck(id) {
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.filter((d) => d.id !== id),
      );
      const entries = await read<DeckEntry>(KEYS.entries);
      await write(
        KEYS.entries,
        entries.filter((e) => e.deckId !== id), // cascade sulle entries
      );
    },
    // ponytail: stessa read-modify-write di setWishlistEntries e stesso rischio di
    // lost update, ma oggi nessun caller in loop (la Deck UI è uno stub) → niente
    // race. Quando la Deck UI salverà più entries insieme, batcha qui come
    // setWishlistEntries (o dai uno `scope` alla mutation).
    async setDeckEntry(deckId, cardId, zone, count) {
      const entries = await read<DeckEntry>(KEYS.entries);
      const existing = entries.find(
        (e) => e.deckId === deckId && e.cardId === cardId && e.zone === zone,
      );
      const rest = entries.filter((e) => e !== existing);
      const next =
        count > 0
          ? [...rest, { id: existing?.id ?? newId(), deckId, cardId, zone, count }] // id stabile
          : rest;
      await write(KEYS.entries, next);
      const decks = await read<Deck>(KEYS.decks);
      await write(
        KEYS.decks,
        decks.map((d) => (d.id === deckId ? { ...d, updatedAt: now() } : d)),
      );
    },

    async exportAll() {
      return {
        decks: await read<Deck>(KEYS.decks),
        deckEntries: await read<DeckEntry>(KEYS.entries),
        wishlistItems: await read<WishlistItem>(KEYS.wishlist),
      };
    },
  };
}
