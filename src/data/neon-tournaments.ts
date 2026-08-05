// TournamentRepository su Neon Data API. Catalogo editoriale separato dai Deck
// personali: anonymous/auth non-admin leggono solo published via RLS; admin scrive.
import { client } from '@/data/auth';
import {
  PLACEMENTS,
  type DeckEntryInput,
  type Format,
  type Placement,
  type Tournament,
  type TournamentDeck,
  type TournamentDeckEntry,
  type TournamentDeckStatus,
  type Zone,
} from '@/domain/types';
import { resolveCover } from './repository';

export type TournamentSummary = Tournament & { publishedDeckCount: number };
export type TournamentDeckSummary = TournamentDeck & { cardCount: number };

export interface TournamentRepository {
  getTournaments(format?: Format): Promise<TournamentSummary[]>;
  getTournament(id: string): Promise<{ tournament: Tournament; decks: TournamentDeckSummary[] } | null>;
  getTournamentDeck(id: string): Promise<{ deck: TournamentDeck; tournament: Tournament; entries: TournamentDeckEntry[] } | null>;
  getAdminTournaments(): Promise<TournamentSummary[]>;
  getAdminTournament(id: string): Promise<{ tournament: Tournament; decks: TournamentDeckSummary[] } | null>;
  createTournament(input: { name: string; format: Format; date: string; location?: string | null }): Promise<Tournament>;
  updateTournament(id: string, input: { name: string; format: Format; date: string; location?: string | null }): Promise<void>;
  deleteTournament(id: string): Promise<void>;
  createTournamentDeck(input: {
    tournamentId: string;
    name: string;
    format: Format;
    placement: Placement;
    entries: DeckEntryInput[];
    playerName?: string | null;
    coverCardId?: number | null;
    sourceUrl?: string | null;
  }): Promise<TournamentDeck>;
  updateTournamentDeck(
    id: string,
    input: {
      name: string;
      format: Format;
      placement: Placement;
      playerName?: string | null;
      coverCardId?: number | null;
      sourceUrl?: string | null;
    },
  ): Promise<void>;
  replaceTournamentDeckEntries(id: string, entries: DeckEntryInput[]): Promise<void>;
  setTournamentDeckStatus(id: string, status: TournamentDeckStatus): Promise<void>;
  deleteTournamentDeck(id: string): Promise<void>;
}

type TournamentRow = {
  id: string;
  name: string;
  format: string;
  date: string;
  location: string | null;
  created_at: string;
  updated_at: string;
};

