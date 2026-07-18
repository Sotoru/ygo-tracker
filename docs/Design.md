# Design — Material Design 3

Il linguaggio visivo dell'app. **Una sola sorgente**: il tema MD3 di
`react-native-paper`. Decisione e motivazioni in [`adr/0004`](./adr/0004-material-design-3-react-native-paper.md).

## Come funziona il tema

- `PaperProvider theme={scheme === 'dark' ? MD3DarkTheme : MD3LightTheme}` avvolge
  l'app in `src/app/_layout.tsx`; `useColorScheme` sceglie light/dark.
- `adaptNavigationTheme` allinea il `ThemeProvider` di expo-router ai colori MD3
  (la chrome di navigazione usa gli stessi ruoli).
- I componenti leggono i colori con `const { colors } = useTheme()` di Paper e i
  **ruoli MD3** (`primary`, `surface`, `onSurface`, `surfaceVariant`,
  `onSurfaceVariant`, `outline`, `secondaryContainer`…), mai colori hard-coded.
- Palette: **default MD3 di Paper** per ora. Per brandizzare: generare un tema da
  un seed con Material Theme Builder e passarlo a `PaperProvider` — i call site
  non cambiano.

## Colori: mappa dai vecchi token

| Vecchio (`Colors`) | Ruolo MD3 |
|---|---|
| `background` | `background` / `surface` |
| `backgroundElement` | `surfaceVariant` |
| `backgroundSelected` | `secondaryContainer` |
| `text` | `onSurface` |
| `textSecondary` | `onSurfaceVariant` |
| accent `#3c87f7` | `primary` |

## Tipografia

Niente wrapper di testo: si usa **direttamente `<Text variant="…">` di Paper**,
scegliendo la variant della scala MD3 adatta al ruolo. Il colore di default
(`onSurface`) arriva già dal tema; per il testo attenuato si passa inline
`{ color: colors.onSurfaceVariant }` da `useTheme()` (l'unico colore non-default
in uso). Font: **Spline Sans** iniettato in `configureFonts` così tutte le
variant usano il font dell'app (web + native). `ThemedText` è stato ritirato —
vedi [`adr/0004`](./adr/0004-material-design-3-react-native-paper.md).

Variant per ruolo, come usate nell'app:

| Ruolo | Variant MD3 |
|---|---|
| Nome carta (`List.Item` title) | `bodyLarge` (16/400, default del componente) |
| Riga rarità (`List.Item` description) | `bodyMedium` + colore attenuato dal componente |
| Etichetta/label primaria (es. rarità nel picker) | `bodyLarge` |
| Valore enfatizzato (es. contatore stepper) | `titleMedium` |
| Testo di supporto dei dialog | `bodyMedium` |
| Messaggi attenuati (empty state, stub) | `bodyMedium` + `onSurfaceVariant` |

I componenti Paper che hanno già una tipografia MD3 propria
(`List.Subheader`, `Dialog.Title`, il title di `List.Item` da stringa) **non**
ricevono una variant esplicita: la tipografia è del componente.

## Spaziatura

`Spacing` (`half`…`six`) resta invariato: Paper non gestisce la spaziatura.

## Componenti — adozione Paper

**Fase 1 (fatta)**: `PaperProvider` + temi, `ThemedText`/`ThemedView` sopra
Paper, tab (`NativeTabs`) ricolorate dal tema.

**Fase 2 — mappa dei rimpiazzi** (Paper solo dove porta valore):

| Superficie | Paper |
|---|---|
| Ricerca (`TextInput` + spinner + pill) | `Searchbar` (`value`/`onChangeText`/`loading`) |
| `CardRow` | `List.Item` (`left`=thumbnail, `title`=nome, `description`=set·rarità·×N, `right`=`IconButton`) |
| `RowButton` (glifi) | eliminato → `IconButton` con icone MDI (`plus`/`close`/`delete`/`minus`/`check`) |
| `PrintPicker` (`Modal` bottom-sheet) | `Portal`+`Dialog` (`Title` + `ScrollArea` con la lista + `Actions`) |
| Selezione stampa | `List.Item` + `RadioButton` (right) |
| "Aggiungi" | `Button` mode="contained" |

Restano invariati: `FlatList` (Paper non fa liste), `NativeTabs` + `.web.tsx`
(barra nativa vera = capability reale), lo stepper −/＋ (layout custom con
`IconButton`), `ThemedText`, e `ThemedView` per gli sfondi piatti di schermata.
Icone MDI: in Expo funzionano senza setup; fallback `PaperProvider settings.icon`
→ `@expo/vector-icons` solo se non renderizzano.
