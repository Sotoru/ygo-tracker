// Dettaglio read-only di un Tournament Deck: stesse zone del Deck personale, senza azioni mutative.
import { useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

import { DeckGrid } from '@/components/deck/deck-grid';
import { DetailHero } from '@/components/tournament/detail-hero';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { contentContainer, DenseGridColumns, Spacing } from '@/constants/theme';
import { formatTournamentDate, placementLabel } from '@/domain/tournaments';
import { FORMATS } from '@/domain/types';
import { useCardDetail } from '@/hooks/card/use-card-detail';
import { useDeckCards } from '@/hooks/deck/use-deck-cards';
import { useGrid } from '@/hooks/shared/use-layout';
import { useTournamentDeck } from '@/hooks/tournament/use-tournaments';

export default function TournamentDeckDetailScreen() {
  const openDetail = useCardDetail((s) => s.open);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useTournamentDeck(id);
  const entries = useMemo(() => data?.entries ?? [], [data]);
  // stesse preferenze globali del deck personale (Impostazioni → Deck)
  const { byId, cardsLoading, sections } = useDeckCards(entries);

  const { cellWidth } = useGrid(DenseGridColumns);

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader
        title={data?.deck.name ?? 'Deck da torneo'}
        subtitle={data ? placementLabel(data.deck.placement) : undefined}
        fallback="/public-decks"
      />

      <ScreenState loading={isLoading || cardsLoading} error={isError} notFound="Deck non trovato." data={data}>
        {({ deck, tournament }) => (
          <ScrollView contentContainerStyle={styles.content}>
            <DetailHero
              title={deck.name}
              meta={[
                deck.playerName,
                placementLabel(deck.placement),
                tournament.name,
                formatTournamentDate(tournament.date),
                FORMATS[deck.format]?.label,
              ]}>
              {deck.sourceUrl ? (
                <Button
                  mode="text"
                  icon="open-in-new"
                  onPress={() => Linking.openURL(deck.sourceUrl!)}
                  style={styles.source}>
                  Fonte
                </Button>
              ) : null}
            </DetailHero>

            <DeckGrid sections={sections} byId={byId} cellWidth={cellWidth} onPressCard={openDetail} />
          </ScrollView>
        )}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  source: { alignSelf: 'flex-start' },
});
