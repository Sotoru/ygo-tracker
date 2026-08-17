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
import { firstRow, row, rows, run } from './neon-query';
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

const now = () => new Date().toISOString();

const entryRowsFor = (tournamentDeckId: string, entries: DeckEntryInput[]) =>
  entries.map((e) => ({ tournament_deck_id: tournamentDeckId, card_id: e.cardId, zone: e.zone, count: e.count }));

// Torneo + i suoi deck con conteggio carte. La vista pubblica e quella admin
// differiscono solo per il filtro `status`: una funzione, un flag.
async function tournamentWithDecks(id: string, publishedOnly: boolean) {
  const tournamentRow = await firstRow<TournamentRow>(client.from('tournaments').select().eq('id', id));
  if (!tournamentRow) return null;
  let deckQuery = client.from('tournament_decks').select().eq('tournament_id', id);
  if (publishedOnly) deckQuery = deckQuery.eq('status', 'published');
  const deckRows = await rows<TournamentDeckRow>(deckQuery);
  const deckIds = deckRows.map((d) => d.id);
  const entryRows = deckIds.length
    ? await rows<TournamentDeckEntryRow>(
        client
          .from('tournament_deck_entries')
          .select('tournament_deck_id, card_id, zone, count')
          .in('tournament_deck_id', deckIds),
      )
    : [];
  return {
    tournament: toTournament(tournamentRow),
    decks: withDeckCounts(deckRows.map(toTournamentDeck), entryRows.map(toTournamentDeckEntry)),
  };
}

export const neonTournaments: TournamentRepository = {
  async getTournaments(format) {
    let q = client.from('tournaments').select().order('date', { ascending: false });
    if (format) q = q.eq('format', format);
    const tournamentRows = await rows<TournamentRow>(q);
    const ids = tournamentRows.map((t) => t.id);
    if (!ids.length) return [];
    const deckRows = await rows<TournamentDeckRow>(
      client
        .from('tournament_decks')
        .select('id, tournament_id, name, player_name, placement, format, cover_card_id, source_url, status, created_at, updated_at')
        .in('tournament_id', ids)
        .eq('status', 'published'),
    );
    // il catalogo pubblico mostra solo tornei che hanno almeno un deck pubblicato.
    return withCounts(tournamentRows.map(toTournament), deckRows.map(toTournamentDeck)).filter((t) => t.publishedDeckCount > 0);
  },

  getTournament(id) {
    return tournamentWithDecks(id, true);
  },

  async getTournamentDeck(id) {
    const deckRow = await firstRow<TournamentDeckRow>(client.from('tournament_decks').select().eq('id', id));
    if (!deckRow) return null;
    const tournamentRow = await firstRow<TournamentRow>(client.from('tournaments').select().eq('id', deckRow.tournament_id));
    if (!tournamentRow) return null;
    const entryRows = await rows<TournamentDeckEntryRow>(
      client.from('tournament_deck_entries').select().eq('tournament_deck_id', id),
    );
    return {
      deck: toTournamentDeck(deckRow),
      tournament: toTournament(tournamentRow),
      entries: entryRows.map(toTournamentDeckEntry),
    };
  },

  async getAdminTournaments() {
    const tournamentRows = await rows<TournamentRow>(client.from('tournaments').select().order('date', { ascending: false }));
    const deckRows = await rows<TournamentDeckRow>(client.from('tournament_decks').select());
    return withCounts(tournamentRows.map(toTournament), deckRows.map(toTournamentDeck));
  },

  getAdminTournament(id) {
    return tournamentWithDecks(id, false);
  },

  async createTournament(input) {
    return toTournament(
      await row<TournamentRow>(
        client
          .from('tournaments')
          .insert({ name: input.name, format: input.format, date: input.date, location: input.location || null })
          .select()
          .single(),
      ),
    );
  },

  async updateTournament(id, input) {
    await run(
      client
        .from('tournaments')
        .update({ name: input.name, format: input.format, date: input.date, location: input.location || null, updated_at: now() })
        .eq('id', id),
    );
    // il formato del torneo è la fonte: allineo i deck già inseriti.
    await run(client.from('tournament_decks').update({ format: input.format, updated_at: now() }).eq('tournament_id', id));
  },

  async deleteTournament(id) {
    await run(client.from('tournaments').delete().eq('id', id));
  },

  // ponytail: NON atomico — insert deck + insert entries sono due round-trip (come
  // createDeck). Se l'incoerenza parziale morde, promuovi a una RPC transazionale.
  async createTournamentDeck(input) {
    const deck = toTournamentDeck(
      await row<TournamentDeckRow>(
        client
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
          .single(),
      ),
    );
    if (input.entries.length) {
      await run(client.from('tournament_deck_entries').insert(entryRowsFor(deck.id, input.entries)));
    }
    return deck;
  },

  async updateTournamentDeck(id, input) {
    await run(
      client
        .from('tournament_decks')
        .update({
          name: input.name,
          format: input.format,
          placement: input.placement,
          player_name: input.playerName || null,
          cover_card_id: input.coverCardId ?? null,
          source_url: input.sourceUrl || null,
          updated_at: now(),
        })
        .eq('id', id),
    );
  },

  // ponytail: NON atomico — delete + insert sono due round-trip (come replaceDeckEntries).
  async replaceTournamentDeckEntries(id, entries) {
    await run(client.from('tournament_deck_entries').delete().eq('tournament_deck_id', id));
    if (entries.length) {
      await run(client.from('tournament_deck_entries').insert(entryRowsFor(id, entries)));
    }
    await run(client.from('tournament_decks').update({ updated_at: now() }).eq('id', id));
  },

  async setTournamentDeckStatus(id, status) {
    await run(client.from('tournament_decks').update({ status, updated_at: now() }).eq('id', id));
  },

  async deleteTournamentDeck(id) {
    await run(client.from('tournament_decks').delete().eq('id', id));
  },
};
