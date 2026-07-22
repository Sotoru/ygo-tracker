// Tab Deck: la griglia dei tuoi Deck. Ogni deck è una card in stile wishlist, con
// l'artwork della carta "in evidenza" (copertina risolta lato repo: scelta esplicita
// o fallback alla prima carta) + FAB (+) per crearne uno nuovo. La copertina si
// sceglie nel dettaglio del deck.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, FAB, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { FORMATS } from '@/domain/types';
import { useCardsByIds } from '@/hooks/use-cards';
import { useDecks } from '@/hooks/use-decks';

const MIN_CELL_WIDTH = 120; // stessa griglia responsive del dettaglio deck

export default function DeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: decks = [], isLoading, isError } = useDecks();

  // batch-fetch (una richiesta) delle carte-copertina, per mostrarne l'artwork
  const coverIds = useMemo(
    () => [...new Set(decks.map((d) => d.coverCardId).filter((id): id is number => id != null))],
    [decks],
  );
  const { data: covers = [] } = useCardsByIds(coverIds);
  const coverById = useMemo(() => new Map(covers.map((c) => [c.id, c])), [covers]);

  const { width } = useWindowDimensions();
  const available = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const columns = Math.max(1, Math.floor((available + Spacing.two) / (MIN_CELL_WIDTH + Spacing.two)));
  const cellWidth = Math.floor((available - Spacing.two * (columns - 1)) / columns);

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: Platform.select({ web: 0, default: insets.top + Spacing.three }) }]}>
      {isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Errore di rete. Riprova.
        </Text>
      ) : decks.length === 0 ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Nessun deck. Tocca + per crearne uno.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {decks.map((d) => {
              const cover = d.coverCardId != null ? coverById.get(d.coverCardId) : undefined;
              return (
                <View key={d.id} style={{ width: cellWidth }}>
                  <CardCell
                    name={d.name}
                    imageUrl={cover?.card_images[0]?.image_url_cropped}
                    subtitle={[`${FORMATS[d.format]?.label ?? d.format} · ${d.cardCount} carte`]}
                    onPress={() => router.push(`/deck/${d.id}`)}
                  />
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}

      <View pointerEvents="box-none" style={[styles.fabContainer, { bottom: Spacing.four + BottomTabInset }]}>
        <View pointerEvents="box-none" style={styles.fabRow}>
          <FAB
            icon="plus"
            accessibilityLabel="Nuovo deck"
            onPress={() => router.push('/deck/new')}
          />
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: Spacing.three },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center', paddingBottom: Spacing.six },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six },
  // FAB ancorato al bordo destro del container (non dello schermo): stessa maxWidth del content.
  // Outer full-width centra la row; la row cappa a maxWidth e spinge il FAB a destra.
  fabContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  fabRow: { width: '100%', maxWidth: MaxContentWidth, alignItems: 'flex-end' },
});
