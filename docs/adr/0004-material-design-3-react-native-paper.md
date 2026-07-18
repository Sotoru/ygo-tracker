# Material Design 3 via react-native-paper, tema unico condiviso web+mobile

L'app adotta **Material Design 3** usando **react-native-paper** (5.15.3) come
unica libreria: fornisce sia i **token** (`MD3LightTheme`/`MD3DarkTheme`, scala
tipografica) sia il **kit di componenti** (Button, Card, TextInput, Menu,
Snackbar…), il tutto su `react-native-web` → stesso codice su web e mobile.

Il **tema di Paper è l'unica sorgente di verità** per i colori: `Colors` e il
vecchio `useTheme` custom vengono ritirati; i componenti leggono i ruoli MD3 via
`useTheme()` di Paper. `Spacing` resta (Paper non gestisce la spaziatura),
`useColorScheme` resta per scegliere light/dark. Si parte dalla **palette
default MD3** di Paper (nessun seed color per ora; un `Material Theme Builder`
seed si potrà innestare dopo senza toccare i call site).

`ThemedText`/`ThemedView` **restano come wrapper sottili sopra Paper** (colore da
`useTheme()`, i loro `type` mappati alle variant MD3) → i 34 call site non
cambiano.

> **Aggiornamento:** `ThemedText` è stato **ritirato**. La sua mappa `type`→variant
> era morta per 7/8 voci e la scala tipografica è già il vocabolario nativo di
> Paper: si usa `<Text variant="…">` direttamente, col colore attenuato passato
> inline (`{ color: colors.onSurfaceVariant }`) nei pochi punti che lo richiedono.
> `ThemedView` **resta** (wrapper sugli sfondi piatti di schermata, usa `ColorRole`
> via `use-theme`). Vedi `Design.md` § Tipografia.

Le tab restano su `NativeTabs` (`app-tabs.tsx` + `app-tabs.web.tsx`),
solo ricolorate dal tema MD3. Rollout **incrementale**: prima temi + wrapper +
tab, poi i componenti Paper schermata per schermata (Wishlist, poi Deck).

## Perché

Volevamo insieme token coerenti *e* componenti pronti: scriverli a mano sarebbe
stato 50+ file, mentre Paper è una dipendenza sola. Paper 5.15.3 sviluppa contro
React 19.1 / RN 0.82 (peer deps `*`), quindi il nostro stack Expo 57 / RN 0.86 /
React 19.2 rientra: rischio compatibilità basso. Tema unico evita il trap
classico della migrazione MD3 (due palette che divergono). Palette default =
zero lavoro iniziale e nessun blocco su una scelta di brand. Wrapper invece di
riscrivere i call site = diff minima e nessuna regressione visiva al primo
passo. `NativeTabs` è una differenza di *capability* reale (barra nativa vera),
il solo caso in cui `AGENTS.md` ammette il file `.web.tsx`.
