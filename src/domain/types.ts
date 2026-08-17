// Modello dati in forma relazionale (decks, deck_entries, wishlist_items): la
// stessa forma delle tabelle su Neon, definite in db/*.sql. Vedi CONTEXT.md.

export type Format = 'goat' | 'edison' | 'hat' | 'tengu' | 'redu';

export type Zone = 'main' | 'extra' | 'side';

/** Derivata dal `frameType` di YGOPRODeck, non da un campo nostro. */
export type CardType = 'monster' | 'spell' | 'trap';

/** Ordine in cui si presentano dentro una Zone (come in un file .ydk). */
export const CARD_TYPES: CardType[] = ['monster', 'spell', 'trap'];

/** Ordine di presentazione ed etichette: un solo elenco per tutte le schermate. */
export const ZONES: { zone: Zone; label: string }[] = [
  { zone: 'main', label: 'Main' },
  { zone: 'extra', label: 'Extra' },
  { zone: 'side', label: 'Side' },
];

export type BanStatus = 'forbidden' | 'limited' | 'semiLimited' | 'unlimited';

export const COPIES_BY_BAN_STATUS: Record<BanStatus, number> = {
  forbidden: 0,
  limited: 1,
  semiLimited: 2,
  unlimited: 3,
};

/** Registro dei formati: aggiungere un format = aggiungere una voce, non codice. */
export const FORMATS: Record<Format, { label: string; poolCutoffDate: string | null }> = {
  // Banlist popolate in banlists.ts; poolCutoffDate ("Card Pool") è il task dati
  // aperto, per questo sono tutti null.
  goat: { label: 'Goat', poolCutoffDate: null },
  edison: { label: 'Edison', poolCutoffDate: null },
  hat: { label: 'HAT', poolCutoffDate: null },
  tengu: { label: 'Tengu', poolCutoffDate: null },
  redu: { label: 'REDU', poolCutoffDate: null },
};

/** In ordine di registro: l'ordine di dichiarazione di FORMATS è quello di presentazione. */
export const FORMAT_LIST = Object.keys(FORMATS) as Format[];

// --- "Tabelle" (righe). Si salvano solo dati utente + riferimenti alle carte
// --- (cardId), mai il payload delle carte: quello vive nella cache di TanStack Query.

/** Riga di `wishlist_items`. Identità naturale: (cardId, rarity). */
export interface WishlistItem {
  id: string;
  cardId: number; // id YGOPRODeck della Card
  rarity: string; // es. "Ultra Rare" — il Set è ignorato (vedi CONTEXT.md)
  count: number; // copie desiderate (1..9); 0 non si salva (rimuove la voce)
  addedAt: string; // ISO 8601
  // Wanted/Obtained: assente = "Da prendere", valorizzato = "Presa". Stato
  // per-carta, uniforme su tutte le rarità (vedi CONTEXT.md).
  obtainedAt?: string; // ISO 8601
}

/** Riga di `decks`. */
export interface Deck {
  id: string;
  name: string;
  format: Format;
  coverCardId: number | null; // scelta ESPLICITA della carta "in evidenza"; null = fallback alla prima carta
  isPublic: boolean; // privato di default; se true è leggibile dal ruolo anonymous (RLS)
  createdAt: string;
  updatedAt: string;
}

/** Riga di `deck_entries`. Identità naturale: (deckId, cardId, zone). */
export interface DeckEntry {
  id: string;
  deckId: string; // FK -> decks.id
  cardId: number; // id YGOPRODeck della Card
  zone: Zone;
  count: number; // 1..3
}

/** Voce da importare (es. da un .ydk): id e deckId li assegna il repository. */
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
