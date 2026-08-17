# Yu-Gi-Oh! Deck & Wishlist

App per gestire una wishlist di carte e costruire deck per **retro format** (Goat, Edison, HAT, Tengu, REDU). Il modello di dominio (Card, Print, Deck, Format, Banlist…) è in [`CONTEXT.md`](./CONTEXT.md).

**Stato**: web funzionante. Non fatti: il **native mobile** (flusso OAuth Google via `expo-auth-session` + deep link) e la **verifica della sessione su Safari** (il cookie è cross-site verso l'origin Neon, l'ITP lo può bloccare).

## Avvio

```bash
npm install
npx expo start   # oppure: npm run web
```

## Architettura

**Stack**: Expo SDK 57 · React Native 0.86 · React 19 · Expo Router · TypeScript · react-native-paper (Material Design 3). Target **web primario**, mobile in seguito.

**Cross-platform first** *(principio guida)*: lo stesso codice su web e mobile; niente file `.web.tsx` o rami `Platform.OS` se non quando una capability differisce davvero, e in quel caso isolata dietro un piccolo modulo. Vedi [`AGENTS.md`](./AGENTS.md).

**Dati e auth**: cloud auth-gated, **senza un backend nostro**. Login **solo Google** via Neon Auth; Wishlist e Deck vivono su Neon Postgres e si interrogano dal client via **Neon Data API** (PostgREST). Hosting **client-only, nessun server tier**: tutte le variabili d'ambiente sono valori public (`clientEnv`, t3-env) e **RLS è l'unico muro tra utenti**. Lo schema è SQL scritto a mano in [`db/`](./db/), eseguito nella console Neon; i tipi arrivano dal codegen (`npx @neondatabase/neon-js gen-types`). Forma relazionale (`decks`, `deck_entries`, `wishlist_items`): si salvano solo i riferimenti alle carte (`cardId`), mai il payload.

**Dati carta**: [YGOPRODeck API](https://ygoprodeck.com/api-guide/), on-demand, con cache persistita via TanStack Query. **Rate limit 20 req/s** da rispettare.

**Immagini**: i termini YGOPRODeck **vietano l'hotlink diretto** (pena la blacklist dell'IP), quindi passano da un proxy/CDN di caching più la disk cache di `expo-image`. Gap noto: il primo fetch di ogni immagine tocca comunque l'origine — il download-e-riospita vero richiede un backend.

**Banlist**: solo retro format, con banlist **statiche impacchettate nell'app** (nessun dato live da mantenere). La validazione è **soft**: warning, mai un blocco al salvataggio o all'import.
