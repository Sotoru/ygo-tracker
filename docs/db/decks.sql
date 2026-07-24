-- Schema dei Deck su Neon. Eseguire UNA volta nell'editor SQL di Neon (dopo
-- wishlist.sql). Come la Wishlist: RLS è l'unico muro tra utenti (ADR 0005),
-- ogni riga filtrata per user_id = auth.user_id() (claim `sub` del JWT). Il client
-- non manda mai id / user_id / created_at / updated_at: li assegna il DB.
--
-- Dopo l'esecuzione rigenerare i tipi: npx @neondatabase/neon-js gen-types
-- (src/database.types.ts). Il Deck referenzia Card astratte (card_id), non Print.

create table public.decks (
  id         uuid        primary key default gen_random_uuid(),
  user_id    text        not null    default auth.user_id(),
  name          text     not null,
  format        text     not null,                          -- 'goat' | 'edison' | ... (validato lato app)
  cover_card_id integer,                                     -- carta "in evidenza" (id YGOPRODeck); null = fallback alla prima carta
  is_public  boolean     not null    default false,          -- visibilità: privato di default; se true leggibile dal ruolo anonymous
  created_at timestamptz not null    default now(),
  updated_at timestamptz not null    default now()
);

create table public.deck_entries (
  id       uuid     primary key default gen_random_uuid(),
  user_id  text     not null    default auth.user_id(),
  deck_id  uuid     not null    references public.decks (id) on delete cascade,
  card_id  integer  not null,                               -- id YGOPRODeck della Card
  zone     text     not null,                               -- 'main' | 'extra' | 'side' (dal .ydk)
  count    smallint not null    check (count between 1 and 9),
  unique (deck_id, card_id, zone)                           -- chiave naturale (import "as-is")
);

create index deck_entries_deck_id_idx on public.deck_entries (deck_id);

alter table public.decks        enable row level security;
alter table public.deck_entries enable row level security;

create policy decks_owner on public.decks
  for all to authenticated
  using (user_id = auth.user_id())
  with check (user_id = auth.user_id());

create policy deck_entries_owner on public.deck_entries
  for all to authenticated
  using (user_id = auth.user_id())
  with check (user_id = auth.user_id());

-- Accesso pubblico READ-ONLY per il ruolo anonymous: solo i deck marcati is_public
-- (e le loro entries). I deck privati e la scrittura restano owner-only.
-- Scelta (grilling 2026-07-23): NON apriamo ai loggati i pubblici altrui, così
-- "sessione + dato = proprietario" resta vero e non serve un ownership check lato UI.
create policy decks_public_read on public.decks
  for select to anonymous
  using (is_public);

create policy deck_entries_public_read on public.deck_entries
  for select to anonymous
  using (exists (select 1 from public.decks d where d.id = deck_entries.deck_id and d.is_public));

grant select, insert, update, delete on public.decks        to authenticated;
grant select, insert, update, delete on public.deck_entries to authenticated;
grant select on public.decks        to anonymous;
grant select on public.deck_entries to anonymous;
