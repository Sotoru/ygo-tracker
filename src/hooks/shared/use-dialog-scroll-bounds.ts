// Contiene verticalmente i Dialog scrollabili (Portal/Dialog di react-native-paper
// centra sempre, senza margine dai bordi su iOS/Web).
// Margine fisso sul Dialog esterno; l'altezza della ScrollArea si deduce
// misurando a runtime il chrome sopra/sotto (titolo, toggle, azioni) via
// onLayout — niente flex (collassa a 0 su web dentro Dialog/Portal) né stime in px.
// Restituisce anche gli stili del chrome: i default MD3 di Paper (16+16 attorno al
// titolo, 24 sotto la ScrollArea, 24 sotto le azioni) sono generosi per un dialog
// che arriva al limite verticale, e quello spazio serve al contenuto. Arrivano da
// qui e non dai singoli file così CHROME sta in un posto solo e — soprattutto —
// resta padding: onLayout non misura il marginTop del primo figlio del Dialog,
// quindi un margine lì sfalserebbe scrollAreaMaxHeight.
import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { Spacing } from '@/constants/theme';

const MARGIN = Spacing.five;
const CHROME = Spacing.two;

export function useDialogScrollBounds() {
  const { width, height } = useWindowDimensions();
  const [topHeight, setTopHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);

  const maxHeight = height - MARGIN * 2;
  const scrollAreaMaxHeight = Math.max(120, maxHeight - topHeight - bottomHeight);

  return {
    dialogStyle: { marginVertical: MARGIN, maxHeight },
    scrollAreaMaxHeight,
    // marginTop:0 sovrascrive il marginTop:24 che Dialog inietta sul primo figlio;
    // il paddingTop lo sostituisce con spaziatura misurabile da onLayout.
    topChromeStyle: { marginTop: 0, paddingTop: CHROME },
    titleStyle: { marginTop: 0, marginBottom: CHROME },
    scrollAreaStyle: { paddingHorizontal: Spacing.four, marginBottom: CHROME },
    actionsStyle: { paddingBottom: CHROME },
    // finestra più larga che alta: il contenuto conviene affiancarlo invece di
    // impilarlo, così l'altezza serve al testo e non alla foto.
    side: width > height,
    onTopLayout: (e: LayoutChangeEvent) => setTopHeight(e.nativeEvent.layout.height),
    onBottomLayout: (e: LayoutChangeEvent) => setBottomHeight(e.nativeEvent.layout.height),
  };
}