type TournamentDeckRow = {
  id: string;
  tournament_id: string;
  name: string;
  player_name: string | null;
  placement: string;
  format: string;
  cover_card_id: number | null;
  source_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type TournamentDeckEntryRow = {
  id: string;
  tournament_deck_id: string;
  card_id: number;
  zone: string;
  count: number;
};

const toTournament = (r: TournamentRow): Tournament => ({
  id: r.id,
  name: r.name,
  format: r.format as Format,
  date: r.date,
  location: r.location,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toTournamentDeck = (r: TournamentDeckRow): TournamentDeck => ({
  id: r.id,
  tournamentId: r.tournament_id,
  name: r.name,
  playerName: r.player_name,
  placement: r.placement as Placement,
  format: r.format as Format,
  coverCardId: r.cover_card_id,
  sourceUrl: r.source_url,
  status: r.status as TournamentDeckStatus,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const toTournamentDeckEntry = (r: TournamentDeckEntryRow): TournamentDeckEntry => ({
  id: r.id,
  tournamentDeckId: r.tournament_deck_id,
  cardId: r.card_id,
  zone: r.zone as Zone,
  count: r.count,
});

function withCounts(tournaments: Tournament[], decks: TournamentDeck[]): TournamentSummary[] {
  const counts = new Map<string, number>();
  for (const d of decks) {
    if (d.status !== 'published') continue;
    counts.set(d.tournamentId, (counts.get(d.tournamentId) ?? 0) + 1);
  }
  return tournaments.map((t) => ({ ...t, publishedDeckCount: counts.get(t.id) ?? 0 }));
}

function withDeckCounts(decks: TournamentDeck[], entries: Pick<TournamentDeckEntry, 'tournamentDeckId' | 'cardId' | 'zone' | 'count'>[]): TournamentDeckSummary[] {
  const byDeck = new Map<string, Pick<TournamentDeckEntry, 'cardId' | 'zone' | 'count'>[]>();
  for (const e of entries) {
    const arr = byDeck.get(e.tournamentDeckId);
    if (arr) arr.push(e);
    else byDeck.set(e.tournamentDeckId, [e]);
  }
  return decks
    .map((deck) => {
      const own = byDeck.get(deck.id) ?? [];
      return {
        ...deck,
        cardCount: own.reduce((n, e) => n + e.count, 0),
        coverCardId: resolveCover(deck.coverCardId, own),
      };
    })
    .sort((a, b) => PLACEMENTS[a.placement].rank - PLACEMENTS[b.placement].rank || a.name.localeCompare(b.name));
}

export const neonTournaments: TournamentRepository = {
  async getTournaments(format) {
    let q = client.from('tournaments').select().order('date', { ascending: false });
    if (format) q = q.eq('format', format);
    const { data: tournaments, error } = await q;
    if (error) throw error;
    const ids = ((tournaments ?? []) as TournamentRow[]).map((t) => t.id);
    if (!ids.length) return [];
    const { data: decks, error: e2 } = await client
      .from('tournament_decks')
      .select('id, tournament_id, name, player_name, placement, format, cover_card_id, source_url, status, created_at, updated_at')
      .in('tournament_id', ids)
      .eq('status', 'published');
    if (e2) throw e2;
    return withCounts(((tournaments ?? []) as TournamentRow[]).map(toTournament), ((decks ?? []) as TournamentDeckRow[]).map(toTournamentDeck))
      .filter((t) => t.publishedDeckCount > 0);
  },

  async getTournament(id) {
    const { data: tournaments, error } = await client.from('tournaments').select().eq('id', id);
    if (error) throw error;
    const row = (tournaments ?? [])[0] as TournamentRow | undefined;
    if (!row) return null;
    const { data: decks, error: e2 } = await client.from('tournament_decks').select().eq('tournament_id', id).eq('status', 'published');
    if (e2) throw e2;
    const deckRows = (decks ?? []) as TournamentDeckRow[];
    const deckIds = deckRows.map((d) => d.id);
    const entries = deckIds.length
      ? await client.from('tournament_deck_entries').select('tournament_deck_id, card_id, zone, count').in('tournament_deck_id', deckIds)
      : { data: [], error: null };
    if (entries.error) throw entries.error;
    return {
      tournament: toTournament(row),
      decks: withDeckCounts(deckRows.map(toTournamentDeck), ((entries.data ?? []) as TournamentDeckEntryRow[]).map(toTournamentDeckEntry)),
    };
  },

  async getTournamentDeck(id) {
    const { data: decks, error } = await client.from('tournament_decks').select().eq('id', id);
    if (error) throw error;
    const deckRow = (decks ?? [])[0] as TournamentDeckRow | undefined;
    if (!deckRow) return null;
    const { data: tournaments, error: e2 } = await client.from('tournaments').select().eq('id', deckRow.tournament_id);
    if (e2) throw e2;
    const tournamentRow = (tournaments ?? [])[0] as TournamentRow | undefined;
    if (!tournamentRow) return null;
    const { data: entries, error: e3 } = await client.from('tournament_deck_entries').select().eq('tournament_deck_id', id);
    if (e3) throw e3;
    return {
      deck: toTournamentDeck(deckRow),
      tournament: toTournament(tournamentRow),
      entries: ((entries ?? []) as TournamentDeckEntryRow[]).map(toTournamentDeckEntry),
    };
  },

  async getAdminTournaments() {
    const { data: tournaments, error } = await client.from('tournaments').select().order('date', { ascending: false });
    if (error) throw error;
    const { data: decks, error: e2 } = await client.from('tournament_decks').select();
    if (e2) throw e2;
    return withCounts(((tournaments ?? []) as TournamentRow[]).map(toTournament), ((decks ?? []) as TournamentDeckRow[]).map(toTournamentDeck));
  },

  async getAdminTournament(id) {
    const { data: tournaments, error } = await client.from('tournaments').select().eq('id', id);
    if (error) throw error;
    const row = (tournaments ?? [])[0] as TournamentRow | undefined;
    if (!row) return null;
    const { data: decks, error: e2 } = await client.from('tournament_decks').select().eq('tournament_id', id);
    if (e2) throw e2;
    const deckRows = (decks ?? []) as TournamentDeckRow[];
    const deckIds = deckRows.map((d) => d.id);
    const entries = deckIds.length
      ? await client.from('tournament_deck_entries').select('tournament_deck_id, card_id, zone, count').in('tournament_deck_id', deckIds)
      : { data: [], error: null };
    if (entries.error) throw entries.error;
    return {
      tournament: toTournament(row),
      decks: withDeckCounts(deckRows.map(toTournamentDeck), ((entries.data ?? []) as TournamentDeckEntryRow[]).map(toTournamentDeckEntry)),
    };
  },

  async createTournament(input) {
    const { data, error } = await client
      .from('tournaments')
      .insert({ name: input.name, format: input.format, date: input.date, location: input.location || null })
      .select()
      .single();
    if (error) throw error;
    return toTournament(data as TournamentRow);
  },

  async updateTournament(id, input) {
    const { error } = await client
      .from('tournaments')
      .update({ name: input.name, format: input.format, date: input.date, location: input.location || null, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
    const { error: e2 } = await client
      .from('tournament_decks')
      .update({ format: input.format, updated_at: new Date().toISOString() })
      .eq('tournament_id', id);
    if (e2) throw e2;
  },

  async deleteTournament(id) {
    const { error } = await client.from('tournaments').delete().eq('id', id);
    if (error) throw error;
  },

  async createTournamentDeck(input) {
    const { data, error } = await client
      .from('tournament_decks')
      .insert({
        tournament_id: input.tournamentId,
        name: input.name,
        format: input.format,
        placement: input.placement,
        player_name: input.playerName || null,
        cover_card_id: input.coverCardId ?? null,
        source_url: input.sourceUrl || null,
      })
      .select()
      .single();
    if (error) throw error;
    const deck = toTournamentDeck(data as TournamentDeckRow);
    if (input.entries.length) {
      const { error: e2 } = await client
        .from('tournament_deck_entries')
        .insert(input.entries.map((e) => ({ tournament_deck_id: deck.id, card_id: e.cardId, zone: e.zone, count: e.count })));
      if (e2) throw e2;
    }
    return deck;
  },

  async updateTournamentDeck(id, input) {
    const { error } = await client
      .from('tournament_decks')
      .update({
        name: input.name,
        format: input.format,
        placement: input.placement,
        player_name: input.playerName || null,
        cover_card_id: input.coverCardId ?? null,
        source_url: input.sourceUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (error) throw error;
  },

  async replaceTournamentDeckEntries(id, entries) {
    const { error } = await client.from('tournament_deck_entries').delete().eq('tournament_deck_id', id);
    if (error) throw error;
    if (entries.length) {
      const { error: e2 } = await client
        .from('tournament_deck_entries')
        .insert(entries.map((e) => ({ tournament_deck_id: id, card_id: e.cardId, zone: e.zone, count: e.count })));
      if (e2) throw e2;
    }
    const { error: e3 } = await client.from('tournament_decks').update({ updated_at: new Date().toISOString() }).eq('id', id);
    if (e3) throw e3;
  },

  async setTournamentDeckStatus(id, status) {
    const { error } = await client.from('tournament_decks').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async deleteTournamentDeck(id) {
    const { error } = await client.from('tournament_decks').delete().eq('id', id);
    if (error) throw error;
  },
};
