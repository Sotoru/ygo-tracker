// Lista pubblica dei Tornei: entry point aperto anche senza autenticazione.
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Chip, List, Text, useTheme } from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, Spacing } from '@/constants/theme';
import { formatTournamentDate, tournamentYear } from '@/domain/tournaments';
import { FORMATS, type Format } from '@/domain/types';
import { useTournaments } from '@/hooks/use-tournaments';

const FORMAT_LIST = Object.keys(FORMATS) as Format[];

export default function PublicDecksScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/sign-in'))} />
        <Appbar.Content title="Tornei" />
      </Appbar.Header>

      {isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Errore di rete. Riprova.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.chips}>
            <Chip selected={format == null} showSelectedOverlay onPress={() => setFormat(undefined)}>Tutti</Chip>
            {FORMAT_LIST.map((f) => (
              <Chip key={f} selected={format === f} showSelectedOverlay onPress={() => setFormat(f)}>{FORMATS[f].label}</Chip>
            ))}
          </View>

          {byYear.length === 0 ? (
            <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Nessun torneo pubblicato.</Text>
          ) : (
            byYear.map(([year, items]) => (
              <View key={year}>
                <List.Subheader>{year}</List.Subheader>
                {items.map((tournament) => (
                  <List.Item
                    key={tournament.id}
                    title={tournament.name}
                    description={[formatTournamentDate(tournament.date), tournament.location, FORMATS[tournament.format]?.label, `${tournament.publishedDeckCount} deck`]
                      .filter(Boolean)
                      .join(' · ')}
                    left={(props) => <List.Icon {...props} icon="trophy" />}
                    right={(props) => <List.Icon {...props} icon="chevron-right" />}
                    onPress={() => router.push({ pathname: '/tournaments/[id]', params: { id: tournament.id } })}
                    style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { ...cappedWidth, backgroundColor: 'transparent' },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingTop: Spacing.two },
  row: { borderRadius: Spacing.three, marginBottom: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
