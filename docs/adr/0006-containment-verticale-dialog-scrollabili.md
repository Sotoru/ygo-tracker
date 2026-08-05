# Containment verticale dei Dialog scrollabili

Il `Dialog` di react-native-paper centra sempre verticalmente e su iOS/Web ha
`marginVertical: 0` (solo Android ha 44px, per il clipping delle ombre
`elevation`): niente lo tiene lontano dai bordi schermo. `card-detail-dialog.tsx`
e `print-picker.tsx` cappavano solo la `Dialog.ScrollArea` interna con una %
dell'altezza schermo (`height * 0.8`/`0.6`), lasciando il chrome esterno
(titolo, toggle, azioni) fuori dal calcolo: quando quel chrome è più alto del
margine stimato, il dialog sfora sopra e sotto lo schermo (visibile su mobile web).

Deciso: hook condiviso (`useDialogScrollBounds`) che applica un **margine
verticale fisso** (`Spacing.five`, 32px) sul `Dialog` esterno, uniforme su tutte
le piattaforme (sovrascrive anche i 44px Android-only di Paper — rischio
cosmetico minimo, accettato per restare senza `Platform.OS`). L'altezza massima
della `ScrollArea` si deduce misurando **a runtime** (`onLayout`) l'altezza
reale del chrome sopra/sotto, non da una stima.

## Alternative scartate

- **`flex: 1` sulla ScrollArea/FlatList** invece di un `maxHeight` numerico:
  collassa a 0 su web dentro Dialog/Portal di Paper (già osservato in
  `print-picker.tsx` prima di questo ADR). Non riprovarci.
- **Stima fissa in px per il chrome** invece della misura runtime: più
  semplice ma torna a essere una stima — si rompe di nuovo se il titolo va a
  due righe o il contenuto cambia, la stessa classe di bug che questo ADR risolve.

## Conseguenze

- Applicato solo a `card-detail-dialog.tsx` e `print-picker.tsx` (i dialog con
  contenuto scrollabile). I dialog corti (conferma/rename/reimport in
  `deck/[id].tsx`, il menu in `_layout.web.tsx`) restano su `dialogWidth`
  invariato: non hanno questo bug, non li tocchiamo.
- Il primo figlio di `Dialog` riceve da Paper un `marginTop: 24` iniettato
  automaticamente; per renderlo misurabile da `onLayout` (i margin non contano
  nell'altezza misurata) lo sovrascriviamo con `marginTop: 0` + `paddingTop`
  equivalente sul wrapper del chrome superiore (`styles.topChrome` in entrambi
  i file).
- C'è un render iniziale (prima che `onLayout` misuri) in cui la `ScrollArea`
  assume l'altezza massima disponibile: flash minimo, si autocorregge nello
  stesso frame/tick.
