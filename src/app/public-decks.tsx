// Lista pubblica dei deck: aperta senza autenticazione (entry point dal sign-in).
// ponytail: per ora vuota — niente fetch. La lettura dei deck pubblici altrui si
// cabla quando serve (vedi grilling: lista pubblica popolata è fuori scope).
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function PublicDecksScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))}
        />
        <Appbar.Content title="Deck pubblici" />
      </Appbar.Header>
      <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
        Nessun deck pubblico al momento.
      </Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { backgroundColor: 'transparent', width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
