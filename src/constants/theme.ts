import '@/global.css';

import { Platform } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

/**
 * Il tema MD3 di Paper è la sorgente unica dei colori. Questi sono i vecchi nomi
 * di token mappati sui ruoli MD3, così i call site esistenti non cambiano.
 * Vedi docs/adr/0004 e docs/Design.md.
 */
export const ColorRole = {
  text: 'onSurface',
  background: 'background',
  backgroundElement: 'surfaceVariant',
  backgroundSelected: 'secondaryContainer',
  textSecondary: 'onSurfaceVariant',
} as const;

export type ThemeColor = keyof typeof ColorRole;

// Larghezze e spaziature vivono in ./layout (puro, testabile). Ri-esportate qui
// perché @/constants/theme è l'import storico dei call site. Gli altri nomi di
// ./layout (Breakpoint, MinCellWidth, MaxContentWidth) si importano da là.
export { cappedWidth, contentContainer, DenseGridColumns, dialogWidth, Spacing } from './layout';

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;

// Font MD3: su web usa lo stack Spline Sans (CSS var); su native resta il font
// di sistema di MD3 (nessun font custom caricato).
const fonts = configureFonts({
  config: Platform.select({ web: { fontFamily: 'var(--font-display)' }, default: {} }),
});

export const paperLightTheme = { ...MD3LightTheme, fonts };
export const paperDarkTheme = { ...MD3DarkTheme, fonts };

// Accento per-tab: la Deck resta sul viola MD3 di default (temi sopra); la
// Wishlist usa questo blu MD3 completo. Schema tonale (tutti i ruoli:
// surface/surfaceVariant/background/outline + i 6 livelli di elevation che la
// Searchbar usa come sfondo) generato UNA VOLTA dal seed #415F91 con
// @material/material-color-utilities. Statico = zero dipendenze a runtime; per
// cambiare seed si rigenera. Lo swap in base alla route sta in _layout.tsx.
const blueLight = {
  primary: '#2A5EA7',
  onPrimary: '#FFFFFF',
  primaryContainer: '#D6E3FF',
  onPrimaryContainer: '#001B3E',
  secondary: '#565F71',
  onSecondary: '#FFFFFF',
  secondaryContainer: '#DAE2F9',
  onSecondaryContainer: '#131C2B',
  tertiary: '#6F5575',
  onTertiary: '#FFFFFF',
  tertiaryContainer: '#F9D8FD',
  onTertiaryContainer: '#28132E',
  background: '#FDFBFF',
  onBackground: '#1A1B1E',
  surface: '#FDFBFF',
  onSurface: '#1A1B1E',
  surfaceVariant: '#E0E2EC',
  onSurfaceVariant: '#44474E',
  outline: '#74777F',
  outlineVariant: '#C4C6D0',
  inverseSurface: '#2F3033',
  inverseOnSurface: '#F1F0F4',
  inversePrimary: '#AAC7FF',
  elevation: {
    level0: '#FDFBFF',
    level1: '#F2F3FB',
    level2: '#ECEEF8',
    level3: '#E6EAF5',
    level4: '#E4E8F4',
    level5: '#DFE5F3',
  },
};
const blueDark = {
  primary: '#AAC7FF',
  onPrimary: '#002F64',
  primaryContainer: '#00458D',
  onPrimaryContainer: '#D6E3FF',
  secondary: '#BEC6DC',
  onSecondary: '#283141',
  secondaryContainer: '#3E4759',
  onSecondaryContainer: '#DAE2F9',
  tertiary: '#DCBCE0',
  onTertiary: '#3F2844',
  tertiaryContainer: '#573E5C',
  onTertiaryContainer: '#F9D8FD',
  background: '#1A1B1E',
  onBackground: '#E3E2E6',
  surface: '#1A1B1E',
  onSurface: '#E3E2E6',
  surfaceVariant: '#44474E',
  onSurfaceVariant: '#C4C6D0',
  outline: '#8E9099',
  outlineVariant: '#44474E',
  inverseSurface: '#E3E2E6',
  inverseOnSurface: '#2F3033',
  inversePrimary: '#2A5EA7',
  elevation: {
    level0: '#1A1B1E',
    level1: '#212429',
    level2: '#262930',
    level3: '#2A2E37',
    level4: '#2B3039',
    level5: '#2E333E',
  },
};

export const paperBlueLightTheme = {
  ...paperLightTheme,
  colors: { ...paperLightTheme.colors, ...blueLight },
};
export const paperBlueDarkTheme = {
  ...paperDarkTheme,
  colors: { ...paperDarkTheme.colors, ...blueDark },
};
