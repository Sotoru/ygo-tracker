// Dettaglio pubblico di un Tournament: deck da torneo published ordinati per Placement.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Text, useTheme } from 'react-native-paper';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, Spacing } from '@/constants/theme';
import { formatTournamentDate, placementLabel } from '@/domain/tournaments';
import { FORMATS } from '@/domain/types';
import { useCardsByIds } from '@/hooks/use-cards';
import { useGrid } from '@/hooks/use-layout';
import { useTournament } from '@/hooks/use-tournaments';

export default function TournamentDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading, isError } = useTournament(id);

  const coverIds = useMemo(
    () => [...new Set((data?.decks ?? []).map((d) => d.coverCardId).filter((coverId): coverId is number => coverId != null))],
    [data],
  );
  const { data: covers = [], isLoading: coversLoading } = useCardsByIds(coverIds);
  const coverById = useMemo(() => new Map(covers.map((c) => [c.id, c])), [covers]);

  // copertine: celle grandi, poche per riga
  const { cellWidth } = useGrid({ phone: 2, tablet: 3, desktop: 4 });

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/public-decks'))} />
        <Appbar.Content title={data?.tournament.name ?? 'Torneo'} />
      </Appbar.Header>

      {isLoading || coversLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError || !data ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Torneo non trovato.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.hero, { backgroundColor: colors.surfaceVariant }]}> 
            <Text variant="headlineSmall">{data.tournament.name}</Text>
            <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
              {[formatTournamentDate(data.tournament.date), data.tournament.location, FORMATS[data.tournament.format]?.label].filter(Boolean).join(' · ')}
            </Text>
          </View>

          <List.Subheader>Deck da torneo</List.Subheader>
          <View style={styles.grid}>
            {data.decks.map((deck) => {
              const cover = deck.coverCardId != null ? coverById.get(deck.coverCardId) : undefined;
              return (
                <View key={deck.id} style={{ width: cellWidth }}>
                  <CardCell
                    name={deck.name}
                    imageUrl={cover?.card_images[0]?.image_url_cropped}
                    subtitle={[placementLabel(deck.placement), deck.playerName, `${deck.cardCount} carte`].filter((s): s is string => !!s)}
                    onPress={() => router.push({ pathname: '/tournament-decks/[id]', params: { id: deck.id } })}
                  />
                </View>
              );
            })}
          </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
