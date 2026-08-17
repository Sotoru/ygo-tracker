import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  Stack,
  ThemeProvider,
  usePathname,
} from "expo-router";
import Head from "expo-router/head";
import { useEffect, useRef } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import { ActivityIndicator, PaperProvider } from "react-native-paper";

import { CardDetailDialog } from "@/components/card/card-detail-dialog";
import { ThemedView } from "@/components/shared/themed-view";
import {
  paperBlueDarkTheme,
  paperBlueLightTheme,
  paperDarkTheme,
  paperLightTheme,
} from "@/constants/theme";
import { DEV_AUTOLOGIN, signInDev, useSession } from "@/data/auth";
import { persistOptions, queryClient } from "@/data/query-client";

// I componenti Paper leggono il PaperProvider; la navigazione legge il
// ThemeProvider. Allineo solo i colori della chrome che si vedono (sfondo,
// card, primary) ai ruoli MD3 — le schermate dipingono il proprio ThemedView.
const navTheme = (
  nav: typeof NavDefaultTheme,
  paper: typeof paperLightTheme,
) => ({
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
  icon: ({
    name,
    color,
    size,
  }: {
    name: string;
    color?: string;
    size?: number;
  }) => (
    <MaterialCommunityIcons
      name={name as keyof typeof MaterialCommunityIcons.glyphMap}
      color={color}
      size={size}
    />
  ),
};

// Gate: la sessione decide cosa è raggiungibile. Cloud-only:
// niente sessione → solo /sign-in; con sessione → l'app. Stack.Protected (Expo Router v57).
function RootNavigator() {
  const { data: session, isPending } = useSession();

  // Dev-only: se EXPO_PUBLIC_DEV_AUTOLOGIN è configurato, salta /sign-in e loggati
  // con l'utente seed. Un solo tentativo per apertura app (niente retry-loop se
  // l'utente seed non esiste ancora: resti su /sign-in → /dev-signup per crearlo).
  const triedDevAutoLogin = useRef(false);
  useEffect(() => {
    if (DEV_AUTOLOGIN && !session && !isPending && !triedDevAutoLogin.current) {
      triedDevAutoLogin.current = true;
      signInDev();
    }
  }, [session, isPending]);

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
        <Stack.Screen name="admin/tournaments" />
        <Stack.Screen name="admin/tournaments/[id]" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
      {/* Sempre montati (con o senza sessione), ma dichiarati DOPO i guard: al logout
          il fallback è la prima schermata accessibile (sign-in), non una rotta dinamica.
          Il dettaglio mostra i controlli solo se loggato; la lista pubblica è aperta a tutti. */}
      <Stack.Screen name="deck/[id]" />
      <Stack.Screen name="public-decks" />
      <Stack.Screen name="tournaments/[id]" />
      <Stack.Screen name="tournament-decks/[id]" />
    </Stack>
  );
}

export default function RootLayout() {
  const dark = useColorScheme() === "dark";

  const pathname = usePathname();
  const blue =
    !pathname.startsWith("/deck") && !pathname.startsWith("/banlist");
  const paper = blue
    ? dark
      ? paperBlueDarkTheme
      : paperBlueLightTheme
    : dark
      ? paperDarkTheme
      : paperLightTheme;
  const nav = navTheme(dark ? NavDarkTheme : NavDefaultTheme, paper);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <PaperProvider theme={paper} settings={paperSettings}>
        <ThemeProvider value={nav}>
          <Head>
            <title>YGO Tracker</title>
          </Head>
          <RootNavigator />
          {/* Montato una volta: qualsiasi schermata apre il dettaglio via useCardDetail */}
          <CardDetailDialog />
        </ThemeProvider>
      </PaperProvider>
    </PersistQueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
