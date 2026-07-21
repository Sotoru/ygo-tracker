// WishlistRepository su Neon Data API (PostgREST) con RLS via JWT: il client parla
// diretto a Neon, il confine di sicurezza è nel DB (docs/adr/0005). Client-only,
// cross-platform (fetch, nessuna API web-only). Traduce riga snake_case ↔ dominio.
import { client } from '@/data/auth';
import type { WishlistItem } from '@/domain/types';
import type { WishlistRepository } from './repository';
import { planEntries } from './wishlist-plan';

const TABLE = 'wishlist_items';

// Riga DB → dominio. id/user_id/added_at li mette il DB; obtained_at null → undefined
// (il dominio distingue "assente" = Da prendere, vedi domain/types.ts).
type Row = { id: string; card_id: number; rarity: string; count: number; added_at: string; obtained_at: string | null };
const toDomain = (r: Row): WishlistItem => ({
  id: r.id,
  cardId: r.card_id,
  rarity: r.rarity,
  count: r.count,
  addedAt: r.added_at,
  obtainedAt: r.obtained_at ?? undefined,
});

export const neonWishlist: WishlistRepository = {
  async getWishlist() {
    // RLS filtra alle sole righe dell'utente: nessun .eq('user_id', …) qui.
    const { data, error } = await client.from(TABLE).select();
    if (error) throw error;
    return (data ?? []).map(toDomain);
  },

  // ponytail: NON atomico — upsert + delete + reset sono round-trip separati (Q5).
  // Ok per single-user, un tap "Salva". Se l'incoerenza parziale morde, promuovi a
  // una RPC Postgres transazionale (client.rpc('set_wishlist_entries', …)).
  async setWishlistEntries(cardId, entries) {
    const { toUpsert, toDelete, resetObtained } = planEntries(entries);
    // user_id/id/added_at omessi: default lato DB. onConflict = chiave naturale.
    if (toUpsert.length) {
      const { error } = await client
        .from(TABLE)
        .upsert(
          toUpsert.map((e) => ({ card_id: cardId, rarity: e.rarity, count: e.count })),
          { onConflict: 'user_id,card_id,rarity' },
        );
      if (error) throw error;
    }
    if (toDelete.length) {
      const { error } = await client.from(TABLE).delete().eq('card_id', cardId).in('rarity', toDelete);
      if (error) throw error;
    }
    // ridesiderare riattiva l'intera carta: azzera obtained_at su tutte le sue righe.
    if (resetObtained) {
      const { error } = await client.from(TABLE).update({ obtained_at: null }).eq('card_id', cardId);
      if (error) throw error;
    }
  },

  async setObtained(cardId, obtained) {
    // obtained_at è client-owned (Q4): set/clear per-carta, su tutte le righe.
    const obtainedAt = obtained ? new Date().toISOString() : null;
    const { error } = await client.from(TABLE).update({ obtained_at: obtainedAt }).eq('card_id', cardId);
    if (error) throw error;
  },

  async deleteCard(cardId) {
    // RLS limita alle righe dell'utente: cancella tutte le rarità di quel card_id.
    const { error } = await client.from(TABLE).delete().eq('card_id', cardId);
    if (error) throw error;
  },
};
