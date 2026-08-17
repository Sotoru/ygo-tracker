# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Cross-platform first

Riusa lo stesso codice su web e mobile. Evita scelte "solo per questo device": niente file `.web.tsx` o rami `Platform.OS` se non quando una capability differisce davvero — e in quel caso isola la parte specifica dietro un piccolo modulo. Preferisci primitive cross-platform (`View`/`Text`/`Pressable`, `expo-image`) e API che funzionano ovunque (es. AsyncStorage, che gira anche su web).

# Struttura di components/ e hooks/

Una cartella per area di dominio — `card`, `deck`, `tournament`, `wishlist` — più `shared/`. `hooks/` rispecchia `components/`: le stesse cinque cartelle.

`shared/` è **solo** per ciò che due o più feature importano **già**. Finché il consumatore è uno, il file sta nella cartella della sua feature; lo si sposta quando arriva il secondo (è un import da cambiare, non un refactor).

`card/` è una feature pari grado, non una scorciatoia per "condiviso": `Card` è il vocabolario comune del dominio (un `Deck` è fatto di `Card`), quindi la cartella dice **cosa disegna**, non chi la usa. `card-cell` sta in `card/` anche se lo importano quattro feature.

Niente barrel (`index.ts`): gli import puntano al file, così il path dice sempre quale modulo stai usando e il codice morto resta visibile all'analisi statica.

I componenti non possono stare in `src/app/`: Expo Router tratta come rotta ogni `.tsx` sotto quella cartella.

# Tema e tipografia

I colori si leggono **solo** dai ruoli MD3 via `useTheme()` di react-native-paper (`primary`, `surface`, `onSurface`, `onSurfaceVariant`, `outline`, `secondaryContainer`…): mai colori hard-coded.

Per il testo niente wrapper: si usa direttamente `<Text variant="…">` di Paper, scegliendo la variant della scala MD3 adatta al ruolo.
