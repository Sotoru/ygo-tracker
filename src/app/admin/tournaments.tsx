// Admin catalogo tornei: permesso editoriale via allowlist client + RLS lato DB.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { NewTournamentDialog } from '@/components/tournament/new-tournament-dialog';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { TournamentRow } from '@/components/tournament/tournament-row';
import { contentContainer, Spacing } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { useAdminTournaments } from '@/hooks/tournament/use-tournaments';

export default function AdminTournamentsScreen() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data: tournaments = [], isLoading, isError } = useAdminTournaments(isAdmin);
  const [open, setOpen] = useState(false);

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader title="Admin tornei" fallback="/deck">
        {isAdmin ? <Appbar.Action icon="plus" accessibilityLabel="Nuovo torneo" onPress={() => setOpen(true)} /> : null}
      </ScreenHeader>

      <NewTournamentDialog
        visible={open}
        onDismiss={() => setOpen(false)}
        onCreated={(tournament) => {
          setOpen(false);
          router.push({ pathname: '/admin/tournaments/[id]', params: { id: tournament.id } });
        }}
      />

      <ScreenState
        gate={isAdmin ? undefined : 'Accesso riservato admin.'}
        loading={isLoading}
        error={isError}
        data={tournaments}>
        {(list) => (
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((tournament) => (
              <TournamentRow
                key={tournament.id}
                tournament={tournament}
                countLabel={`${tournament.publishedDeckCount} published`}
                onPress={() => router.push({ pathname: '/admin/tournaments/[id]', params: { id: tournament.id } })}
              />
            ))}
          </ScrollView>
        )}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.two },
});
