// Dettaglio read-only di un Tournament Deck: stesse zone del Deck personale, senza azioni mutative.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, List, Text, useTheme } from 'react-native-paper';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, DenseGridColumns, Spacing } from '@/constants/theme';
import { formatTournamentDate, placementLabel } from '@/domain/tournaments';
import { deckSections } from '@/domain/deck-sections';
import { FORMATS } from '@/domain/types';
import { useCardDetail } from '@/hooks/use-card-detail';
import { useCardsByIds } from '@/hooks/use-cards';
import { useGrid } from '@/hooks/use-layout';
import { useSettings } from '@/hooks/use-settings';
import { useTournamentDeck } from '@/hooks/use-tournaments';

export default function TournamentDeckDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const openDetail = useCardDetail((s) => s.open);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useTournamentDeck(id);
  const entries = useMemo(() => data?.entries ?? [], [data]);
  const ids = useMemo(() => [...new Set(entries.map((e) => e.cardId))], [entries]);
  const { data: cards = [], isLoading: cardsLoading } = useCardsByIds(ids);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  const { cellWidth } = useGrid(DenseGridColumns);

  // stesse preferenze globali del deck personale (Impostazioni → Deck)
  const groupRows = useSettings((s) => s.groupRows);
  const sortByCopies = useSettings((s) => s.sortByCopies);
  const sections = deckSections(entries, (cardId) => byId.get(cardId)?.frameType, { groupRows, sortByCopies });

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/public-decks'))} />
        <Appbar.Content title={data?.deck.name ?? 'Deck da torneo'} subtitle={data ? placementLabel(data.deck.placement) : undefined} />
      </Appbar.Header>

      {isLoading || cardsLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError || !data ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Deck non trovato.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { backgroundColor: colors.surfaceVariant }]}> 
            <Text variant="headlineSmall">{data.deck.name}</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {[data.deck.playerName, placementLabel(data.deck.placement), data.tournament.name, formatTournamentDate(data.tournament.date), FORMATS[data.deck.format]?.label]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            {data.deck.sourceUrl ? (
              <Button mode="text" icon="open-in-new" onPress={() => Linking.openURL(data.deck.sourceUrl!)} style={styles.source}>
                Fonte
              </Button>
            ) : null}
          </View>

          {sections.map((sec) => (
            <View key={sec.label} style={styles.zone}>
              <List.Subheader>{`${sec.label} (${sec.groups.flat().reduce((n, e) => n + e.count, 0)})`}</List.Subheader>
              {sec.groups.map((group) => (
                <View key={`${sec.label}-${group[0].cardId}`} style={styles.grid}>
                  {group.flatMap((e) => {
                    const card = byId.get(e.cardId);
                    if (!card) return [];
                    return (
                      <View key={`${e.zone}-${e.cardId}`} style={{ width: cellWidth }}>
                        <CardCell
                          name={card.name}
                          imageUrl={card.card_images[0]?.image_url_cropped}
                          frameType={card.frameType}
                          subtitle={[]}
                          count={e.count}
                          badge={e.count >= 2 ? `×${e.count}` : undefined}
                          onPress={() => openDetail(card)}
                        />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { ...cappedWidth, backgroundColor: 'transparent' },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  hero: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
  source: { alignSelf: 'flex-start' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  zone: { gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
