// Dettaglio pubblico di un Tournament: deck da torneo published ordinati per Placement.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

import { CardCell } from '@/components/card/card-cell';
import { DetailHero } from '@/components/tournament/detail-hero';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { contentContainer, Spacing } from '@/constants/theme';
import { formatTournamentDate, placementLabel } from '@/domain/tournaments';
import { FORMATS } from '@/domain/types';
import { useCoverCards } from '@/hooks/shared/use-cover-cards';
import { useGrid } from '@/hooks/shared/use-layout';
import { useTournament } from '@/hooks/tournament/use-tournaments';

export default function TournamentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useTournament(id);
  const { coverUrl, coversLoading } = useCoverCards(data?.decks);

  // copertine: celle grandi, poche per riga
  const { cellWidth } = useGrid({ phone: 2, tablet: 3, desktop: 4 });

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader title={data?.tournament.name ?? 'Torneo'} fallback="/public-decks" />

      <ScreenState loading={isLoading || coversLoading} error={isError} notFound="Torneo non trovato." data={data}>
        {({ tournament, decks }) => (
          <ScrollView contentContainerStyle={styles.content}>
            <DetailHero
              title={tournament.name}
              meta={[
                formatTournamentDate(tournament.date),
                tournament.location,
                FORMATS[tournament.format]?.label,
              ]}
            />

            <List.Subheader>Deck da torneo</List.Subheader>
            <View style={styles.grid}>
              {decks.map((deck) => (
                <View key={deck.id} style={{ width: cellWidth }}>
                  <CardCell
                    name={deck.name}
                    imageUrl={coverUrl(deck)}
                    subtitle={[placementLabel(deck.placement), deck.playerName, `${deck.cardCount} carte`].filter(
                      (s): s is string => !!s,
                    )}
                    onPress={() => router.push({ pathname: '/tournament-decks/[id]', params: { id: deck.id } })}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
