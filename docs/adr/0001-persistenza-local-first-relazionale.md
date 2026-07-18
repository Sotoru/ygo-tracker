# Persistenza local-first in forma relazionale (verso Neon + Drizzle)

I dati utente (Wishlist, Deck) sono salvati on-device via
`@react-native-async-storage/async-storage` — una sola API KV cross-platform
(web + native) — in forma **relazionale normalizzata** (`decks`, `deck_entries`,
`wishlist_items`) con ID e riferimenti, salvando solo i `cardId` e non i payload
delle carte. Tutto dietro un repository con `exportAll()`.

## Perché

Vogliamo partire senza backend ma poter migrare a **Neon (Postgres) + Drizzle**
senza redesign: la forma relazionale rende la migrazione un semplice import di
dati. Abbiamo scartato **expo-sqlite + Drizzle da subito** perché il supporto web
di `expo-sqlite` è **alpha/instabile** (richiede WASM, `SharedArrayBuffer`, header
`COOP`/`COEP`) e il web è il target primario.

## Conseguenze

Nessun sync tra dispositivi in v1: pulire i dati del browser cancella Wishlist e
Deck.
