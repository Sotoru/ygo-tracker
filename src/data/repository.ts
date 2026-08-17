// Il seam dei repository: le interfacce che l'app consuma, più due helper puri di
// read-model. L'unica impl viva è su Neon (neon-repository.ts, neon-decks.ts); il
// cablaggio sta in store.ts. Nessun import React Native: gira anche in node.
import type { Deck, DeckEntry, DeckEntryInput, Format, WishlistItem, Zone } from '@/domain/types';

/**
 * Read-model per la lista: evita di caricare le entries per ogni deck. `cardCount`
 * conta solo il MAIN, il numero che vincola il formato. Qui `coverCardId` è la
 * copertina RISOLTA (esplicita ?? prima carta), `null` solo se il deck è vuoto: la
 * lista mostra un'immagine e non ha mai bisogno della scelta grezza. Il dettaglio
 * usa invece `Deck.coverCardId` (esplicito) per la stella.
 */
export type DeckSummary = Deck & { cardCount: number };

/** Extra/Side non contano per il 40-60. */
export const countMain = (entries: { zone: Zone; count: number }[]): number =>
  entries.reduce((n, e) => (e.zone === 'main' ? n + e.count : n), 0);

/** Impl: `neonWishlist` (Data API + RLS, client-only). */
export interface WishlistRepository {
  getWishlist(): Promise<WishlistItem[]>;
  /**
   * Riconcilia le rarità di una Card: per ogni (rarity, count) fa upsert se
   * count>0, rimuove se count<=0; le altre rarità del cardId restano intatte. Se
   * il risultato lascia almeno una rarità desiderata la carta torna Wanted (azzera
   * `obtainedAt` su tutte le sue righe, stato per-carta); una pura rimozione no.
   */
  setWishlistEntries(cardId: number, entries: { rarity: string; count: number }[]): Promise<void>;
  /** Su tutte le righe della Card: lo stato è per-carta, mai a metà. */
  setObtained(cardId: number, obtained: boolean): Promise<void>;
  /** Tutte le righe della Card, ogni rarità. */
  deleteCard(cardId: number): Promise<void>;
}

/** Impl: `neonDecks` (Neon + RLS). */
export interface DeckRepository {
  getDecks(): Promise<DeckSummary[]>;
  getDeck(id: string): Promise<{ deck: Deck; entries: DeckEntry[] } | null>;
  /** Con `entries` (import .ydk) le inserisce in blocco. */
  createDeck(name: string, format: Format, entries?: DeckEntryInput[]): Promise<Deck>;
  /** Bumpa updatedAt: è un edit significativo. */
  setDeckName(deckId: string, name: string): Promise<void>;
  /**
   * IN BLOCCO: delete-all + insert. Sorgente unica per il Salva dell'editor
   * (l'intera bozza) e per il re-import .ydk. Bumpa updatedAt. La cover esplicita
   * resta: se la carta non c'è più, `resolveCover` fa fallback.
   */
  replaceDeckEntries(deckId: string, entries: DeckEntryInput[]): Promise<void>;
  /** `null` azzera la scelta esplicita. */
  setDeckCover(deckId: string, cardId: number | null): Promise<void>;
  /** Bumpa updatedAt: è un edit significativo. */
  setDeckFormat(deckId: string, format: Format): Promise<void>;
  /** NON bumpa updatedAt: cambio di visibilità, non di contenuto. */
  setDeckPublic(deckId: string, isPublic: boolean): Promise<void>;
  deleteDeck(id: string): Promise<void>;
}

const ZONE_RANK: Record<Zone, number> = { main: 0, extra: 1, side: 2 };

/**
 * La scelta esplicita se ancora presente tra le carte, altrimenti la "prima" carta =
 * Main con card_id minimo, poi extra, poi side. L'ordine è arbitrario ma deterministico:
 * `deck_entries` non memorizza posizione. `null` solo se il deck è vuoto.
 */
export function resolveCover(coverCardId: number | null, entries: { cardId: number; zone: Zone }[]): number | null {
  if (coverCardId != null && entries.some((e) => e.cardId === coverCardId)) return coverCardId;
  const first = [...entries].sort((a, b) => ZONE_RANK[a.zone] - ZONE_RANK[b.zone] || a.cardId - b.cardId)[0];
  return first?.cardId ?? null;
}
