-- Schema della Wishlist su Neon. Eseguire UNA volta nell'editor SQL di Neon.
-- È la fonte di verità dello schema: `npx @neondatabase/neon-js gen-types` legge
-- da qui per generare src/database.types.ts (niente Drizzle — vedi ADR 0005).
--
-- RLS è l'unico muro tra utenti (ADR 0005): ogni riga è filtrata per
-- user_id = auth.user_id(), cioè il claim `sub` del JWT (text). Il client non
-- manda mai id / user_id / added_at: li assegna il DB (default).

create table public.wishlist_items (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null    default auth.user_id(),
  card_id     integer     not null,                       -- id YGOPRODeck della Card
  rarity      text        not null,                       -- es. "Ultra Rare" (il Set è ignorato)
  count       smallint    not null    check (count between 1 and 9),
  added_at    timestamptz not null    default now(),
  obtained_at timestamptz,                                -- null = "Da prendere"; valorizzato = "Presa"
  unique (user_id, card_id, rarity)                       -- chiave naturale + target onConflict dell'upsert
);

alter table public.wishlist_items enable row level security;

-- authenticated: vede e tocca SOLO le proprie righe, su tutte le operazioni.
create policy wishlist_owner on public.wishlist_items
  for all to authenticated
  using (user_id = auth.user_id())
  with check (user_id = auth.user_id());

grant select, insert, update, delete on public.wishlist_items to authenticated;
