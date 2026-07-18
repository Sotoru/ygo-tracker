# Yu-Gi-Oh! Deck & Wishlist

App per gestire una wishlist di carte e costruire deck per **retro format** (Goat, Edison, HAT, Tengu). Il **modello di dominio** (Card, Print, Deck, Format, Banlist…) è in [`CONTEXT.MD`](./CONTEXT.MD); le decisioni non ovvie in [`docs/adr/`](./docs/adr/).

## Architettura & scelte tecniche

**Stack**: Expo SDK 57 · React Native 0.86 · React 19 · Expo Router · TypeScript. Target: **web primario**, mobile in seguito.

**Cross-platform first** *(principio guida)*: riusa il più possibile lo stesso codice su web e mobile. Evita scelte device-specific (file `.web.tsx`, rami `Platform.OS`) se non quando una capability differisce davvero; in quel caso isola la parte specifica dietro un piccolo modulo. Vedi [`AGENTS.md`](./AGENTS.md).

**Persistenza (local-first)**: i dati utente (Wishlist, Deck) sono salvati on-device via `@react-native-async-storage/async-storage` — **una sola API KV** che funziona su web e native (niente localStorage/AsyncStorage separati). Forma **relazionale** (`decks`, `deck_entries`, `wishlist_items`); si salvano solo i **riferimenti** alle carte (`cardId`), non i payload. Tutto dietro un **repository** con `exportAll()`, così il futuro passaggio a Neon + Drizzle è un import di dati, non un redesign. → ADR 0001.

**Dati carta**: [YGOPRODeck API](https://ygoprodeck.com/api-guide/), on-demand, con cache persistita via **TanStack Query** (rate limit 20 req/s da rispettare).

**Immagini**: proxy/CDN di caching + disk cache di `expo-image`, per non hotlinkare direttamente (contro i termini YGOPRODeck). Il vero download-e-riospita arriverà col backend. → ADR 0002.

**Formati & validazione**: solo retro format, con **banlist statiche** impacchettate nell'app; validazione **soft** (warning, nessun blocco). → ADR 0003.

**Librerie**: TanStack Query ora. Zustand e Tamagui **rimandati** (non necessari in v1).

---

Progetto creato con [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
