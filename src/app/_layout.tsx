import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { useColorScheme } from 'react-native';
import { PaperProvider } from 'react-native-paper';

import {
  paperBlueDarkTheme,
  paperBlueLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from '@/constants/theme';
import { persistOptions, queryClient } from '@/data/query-client';

// I componenti Paper leggono il PaperProvider; la navigazione legge il
// ThemeProvider. Allineo solo i colori della chrome che si vedono (sfondo,
// card, primary) ai ruoli MD3 — le schermate dipingono il proprio ThemedView.
const navTheme = (nav: typeof NavDefaultTheme, paper: typeof paperLightTheme) => ({
  ...nav,
  colors: {
    ...nav.colors,
    background: paper.colors.background,
    card: paper.colors.surface,
    primary: paper.colors.primary,
  },
});

// Instrada le icone Paper su @expo/vector-icons (carica il font MDI anche su
// web). Stesso set di nomi MDI dei default di Paper.
const paperSettings = {
  icon: ({ name, color, size }: { name: string; color?: string; size?: number }) => (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color}
      size={size}
    />
  ),
};

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  // Accento in base alla tab attiva: /deck = viola MD3 default; resto (Wishlist) = blu.
  // Un solo PaperProvider al root → anche il Dialog (Portal) eredita l'accento giusto.
  const pathname = usePathname();
  const blue = !pathname.startsWith('/deck');
  const paper = blue
    ? dark
      ? paperBlueDarkTheme
      : paperBlueLightTheme
    : dark
      ? paperDarkTheme
      : paperLightTheme;
  const nav = navTheme(dark ? NavDarkTheme : NavDefaultTheme, paper);

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={persistOptions}>
      <PaperProvider theme={paper} settings={paperSettings}>
        <ThemeProvider value={nav}>
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}
