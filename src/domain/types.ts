// Modello dati local-first in forma relazionale, così l'export verso Neon + Drizzle
// è un import di tabelle e non un redesign. Vedi CONTEXT.MD e docs/adr/0001.

/** Il retro format per cui un Deck è costruito. Elenco estendibile (data-driven). */
export type Format = 'goat' | 'edison' | 'hat' | 'tengu';

/** Le tre zone di un Deck. La zona di una Card è in parte determinata dal suo tipo. */
export type Zone = 'main' | 'extra' | 'side';

/** Stato di una Card nella Banlist di un Format. */
export type BanStatus = 'forbidden' | 'limited' | 'semiLimited' | 'unlimited';

/** Copie massime consentite per Ban Status (usate dalla validazione soft). */
export const COPIES_BY_BAN_STATUS: Record<BanStatus, number> = {
  forbidden: 0,
  limited: 1,
  semiLimited: 2,
  unlimited: 3,
};

/** Registro dei formati: aggiungere un format = aggiungere una voce, non codice. */
export const FORMATS: Record<Format, { label: string; poolCutoffDate: string | null }> = {
  // ponytail: banlist statiche e cutoff reali sono il task dati aperto (ADR 0003).
  goat: { label: 'Goat', poolCutoffDate: null },
  edison: { label: 'Edison', poolCutoffDate: null },
  hat: { label: 'HAT', poolCutoffDate: null },
  tengu: { label: 'Tengu', poolCutoffDate: null },
};

// --- "Tabelle" (righe). Si salvano solo dati utente + riferimenti alle carte
// --- (cardId), mai il payload delle carte: quello vive nella cache di TanStack Query.

/** Riga di `wishlist_items`: una (Card, Rarity) desiderata. Identità naturale: (cardId, rarity). */
export interface WishlistItem {
  id: string;
  cardId: number; // id YGOPRODeck della Card
  rarity: string; // es. "Ultra Rare" — il Set è ignorato (vedi CONTEXT.md)
  count: number; // copie desiderate (1..9); 0 non si salva (rimuove la voce)
  addedAt: string; // ISO 8601
  // Ciclo di vita Wanted/Obtained (vedi CONTEXT.md): assente = "Da prendere",
  // valorizzato = "Presa". Stato per-carta: uniforme su tutte le rarità di una Card.
  obtainedAt?: string; // ISO 8601
}

/** Riga di `decks`: metadati del mazzo. */
export interface Deck {
  id: string;
  name: string;
  format: Format;
  createdAt: string;
  updatedAt: string;
}

/** Riga di `deck_entries`: una Card in una zona di un Deck. Identità naturale: (deckId, cardId, zone). */
export interface DeckEntry {
  id: string;
  deckId: string; // FK -> decks.id
  cardId: number; // id YGOPRODeck della Card
  zone: Zone;
  count: number; // 1..3
}

/** Dump relazionale completo, pronto per l'import in Postgres/Drizzle. */
export interface Snapshot {
  decks: Deck[];
  deckEntries: DeckEntry[];
  wishlistItems: WishlistItem[];
}
