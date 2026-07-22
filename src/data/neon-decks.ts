// DeckRepository su Neon Data API (PostgREST) con RLS via JWT, come la Wishlist
// (docs/adr/0005). Client-only, cross-platform. Traduce riga snake_case ↔ dominio.
// RLS filtra alle sole righe dell'utente: nessun .eq('user_id', …) qui.
import { client } from '@/data/auth';
import type { Deck, DeckEntry, Format, Zone } from '@/domain/types';
import { resolveCover, type DeckRepository } from './repository';

type DeckRow = { id: string; name: string; format: string; cover_card_id: number | null; created_at: string; updated_at: string };
type EntryRow = { id: string; deck_id: string; card_id: number; zone: string; count: number };

const toDeck = (r: DeckRow): Deck => ({
  id: r.id,
  name: r.name,
  format: r.format as Format, // il DB tiene text; il dominio restringe (validato lato app)
  coverCardId: r.cover_card_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const toEntry = (r: EntryRow): DeckEntry => ({
  id: r.id,
  deckId: r.deck_id,
  cardId: r.card_id,
  zone: r.zone as Zone,
  count: r.count,
});

export const neonDecks: DeckRepository = {
  async getDecks() {
    const { data: decks, error } = await client.from('decks').select().order('updated_at', { ascending: false });
    if (error) throw error;
    // count + copertina in una sola query aggiuntiva (non una per deck): raggruppo lato client.
    const { data: entries, error: e2 } = await client.from('deck_entries').select('deck_id, card_id, zone, count');
    if (e2) throw e2;
    const byDeck = new Map<string, Pick<EntryRow, 'card_id' | 'zone' | 'count'>[]>();
    for (const r of (entries ?? []) as Pick<EntryRow, 'deck_id' | 'card_id' | 'zone' | 'count'>[]) {
      const arr = byDeck.get(r.deck_id);
      if (arr) arr.push(r);
      else byDeck.set(r.deck_id, [r]);
    }
    return (decks ?? []).map((d) => {
      const deck = toDeck(d as DeckRow);
      const own = byDeck.get(deck.id) ?? [];
      return {
        ...deck,
        cardCount: own.reduce((n, e) => n + e.count, 0),
        coverCardId: resolveCover(deck.coverCardId, own.map((e) => ({ cardId: e.card_id, zone: e.zone as Zone }))),
      };
    });
  },

  async getDeck(id) {
    const { data: decks, error } = await client.from('decks').select().eq('id', id);
    if (error) throw error;
    const row = (decks ?? [])[0] as DeckRow | undefined;
    if (!row) return null;
    const { data: entries, error: e2 } = await client.from('deck_entries').select().eq('deck_id', id);
    if (e2) throw e2;
    return { deck: toDeck(row), entries: ((entries ?? []) as EntryRow[]).map(toEntry) };
  },

  // ponytail: NON atomico — insert deck + insert entries sono due round-trip. Ok per
  // single-user, un tap "Crea". Se l'incoerenza parziale morde, promuovi a una RPC.
  async createDeck(name, format, entries) {
    // user_id/id/timestamp omessi: default lato DB.
    const { data, error } = await client.from('decks').insert({ name, format }).select().single();
    if (error) throw error;
    const deck = toDeck(data as DeckRow);
    if (entries?.length) {
      const { error: e2 } = await client
        .from('deck_entries')
        .insert(entries.map((e) => ({ deck_id: deck.id, card_id: e.cardId, zone: e.zone, count: e.count })));
      if (e2) throw e2;
    }
    return deck;
  },

  async setDeckName(deckId, name) {
    // rename = edit significativo: bumpo updated_at (nessun trigger, come setDeckFormat).
    const { error } = await client
      .from('decks')
      .update({ name, updated_at: new Date().toISOString() })
      .eq('id', deckId);
    if (error) throw error;
  },

  // ponytail: NON atomico — delete + insert sono due round-trip (come createDeck). Se
  // l'insert fallisce dopo il delete il deck resta vuoto; ok per single-user. Se
  // l'incoerenza parziale morde, promuovi a una RPC transazionale.
  async replaceDeckEntries(deckId, entries) {
    const { error } = await client.from('deck_entries').delete().eq('deck_id', deckId);
    if (error) throw error;
    if (entries.length) {
      const { error: e2 } = await client
        .from('deck_entries')
        .insert(entries.map((e) => ({ deck_id: deckId, card_id: e.cardId, zone: e.zone, count: e.count })));
      if (e2) throw e2;
    }
    const { error: e3 } = await client
      .from('decks')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', deckId);
    if (e3) throw e3;
  },

  async setDeckCover(deckId, cardId) {
    // scelta estetica: NON tocco updated_at (non riordino la lista per un cambio copertina).
    const { error } = await client.from('decks').update({ cover_card_id: cardId }).eq('id', deckId);
    if (error) throw error;
  },

  async setDeckFormat(deckId, format) {
    // niente trigger su updated_at (decks.sql): lo bumpo a mano, è un edit significativo.
    const { error } = await client
      .from('decks')
      .update({ format, updated_at: new Date().toISOString() })
      .eq('id', deckId);
    if (error) throw error;
  },

  async deleteDeck(id) {
    // le entries cadono per ON DELETE CASCADE (decks.sql); RLS limita alle proprie righe.
    const { error } = await client.from('decks').delete().eq('id', id);
    if (error) throw error;
  },
};
