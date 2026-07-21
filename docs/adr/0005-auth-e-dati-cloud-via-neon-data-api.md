# Auth + dati cloud via Neon Data API (client-only)

L'app passa da **local-first** a **cloud, auth-gated**. Login **solo Google** via
**Neon Auth** (`@neondatabase/neon-js`, generazione "nuova": il progetto espone
`auth url` + `jwks url`). I dati utente (Wishlist, Deck) vivono su Neon Postgres
e si interrogano dal client via **Neon Data API** (REST/PostgREST), con accesso
controllato da **Row-Level Security** e il JWT della sessione. Lo schema è **SQL
scritto a mano** (`docs/db/*.sql`, eseguito nella console Neon) e la type-safety
lato client viene dal **codegen di neon-js** (`npx @neondatabase/neon-js gen-types`).
Hosting **client-only**: nessun server tier, quindi solo `clientEnv` (t3-env),
nessun `serverEnv`. Login obbligatorio: niente app senza sessione (gate `Stack.Protected`).

**Supersedes [0001](./0001-persistenza-local-first-relazionale.md).** Per ora,
web only; il native è rimandato (vedi `docs/todo_list.md`).

## Perché

Vogliamo dati per-utente sincronizzati, restando **senza un backend nostro**.
Il modello RLS di Neon (ruoli `authenticated`/`anonymous`, `auth.user_id()` dal
JWT) mette il confine di sicurezza **nel database**, così il client può parlare
direttamente a Neon.

Alternative scartate:

- **Server tier (Expo API Routes) + Drizzle lato server.** Terrebbe Drizzle per
  le query, ma richiede un **deploy non-statico** del web: contro il vincolo
  "hostiamo tutto da client".
- **Drizzle diretto dal browser + `$withAuth`.** I doc Neon lo indicano come
  pattern **backend** (connection string con ruolo custom): esporre una
  connection string Postgres al client è più superficie d'attacco della Data API.
- **Neon Auth "classica" (Stack Auth).** È la lineage di Neon RLS + `drizzle-orm/neon`,
  ma il progetto è provisionato con la Neon Auth nuova (auth url + jwks url), e
  Stack Auth non ha SDK React Native per il native futuro.

## Conseguenze

- **RLS è l'unico muro** tra un utente e i dati altrui: le policy vanno scritte e
  testate (lo spike iniziale verifica "vedo solo le mie righe").
- **Niente offline / niente uso senza account**: serve rete e login. È il prezzo
  del passaggio da local-first.
- Il `Repository` seam (ADR 0001) prende una nuova impl `NeonRepository` sopra la
  Data API; l'export `exportAll()` resta utile per un eventuale import dei dati
  locali di sviluppo.
- Il `jwks url` è config **lato Neon** (validazione dei JWT), non una `clientEnv`.

## Note d'implementazione (verificate sull'SDK, `@neondatabase/neon-js` 0.6.2-beta)

- **Auth-only client** via `createAuthClient(url, { adapter: BetterAuthReactAdapter() })`
  (da `@neondatabase/neon-js/auth`). NON `createClient`: quello **impone** anche
  `dataApi` (non opzionale), quindi lo teniamo per il task `NeonRepository`.
- L'adapter React va importato da `@neondatabase/neon-js/auth/react/adapters`
  (Critical Rule #2): `/auth/react` è il barrel dei componenti UI web e romperebbe
  il bundle Metro/Expo.
- **La sessione web è un cookie cross-site** verso l'origin Neon (nessun token in
  localStorage esposto dall'SDK): richiede origin fidato + CORS lato Neon (fatto) ed
  è **fragile su Safari/iOS** (ITP blocca i cookie di terze parti). Rischio
  **accettato e da verificare** questa iterazione (login → refresh su Chrome *e*
  Safari). Fallback se Safari rompe: **auth domain same-site** in prod (task futuro).

## Addendum (grilling 2026-07-20 — task `NeonRepository` Wishlist)

- **Drizzle rimosso del tutto.** Non lo usiamo più nemmeno per schema/migrazioni:
  una tabella non giustifica una toolchain di migrazioni (YAGNI). Lo schema è SQL a
  mano in `docs/db/wishlist.sql`, eseguito una volta nella console Neon; la
  type-safety client-side arriva da `npx @neondatabase/neon-js gen-types`
  (`src/database.types.ts`, dev-time, `--db-url` = segreto in `.env.local`). Si
  riapre Drizzle (o migrazioni) solo quando le tabelle crescono e la sincronizzazione
  a mano fa male.
- **Client unificato adottato.** `auth.ts` usa `createClient({ auth, dataApi })`
  (non più il solo `createAuthClient`): un unico client inietta il JWT sulle chiamate
  Data API. Superficie pubblica invariata (`useSession`/`signInWithGoogle`/`signOut`).
- **`setWishlistEntries` non è atomico**: upsert (count>0) + delete (count≤0) +
  reset `obtained_at` sono round-trip PostgREST separati. Accettato per single-user;
  upgrade path = RPC Postgres transazionale. Vedi `neon-repository.ts`.
- **Isolamento cache**: `signOut` svuota query cache + persistito, così un login
  successivo sullo stesso device non vede i dati dell'utente precedente.
- **Solo Wishlist su Neon**; i Deck restano non cablati (UI stub) finché non hanno
  una UI reale.
