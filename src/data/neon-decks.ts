// DeckRepository su Neon Data API (PostgREST) con RLS via JWT, come la Wishlist
// Client-only, cross-platform. Traduce riga snake_case ↔ dominio.
// RLS filtra alle sole righe dell'utente: nessun .eq('user_id', …) qui.
import { client } from '@/data/auth';
import type { Deck, DeckEntry, Format, Zone } from '@/domain/types';
import { firstRow, row, rows, run } from './neon-query';
import { countMain, resolveCover, type DeckRepository } from './repository';

type DeckRow = { id: string; name: string; format: string; cover_card_id: number | null; is_public: boolean; created_at: string; updated_at: string };
type EntryRow = { id: string; deck_id: string; card_id: number; zone: string; count: number };

const toDeck = (r: DeckRow): Deck => ({
  id: r.id,
  name: r.name,
  format: r.format as Format, // il DB tiene text; il dominio restringe (validato lato app)
  coverCardId: r.cover_card_id,
  isPublic: r.is_public,
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

const now = () => new Date().toISOString();

const entryRowsFor = (deckId: string, entries: { cardId: number; zone: Zone; count: number }[]) =>
  entries.map((e) => ({ deck_id: deckId, card_id: e.cardId, zone: e.zone, count: e.count }));

export const neonDecks: DeckRepository = {
  async getDecks() {
    const deckRows = await rows<DeckRow>(client.from('decks').select().order('updated_at', { ascending: false }));
    // count + copertina in una sola query aggiuntiva (non una per deck): raggruppo lato client.
    const entryRows = await rows<Pick<EntryRow, 'deck_id' | 'card_id' | 'zone' | 'count'>>(
      client.from('deck_entries').select('deck_id, card_id, zone, count'),
    );
    const byDeck = new Map<string, Pick<EntryRow, 'card_id' | 'zone' | 'count'>[]>();
    for (const r of entryRows) {
      const arr = byDeck.get(r.deck_id);
      if (arr) arr.push(r);
      else byDeck.set(r.deck_id, [r]);
    }
    return deckRows.map((d) => {
      const deck = toDeck(d);
      const own = byDeck.get(deck.id) ?? [];
      return {
        ...deck,
        cardCount: countMain(own.map((e) => ({ zone: e.zone as Zone, count: e.count }))),
        coverCardId: resolveCover(deck.coverCardId, own.map((e) => ({ cardId: e.card_id, zone: e.zone as Zone }))),
      };
    });
  },

  async getDeck(id) {
    const deckRow = await firstRow<DeckRow>(client.from('decks').select().eq('id', id));
    if (!deckRow) return null;
    const entryRows = await rows<EntryRow>(client.from('deck_entries').select().eq('deck_id', id));
    return { deck: toDeck(deckRow), entries: entryRows.map(toEntry) };
  },

  // ponytail: NON atomico — insert deck + insert entries sono due round-trip. Ok per
  // single-user, un tap "Crea". Se l'incoerenza parziale morde, promuovi a una RPC.
  async createDeck(name, format, entries) {
    // user_id/id/timestamp omessi: default lato DB.
    const deck = toDeck(await row<DeckRow>(client.from('decks').insert({ name, format }).select().single()));
    if (entries?.length) {
      await run(client.from('deck_entries').insert(entryRowsFor(deck.id, entries)));
    }
    return deck;
  },

  async setDeckName(deckId, name) {
    // rename = edit significativo: bumpo updated_at (nessun trigger, come setDeckFormat).
    await run(client.from('decks').update({ name, updated_at: now() }).eq('id', deckId));
  },

  // ponytail: NON atomico — delete + insert sono due round-trip (come createDeck). Se
  // l'insert fallisce dopo il delete il deck resta vuoto; ok per single-user. Se
  // l'incoerenza parziale morde, promuovi a una RPC transazionale.
  async replaceDeckEntries(deckId, entries) {
    await run(client.from('deck_entries').delete().eq('deck_id', deckId));
    if (entries.length) {
      await run(client.from('deck_entries').insert(entryRowsFor(deckId, entries)));
    }
    await run(client.from('decks').update({ updated_at: now() }).eq('id', deckId));
  },

  async setDeckCover(deckId, cardId) {
    // scelta estetica: NON tocco updated_at (non riordino la lista per un cambio copertina).
    await run(client.from('decks').update({ cover_card_id: cardId }).eq('id', deckId));
  },

  async setDeckFormat(deckId, format) {
    // niente trigger su updated_at (decks.sql): lo bumpo a mano, è un edit significativo.
    await run(client.from('decks').update({ format, updated_at: now() }).eq('id', deckId));
  },

  async setDeckPublic(deckId, isPublic) {
    // cambio di visibilità: NON tocco updated_at (come setDeckCover).
    await run(client.from('decks').update({ is_public: isPublic }).eq('id', deckId));
  },

  async deleteDeck(id) {
    // le entries cadono per ON DELETE CASCADE (decks.sql).
    await run(client.from('decks').delete().eq('id', id));
  },
};
