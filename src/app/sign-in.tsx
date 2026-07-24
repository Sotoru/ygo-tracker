// Pagina di login: unico ingresso quando sloggato (il gate nel root layout manda qui).
// Solo Google (vedi docs/adr/0005). UI Paper/MD3, niente colori hard-coded.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { signInWithGoogle } from '@/data/auth';

export default function SignInScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGoogle = async () => {
    setBusy(true);
    setError(null);
    try {
      // Su web fa un full-page redirect a Google: il codice dopo di norma non gira.
      // Al ritorno (callbackURL '/') è un nuovo load e il gate mostra l'app.
      await signInWithGoogle();
    } catch {
      setBusy(false);
      setError('Login non riuscito. Riprova.');
    }
  };

  return (
    <ThemedView style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.center}>
        <Text variant="headlineMedium" style={styles.text}>
          Yu-Gi-Oh! Deck & Wishlist
        </Text>
        <Text variant="bodyMedium" style={[styles.text, { color: colors.onSurfaceVariant }]}>
          Accedi per sincronizzare wishlist e deck.
        </Text>
        <Button mode="contained" icon="google" onPress={onGoogle} disabled={busy} loading={busy}>
          Continua con Google
        </Button>
        <Button mode="text" icon="earth" onPress={() => router.push('/public-decks')}>
          Sfoglia i deck pubblici
        </Button>
        {error ? (
          <Text variant="bodyMedium" style={[styles.text, { color: colors.error }]}>
            {error}
          </Text>
        ) : null}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: Spacing.three, justifyContent: 'center' },
  center: {
    width: '100%',
    maxWidth: 360, // form stretto, centrato
    alignSelf: 'center',
    alignItems: 'center',
    gap: Spacing.three,
  },
  text: { textAlign: 'center' },
});
