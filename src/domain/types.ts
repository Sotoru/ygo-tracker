// Modello dati local-first in forma relazionale, così l'export verso Neon + Drizzle
// è un import di tabelle e non un redesign. Vedi CONTEXT.MD e docs/adr/0001.

/** Il retro format per cui un Deck è costruito. Elenco estendibile (data-driven). */
export type Format = 'goat' | 'edison' | 'hat' | 'tengu' | 'redu';

/** Le tre zone di un Deck. La zona di una Card è in parte determinata dal suo tipo. */
export type Zone = 'main' | 'extra' | 'side';

/** Card Type: la categoria di gioco di una Card, derivata dal frameType (vedi CONTEXT.md). */
export type CardType = 'monster' | 'spell' | 'trap';

/** I Card Type nell'ordine in cui si presentano dentro una Zone (come in un file .ydk). */
export const CARD_TYPES: CardType[] = ['monster', 'spell', 'trap'];

/** Le zone in ordine di presentazione, con l'etichetta UI: un solo elenco per tutte le schermate. */
export const ZONES: { zone: Zone; label: string }[] = [
  { zone: 'main', label: 'Main' },
  { zone: 'extra', label: 'Extra' },
  { zone: 'side', label: 'Side' },
];

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
  // Banlist statiche popolate in banlists.ts (ADR 0003). poolCutoffDate ("Card Pool")
  // resta il task dati aperto.
  goat: { label: 'Goat', poolCutoffDate: null },
  edison: { label: 'Edison', poolCutoffDate: null },
  hat: { label: 'HAT', poolCutoffDate: null },
  tengu: { label: 'Tengu', poolCutoffDate: null },
  redu: { label: 'REDU', poolCutoffDate: null },
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
  coverCardId: number | null; // scelta ESPLICITA della carta "in evidenza"; null = fallback alla prima carta
  isPublic: boolean; // visibilità: privato di default; se true è leggibile dal ruolo anonymous (RLS)
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

/** Voce da importare (es. da un .ydk): senza id/deckId, li assegna il repository. */
export interface DeckEntryInput {
  cardId: number;
  zone: Zone;
  count: number;
}

export type Placement = 'winner' | 'runnerUp' | 'top4' | 'top8' | 'top16' | 'top32' | 'top64';
export type TournamentDeckStatus = 'draft' | 'published';

export const PLACEMENTS: Record<Placement, { label: string; rank: number }> = {
  winner: { label: 'Winner', rank: 0 },
  runnerUp: { label: 'Runner-up', rank: 1 },
  top4: { label: 'Top 4', rank: 2 },
  top8: { label: 'Top 8', rank: 3 },
  top16: { label: 'Top 16', rank: 4 },
  top32: { label: 'Top 32', rank: 5 },
  top64: { label: 'Top 64', rank: 6 },
};

export interface Tournament {
  id: string;
  name: string;
  format: Format;
  date: string;
  location: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDeck {
  id: string;
  tournamentId: string;
  name: string;
  playerName: string | null;
  placement: Placement;
  format: Format;
  coverCardId: number | null;
  sourceUrl: string | null;
  status: TournamentDeckStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentDeckEntry {
  id: string;
  tournamentDeckId: string;
  cardId: number;
  zone: Zone;
  count: number;
}

/** Dump relazionale completo, pronto per l'import in Postgres/Drizzle. */
export interface Snapshot {
  decks: Deck[];
  deckEntries: DeckEntry[];
  wishlistItems: WishlistItem[];
}
