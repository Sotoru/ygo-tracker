// Tab Deck: stub. Fuori scope per ora (sviluppiamo solo la Wishlist), esiste
// solo per rendere reale la struttura a due tab.
import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';

export default function DeckScreen() {
  const { colors } = useTheme();
  return (
    <ThemedView style={styles.screen}>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        Deck — presto
      </Text>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
