// Gli hook sopra la matematica pura di @/constants/layout: qui c'è solo il
// collegamento alla larghezza della finestra, così il calcolo resta testabile
// senza renderer.
import { useWindowDimensions } from 'react-native';

import { breakpointOf, gridMetrics, type BreakpointName } from '@/constants/layout';

export function useBreakpoint(): BreakpointName {
  return breakpointOf(useWindowDimensions().width);
}

/** Colonne fisse per fascia (o un numero, es. la scelta utente) → cella già calcolata. */
export function useGrid(cols: number | Record<BreakpointName, number>) {
  return gridMetrics(useWindowDimensions().width, cols);
}
