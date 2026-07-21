# TODO

## Wishlist

### Front End

- [x] Improve row handling
  - [x] onSelect clear search
  - [x] add controls for searchCard
    - [x] - - to select quantity
    - [x] rarity selector (only with available)
    - [x] expansion selector
- [x] Improve search card with _-_ in their name (ex. blue-eyes)
- [ ] Crate auth page when the auth BE part is ready (only google)
  - [ ] make rest the part of the part authenticated and content based on user

### Decklist

## Shared

### Back End

- [ ] Integrate Backend (Neon db, already create project) & tRpc
  - Architettura decisa (grilling 2026-07-20): **client-only hosting**, nessun server tier.
    Runtime queries via **Neon Data API** (`@neondatabase/neon-js`, RLS via JWT). **Niente Drizzle**: schema SQL a mano (`docs/db/`), tipi via `neon-js gen-types`. Cloud-only gate → ADR 0001 (local-first) da superseded. Vedi ADR 0005 + addendum.
  - [x] Handle all .env with <https://env.t3.gg/> — **solo `clientEnv`** (niente serverEnv: tutto client-side).
  - [ ] **Wishlist su Neon** (grilling 2026-07-20): tabella `wishlist_items` + RLS (`docs/db/wishlist.sql`, da eseguire in Neon) → `gen-types` → `NeonRepository`. Cablato in `store.ts`. **Manca:** eseguire l'SQL, generare `src/database.types.ts`, provare login+wishlist end-to-end (Chrome).
  - [ ] Implement auth with neon db auth (it must work on mobile & web) with only google as provider
    - [x] **Web prima** (iterazione corrente): auth Google (`createAuthClient` + `signIn.social`) su web, headless + pagina Paper, dietro un modulo isolato + gate `Stack.Protected`.
    - [ ] **Verifica sessione**: login → refresh resta loggato, su **Chrome _e_ Safari** (il cookie è cross-site verso l'origin Neon → ITP Safari lo può bloccare).
    - [ ] **Auth domain same-site (prod)** — SOLO se Safari rompe la sessione (cookie same-site invece di cross-site). Vedi ADR 0005.
    - [ ] `createClient` + `dataApi` — rimandato al task `NeonRepository` (`createClient` impone `dataApi`; per l'auth-only basta `createAuthClient`).
    - [ ] Native (mobile) — RIMANDATO: flusso OAuth Google via `expo-auth-session`/`expo-web-browser` + deep-link/redirect scheme. Supporto native di neon-js da verificare.

### Front End

- [x] Create Design.md
- [ ] Add material design 3 (react-native-paper) — vedi docs/adr/0004 e docs/Design.md
