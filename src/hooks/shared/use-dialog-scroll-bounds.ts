// Contiene verticalmente i Dialog scrollabili (Portal/Dialog di react-native-paper
// centra sempre, senza margine dai bordi su iOS/Web).
// Margine fisso sul Dialog esterno; l'altezza della ScrollArea si deduce
// misurando a runtime il chrome sopra/sotto (titolo, toggle, azioni) via
// onLayout — niente flex (collassa a 0 su web dentro Dialog/Portal) né stime in px.
import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useWindowDimensions } from 'react-native';

import { Spacing } from '@/constants/theme';

const MARGIN = Spacing.five;

export function useDialogScrollBounds() {
  const { width, height } = useWindowDimensions();
  const [topHeight, setTopHeight] = useState(0);
  const [bottomHeight, setBottomHeight] = useState(0);

  const maxHeight = height - MARGIN * 2;
  const scrollAreaMaxHeight = Math.max(120, maxHeight - topHeight - bottomHeight);

  return {
    dialogStyle: { marginVertical: MARGIN, maxHeight },
    scrollAreaMaxHeight,
    // finestra più larga che alta: il contenuto conviene affiancarlo invece di
    // impilarlo, così l'altezza serve al testo e non alla foto.
    side: width > height,
    onTopLayout: (e: LayoutChangeEvent) => setTopHeight(e.nativeEvent.layout.height),
    onBottomLayout: (e: LayoutChangeEvent) => setBottomHeight(e.nativeEvent.layout.height),
  };
}
