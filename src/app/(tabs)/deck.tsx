// Tab Deck: la griglia dei tuoi Deck. Ogni deck è una card in stile wishlist, con
// l'artwork della carta "in evidenza" (copertina risolta lato repo: scelta esplicita
// o fallback alla prima carta) + FAB (+) per crearne uno nuovo. La copertina si
// sceglie nel dettaglio del deck.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, contentContainer, Spacing } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { FORMATS } from '@/domain/types';
import { useCardsByIds } from '@/hooks/use-cards';
import { useDecks } from '@/hooks/use-decks';
import { useGrid } from '@/hooks/use-layout';

export default function DeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data: decks = [], isLoading, isError } = useDecks();

  // batch-fetch (una richiesta) delle carte-copertina, per mostrarne l'artwork
  const coverIds = useMemo(
    () => [...new Set(decks.map((d) => d.coverCardId).filter((id): id is number => id != null))],
    [decks],
  );
  const { data: covers = [] } = useCardsByIds(coverIds);
  const coverById = useMemo(() => new Map(covers.map((c) => [c.id, c])), [covers]);

  // copertine: celle grandi, poche per riga (non è una lista densa di carte)
  const { cellWidth } = useGrid({ phone: 3, tablet: 4, desktop: 5 });

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: Platform.select({ web: 0, default: insets.top + Spacing.three }) }]}>
      <View style={styles.actions}>
        <Button mode="contained-tonal" icon="trophy" onPress={() => router.push('/public-decks')}>
          Tornei
        </Button>
        {isAdmin ? (
          <Button mode="outlined" icon="shield-crown" onPress={() => router.push('/admin/tournaments')}>
            Admin tornei
          </Button>
        ) : null}
      </View>

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

      <FAB
        icon="plus"
        accessibilityLabel="Nuovo deck"
        style={[styles.fab, { bottom: Spacing.four + BottomTabInset }]}
        onPress={() => router.push('/deck/new')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six },
  actions: { ...contentContainer, alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, paddingHorizontal: Spacing.three },
  // FAB standard MD3 ancorato al bordo dello schermo (allineamento identico web/native).
  fab: { position: 'absolute', right: Spacing.three },
});
