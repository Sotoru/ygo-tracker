-- Schema catalogo Tornei su Neon. Eseguire UNA volta nell'editor SQL di Neon e
-- poi rigenerare i tipi: npx @neondatabase/neon-js gen-types (src/database.types.ts).
--
-- Modello separato dai Deck personali: i Tournament Deck sono contenuto editoriale
-- read-only per il pubblico. Anonymous/auth non-admin leggono solo published;
-- l'admin legge/scrive tutto tramite allowlist DB.

create table public.admin_users (
  user_id text primary key,
  email   text
);

create table public.tournaments (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  format     text        not null,                     -- 'goat' | 'edison' | ... (validato lato app)
  date       date        not null,
  location   text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournament_decks (
  id            uuid        primary key default gen_random_uuid(),
  tournament_id uuid        not null references public.tournaments (id) on delete cascade,
  name          text        not null,
  player_name   text,
  placement     text        not null,                  -- winner | runnerUp | top4 | top8 | ...
  format        text        not null,                  -- duplicato per filtro/read model; uguale al torneo nel dominio
  cover_card_id integer,
  source_url    text,
  status        text        not null default 'draft' check (status in ('draft', 'published')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table public.tournament_deck_entries (
  id                 uuid     primary key default gen_random_uuid(),
  tournament_deck_id uuid     not null references public.tournament_decks (id) on delete cascade,
  card_id            integer  not null,                -- id YGOPRODeck della Card
  zone               text     not null,                -- 'main' | 'extra' | 'side'
  count              smallint not null check (count between 1 and 9),
  unique (tournament_deck_id, card_id, zone)
);

create index tournament_decks_tournament_id_idx on public.tournament_decks (tournament_id);
create index tournament_deck_entries_deck_id_idx on public.tournament_deck_entries (tournament_deck_id);
create index tournament_decks_public_idx on public.tournament_decks (status, tournament_id);
create index tournaments_format_date_idx on public.tournaments (format, date desc);

alter table public.admin_users             enable row level security;
alter table public.tournaments             enable row level security;
alter table public.tournament_decks        enable row level security;
alter table public.tournament_deck_entries enable row level security;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users a
    where a.user_id = auth.user_id()
  );
$$;

-- Inserire manualmente l'email admin dopo aver creato la tabella, es.:
-- insert into public.admin_users (user_id, email) values ('neon-auth-user-id', 'you@example.com');

create policy admin_users_admin_read on public.admin_users
  for select to authenticated
  using (public.is_admin());

create policy tournaments_admin_all on public.tournaments
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy tournament_decks_admin_all on public.tournament_decks
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy tournament_deck_entries_admin_all on public.tournament_deck_entries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Pubblico READ-ONLY: un torneo è leggibile solo se ha almeno un deck published.
create policy tournaments_public_read on public.tournaments
  for select to anonymous, authenticated
  using (exists (select 1 from public.tournament_decks d where d.tournament_id = tournaments.id and d.status = 'published'));

create policy tournament_decks_public_read on public.tournament_decks
  for select to anonymous, authenticated
  using (status = 'published');

create policy tournament_deck_entries_public_read on public.tournament_deck_entries
  for select to anonymous, authenticated
  using (exists (select 1 from public.tournament_decks d where d.id = tournament_deck_entries.tournament_deck_id and d.status = 'published'));

grant select on public.tournaments, public.tournament_decks, public.tournament_deck_entries to anonymous;
grant select, insert, update, delete on public.tournaments, public.tournament_decks, public.tournament_deck_entries to authenticated;
grant select on public.admin_users to authenticated;
