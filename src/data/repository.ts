// Il seam dei repository: le interfacce che l'app consuma, più due helper puri di
// read-model. L'unica impl viva è su Neon (neon-repository.ts, neon-decks.ts); il
// cablaggio sta in store.ts. Nessun import React Native: gira anche in node.
import type { Deck, DeckEntry, DeckEntryInput, Format, WishlistItem, Zone } from '@/domain/types';

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

/** La parte Wishlist del seam. Impl: `neonWishlist` (Data API + RLS, client-only). */
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

/** La parte Deck del seam. Impl: `neonDecks` (Neon + RLS). */
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
