// Lista pubblica dei Tornei: entry point aperto anche senza autenticazione.
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

import { FormatChips } from '@/components/shared/format-chips';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenMessage, ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { TournamentRow } from '@/components/tournament/tournament-row';
import { contentContainer, Spacing } from '@/constants/theme';
import { tournamentYear } from '@/domain/tournaments';
import { type Format } from '@/domain/types';
import { useTournaments } from '@/hooks/tournament/use-tournaments';

export default function PublicDecksScreen() {
  const router = useRouter();
  const [format, setFormat] = useState<Format | undefined>();
  const { data: tournaments = [], isLoading, isError } = useTournaments(format);

  const byYear = useMemo(() => {
    const groups = new Map<string, typeof tournaments>();
    for (const tournament of tournaments) {
      const year = tournamentYear(tournament);
      groups.set(year, [...(groups.get(year) ?? []), tournament]);
    }
    return [...groups.entries()].sort(([a], [b]) => b.localeCompare(a));
  }, [tournaments]);

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader title="Tornei" fallback="/sign-in" />

      <ScreenState loading={isLoading} error={isError} data={byYear}>
        {(years) => (
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.filter}>
              <FormatChips value={format} onChange={setFormat} allLabel="Tutti" />
            </View>

            {/* a lista vuota il filtro resta visibile: è da lì che si cambia formato */}
            {years.length === 0 ? (
              <ScreenMessage>Nessun torneo pubblicato.</ScreenMessage>
            ) : (
              years.map(([year, items]) => (
                <View key={year}>
                  <List.Subheader>{year}</List.Subheader>
                  {items.map((tournament) => (
                    <TournamentRow
                      key={tournament.id}
                      tournament={tournament}
                      countLabel={`${tournament.publishedDeckCount} deck`}
                      onPress={() => router.push({ pathname: '/tournaments/[id]', params: { id: tournament.id } })}
                    />
                  ))}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.two },
  filter: { paddingTop: Spacing.two },
});
