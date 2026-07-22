import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, Stack, ThemeProvider, usePathname } from 'expo-router';
import { StyleSheet, useColorScheme } from 'react-native';
import { ActivityIndicator, PaperProvider } from 'react-native-paper';

import { CardDetailDialog } from '@/components/card-detail-dialog';
import { ThemedView } from '@/components/themed-view';
import {
  paperBlueDarkTheme,
  paperBlueLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from '@/constants/theme';
import { useSession } from '@/data/auth';
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

// Gate: la sessione decide cosa è raggiungibile. Cloud-only (docs/adr/0005):
// niente sessione → solo /sign-in; con sessione → l'app. Stack.Protected (Expo Router v57).
function RootNavigator() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <ThemedView style={styles.loading}>
        <ActivityIndicator />
      </ThemedView>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="banlist/[format]" />
        <Stack.Screen name="deck/new" />
        <Stack.Screen name="deck/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === 'dark';
  // Accento in base alla tab attiva: /deck e /banlist = viola MD3 default; resto
  // (Wishlist, sign-in) = blu. Un solo PaperProvider al root → anche il Dialog
  // (Portal) eredita l'accento giusto.
  const pathname = usePathname();
  const blue = !pathname.startsWith('/deck') && !pathname.startsWith('/banlist');
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
          <RootNavigator />
          {/* Montato una volta: qualsiasi schermata apre il dettaglio via useCardDetail */}
          <CardDetailDialog />
        </ThemeProvider>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
