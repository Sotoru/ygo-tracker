// Admin dettaglio torneo: modifica metadati e gestisce i Tournament Deck in draft/published.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Divider, List, Menu, useTheme } from 'react-native-paper';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenMessage, ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { TournamentDeckDialog } from '@/components/tournament/tournament-deck-dialog';
import {
  canSaveTournament,
  TournamentFields,
  type TournamentFieldsValue,
} from '@/components/tournament/tournament-fields';
import { contentContainer, Spacing } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import type { TournamentDeckSummary } from '@/data/neon-tournaments';
import { formatTournamentDate, placementLabel } from '@/domain/tournaments';
import {
  useAdminTournament,
  useDeleteTournament,
  useDeleteTournamentDeck,
  useSetTournamentDeckStatus,
  useUpdateTournament,
} from '@/hooks/tournament/use-tournaments';

const emptyForm = (): TournamentFieldsValue => ({ name: '', date: '', location: '', format: 'goat' });

// Riga deck con il suo menu azioni: il menu aperto è stato della riga, non della schermata.
function AdminDeckRow({
  deck,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  deck: TournamentDeckSummary;
  onEdit: () => void;
  onToggleStatus: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const published = deck.status === 'published';
  const act = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <List.Item
      title={deck.name}
      description={[placementLabel(deck.placement), deck.playerName, `${deck.cardCount} carte`, deck.status]
        .filter(Boolean)
        .join(' · ')}
      left={(props) => <List.Icon {...props} icon={published ? 'earth' : 'file-document-edit'} />}
      right={() => (
        <Menu
          visible={menuOpen}
          onDismiss={() => setMenuOpen(false)}
          anchor={
            <Button compact onPress={() => setMenuOpen(true)}>
              Azioni
            </Button>
          }>
          <Menu.Item leadingIcon="pencil" title="Modifica" onPress={act(onEdit)} />
          <Menu.Item
            leadingIcon={published ? 'file-document-edit' : 'earth'}
            title={published ? 'Rimetti in draft' : 'Pubblica'}
            onPress={act(onToggleStatus)}
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            title="Elimina"
            titleStyle={{ color: colors.error }}
            onPress={act(onDelete)}
          />
        </Menu>
      )}
      style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
    />
  );
}

// Pannello metadati del torneo: campi + Salva/Elimina.
function TournamentPanel({
  form,
  onChange,
  saving,
  onSave,
  onDelete,
}: {
  form: TournamentFieldsValue;
  onChange: (value: TournamentFieldsValue) => void;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.panel, { backgroundColor: colors.surfaceVariant }]}>
      <TournamentFields value={form} onChange={onChange} />
      <View style={styles.actions}>
        <Button
          mode="contained"
          disabled={!canSaveTournament(form) || saving}
          loading={saving}
          onPress={onSave}>
          Salva torneo
        </Button>
        <Button mode="text" textColor={colors.error} onPress={onDelete}>
          Elimina
        </Button>
      </View>
    </View>
  );
}

export default function AdminTournamentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data, isLoading, isError } = useAdminTournament(id, isAdmin);

  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const setStatus = useSetTournamentDeckStatus();
  const deleteDeck = useDeleteTournamentDeck();

  const [form, setForm] = useState<TournamentFieldsValue>(emptyForm);
  // null = dialog chiuso; { deck: null } = nuovo; { deck } = modifica
  const [deckDialog, setDeckDialog] = useState<{ deck: TournamentDeckSummary | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formSourceId, setFormSourceId] = useState<string | undefined>();

  // il form parte dai dati del torneo appena arrivano (e se cambio torneo, dai nuovi)
  if (data && formSourceId !== data.tournament.id) {
    setFormSourceId(data.tournament.id);
    setForm({
      name: data.tournament.name,
      date: data.tournament.date,
      location: data.tournament.location ?? '',
      format: data.tournament.format,
    });
  }

  const onSaveTournament = () => {
    if (!data) return;
    updateTournament.mutate({
      id: data.tournament.id,
      name: form.name.trim(),
      date: form.date.trim(),
      location: form.location.trim() || null,
      format: form.format,
    });
  };

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader title={data?.tournament.name ?? 'Torneo'} fallback="/admin/tournaments">
        {isAdmin ? (
          <Appbar.Action
            icon="plus"
            accessibilityLabel="Nuovo deck da torneo"
            onPress={() => setDeckDialog({ deck: null })}
          />
        ) : null}
      </ScreenHeader>

      {deckDialog && data ? (
        <TournamentDeckDialog
          tournament={data.tournament}
          deck={deckDialog.deck}
          onDismiss={() => setDeckDialog(null)}
        />
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title="Eliminare il torneo?"
        confirmLabel="Elimina"
        loading={deleteTournament.isPending}
        onDismiss={() => setConfirmDelete(false)}
        onConfirm={async () => {
          await deleteTournament.mutateAsync(id);
          router.replace('/admin/tournaments');
        }}>
        Verranno eliminati anche i deck da torneo collegati.
      </ConfirmDialog>

      <ScreenState
        gate={isAdmin ? undefined : 'Accesso riservato admin.'}
        loading={isLoading}
        error={isError}
        notFound="Torneo non trovato."
        data={data}>
        {({ tournament, decks }) => (
          <ScrollView contentContainerStyle={styles.content}>
            <TournamentPanel
              form={form}
              onChange={setForm}
              saving={updateTournament.isPending}
              onSave={onSaveTournament}
              onDelete={() => setConfirmDelete(true)}
            />

            <List.Subheader>{`Deck da torneo · ${formatTournamentDate(tournament.date)}`}</List.Subheader>
            {decks.length === 0 ? (
              <ScreenMessage>Nessun deck da torneo.</ScreenMessage>
            ) : (
              decks.map((deck) => (
                <AdminDeckRow
                  key={deck.id}
                  deck={deck}
                  onEdit={() => setDeckDialog({ deck })}
                  onToggleStatus={() =>
                    setStatus.mutate({ id: deck.id, status: deck.status === 'published' ? 'draft' : 'published' })
                  }
                  onDelete={() => deleteDeck.mutate(deck.id)}
                />
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
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  panel: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { borderRadius: Spacing.three, marginBottom: Spacing.two },
});
