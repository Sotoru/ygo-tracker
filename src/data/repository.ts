// Repository local-first, puro: nessun import React Native, così è testabile in
// node (vedi repository.check.ts). Il cablaggio ad AsyncStorage sta in store.ts.
import type { Deck, DeckEntry, Format, Snapshot, WishlistItem, Zone } from '@/domain/types';

/**
 * KV minimale cross-platform. AsyncStorage soddisfa questa firma direttamente
 * (web + native); i test passano un Map in memoria.
 */
export interface KVStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

/** Il seam: oggi AsyncStorage, domani un'impl Neon + Drizzle. Vedi docs/adr/0001. */
export interface Repository {
  getWishlist(): Promise<WishlistItem[]>;
  /**
   * Riconcilia in UNA sola read-modify-write le rarità di una Card: per ogni
   * (rarity, count) fa upsert se count>0, rimuove se count<=0; le altre rarità del
   * cardId restano intatte. Un solo write → niente lost update quando il PrintPicker
   * conferma più rarità insieme. Se il risultato lascia almeno una rarità desiderata
   * (count>0) la carta torna Wanted (azzera `obtainedAt` su tutte le sue righe:
   * invariante "stato per-carta", vedi CONTEXT.md); una pura rimozione non riattiva.
   */
  setWishlistEntries(cardId: number, entries: { rarity: string; count: number }[]): Promise<void>;
  /** Segna/desegna come "Presa" tutte le righe di una Card (stato Obtained, per-carta). */
  setObtained(cardId: number, obtained: boolean): Promise<void>;

  getDecks(): Promise<Deck[]>;
  getDeck(id: string): Promise<{ deck: Deck; entries: DeckEntry[] } | null>;
  createDeck(name: string, format: Format): Promise<Deck>;
  deleteDeck(id: string): Promise<void>;
  /** Upsert su (deckId, cardId, zone); count <= 0 rimuove la voce. */
  setDeckEntry(deckId: string, cardId: number, zone: Zone, count: number): Promise<void>;

  /** Dump relazionale completo, pronto per l'import in Postgres/Drizzle. */
  exportAll(): Promise<Snapshot>;
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

    async getDecks() {
      return read<Deck>(KEYS.decks);
    },
    async getDeck(id) {
      const deck = (await read<Deck>(KEYS.decks)).find((d) => d.id === id);
      if (!deck) return null;
      const entries = (await read<DeckEntry>(KEYS.entries)).filter((e) => e.deckId === id);
      return { deck, entries };
    },
    async createDeck(name, format) {
      const decks = await read<Deck>(KEYS.decks);
      const ts = now();
      const deck: Deck = { id: newId(), name, format, createdAt: ts, updatedAt: ts };
      await write(KEYS.decks, [...decks, deck]);
      return deck;
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
