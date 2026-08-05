// Admin dettaglio torneo: modifica metadati e gestisce i Tournament Deck in draft/published.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Dialog,
  Divider,
  HelperText,
  List,
  Menu,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, Spacing, dialogWidth } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { pickTextFile } from '@/data/pick-file';
import { formatTournamentDate, placementLabel, PLACEMENT_LIST } from '@/domain/tournaments';
import { FORMATS, PLACEMENTS, type DeckEntryInput, type Format, type Placement } from '@/domain/types';
import { parseYdk } from '@/domain/ydk';
import {
  useAdminTournament,
  useCreateTournamentDeck,
  useDeleteTournament,
  useDeleteTournamentDeck,
  useReplaceTournamentDeckEntries,
  useSetTournamentDeckStatus,
  useUpdateTournament,
  useUpdateTournamentDeck,
} from '@/hooks/use-tournaments';

const FORMAT_LIST = Object.keys(FORMATS) as Format[];

type DeckForm = {
  id?: string;
  name: string;
  playerName: string;
  placement: Placement;
  sourceUrl: string;
  coverCardId: string;
  entries: DeckEntryInput[];
};

const emptyDeckForm = (): DeckForm => ({ name: '', playerName: '', placement: 'top8', sourceUrl: '', coverCardId: '', entries: [] });

export default function AdminTournamentDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data, isLoading, isError } = useAdminTournament(id, isAdmin);

  const updateTournament = useUpdateTournament();
  const deleteTournament = useDeleteTournament();
  const createDeck = useCreateTournamentDeck();
  const updateDeck = useUpdateTournamentDeck();
  const replaceEntries = useReplaceTournamentDeckEntries();
  const setStatus = useSetTournamentDeckStatus();
  const deleteDeck = useDeleteTournamentDeck();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [format, setFormat] = useState<Format>('goat');
  const [deckFormOpen, setDeckFormOpen] = useState(false);
  const [deckForm, setDeckForm] = useState<DeckForm>(emptyDeckForm);
  const [menuDeckId, setMenuDeckId] = useState<string | null>(null);
  const [confirmDeleteTournament, setConfirmDeleteTournament] = useState(false);
  const [importError, setImportError] = useState(false);
  const formReadyFor = data?.tournament.id;
  const [draftSourceId, setDraftSourceId] = useState<string | undefined>();

  if (data && draftSourceId !== formReadyFor) {
    setDraftSourceId(formReadyFor);
    setName(data.tournament.name);
    setDate(data.tournament.date);
    setLocation(data.tournament.location ?? '');
    setFormat(data.tournament.format);
  }

  const openNewDeck = () => {
    setImportError(false);
    setDeckForm(emptyDeckForm());
    setDeckFormOpen(true);
  };

  const openEditDeck = (deckId: string) => {
    const deck = data?.decks.find((d) => d.id === deckId);
    if (!deck) return;
    setImportError(false);
    setDeckForm({
      id: deck.id,
      name: deck.name,
      playerName: deck.playerName ?? '',
      placement: deck.placement,
      sourceUrl: deck.sourceUrl ?? '',
      coverCardId: deck.coverCardId?.toString() ?? '',
      entries: [],
    });
    setDeckFormOpen(true);
  };

  const onImportDeck = async () => {
    setImportError(false);
    try {
      const picked = await pickTextFile();
      if (!picked) return;
      const entries = parseYdk(picked.text);
      setDeckForm((form) => ({ ...form, entries, name: form.name || picked.name.replace(/\.[^.]+$/, '') }));
    } catch {
      setImportError(true);
    }
  };

  const onSaveTournament = () => {
    if (!data) return;
    updateTournament.mutate({ id: data.tournament.id, name: name.trim(), date: date.trim(), location: location.trim() || null, format });
  };

  const onSaveDeck = async () => {
    if (!data) return;
    const coverCardId = deckForm.coverCardId.trim() ? Number(deckForm.coverCardId.trim()) : null;
    if (deckForm.id) {
      await updateDeck.mutateAsync({
        id: deckForm.id,
        name: deckForm.name.trim(),
        format: data.tournament.format,
        placement: deckForm.placement,
        playerName: deckForm.playerName.trim() || null,
        coverCardId: Number.isFinite(coverCardId) ? coverCardId : null,
        sourceUrl: deckForm.sourceUrl.trim() || null,
      });
      if (deckForm.entries.length) await replaceEntries.mutateAsync({ id: deckForm.id, entries: deckForm.entries });
    } else {
      await createDeck.mutateAsync({
        tournamentId: data.tournament.id,
        name: deckForm.name.trim(),
        format: data.tournament.format,
        placement: deckForm.placement,
        entries: deckForm.entries,
        playerName: deckForm.playerName.trim() || null,
        coverCardId: Number.isFinite(coverCardId) ? coverCardId : null,
        sourceUrl: deckForm.sourceUrl.trim() || null,
      });
    }
    setDeckFormOpen(false);
  };

  const deckCardCount = deckForm.entries.reduce((n, e) => n + e.count, 0);

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/admin/tournaments'))} />
        <Appbar.Content title={data?.tournament.name ?? 'Torneo'} />
        {isAdmin ? <Appbar.Action icon="plus" accessibilityLabel="Nuovo deck da torneo" onPress={openNewDeck} /> : null}
      </Appbar.Header>

      <Portal>
        <Dialog visible={deckFormOpen} onDismiss={() => setDeckFormOpen(false)} style={dialogWidth}>
          <Dialog.Title>{deckForm.id ? 'Modifica deck da torneo' : 'Nuovo deck da torneo'}</Dialog.Title>
          <Dialog.Content>
            <ScrollView contentContainerStyle={styles.form}>
              <TextInput label="Nome deck" value={deckForm.name} onChangeText={(v) => setDeckForm((f) => ({ ...f, name: v }))} mode="outlined" />
              <TextInput label="Player" value={deckForm.playerName} onChangeText={(v) => setDeckForm((f) => ({ ...f, playerName: v }))} mode="outlined" />
              <TextInput label="Fonte URL" value={deckForm.sourceUrl} onChangeText={(v) => setDeckForm((f) => ({ ...f, sourceUrl: v }))} mode="outlined" autoCapitalize="none" />
              <TextInput label="Cover card id" value={deckForm.coverCardId} onChangeText={(v) => setDeckForm((f) => ({ ...f, coverCardId: v.replace(/[^0-9]/g, '') }))} mode="outlined" keyboardType="number-pad" />
              <Text variant="labelLarge">Placement</Text>
              <View style={styles.chips}>
                {PLACEMENT_LIST.map((p) => <Chip key={p} selected={deckForm.placement === p} showSelectedOverlay onPress={() => setDeckForm((f) => ({ ...f, placement: p }))}>{PLACEMENTS[p].label}</Chip>)}
              </View>
              <Button mode="outlined" icon="file-upload" onPress={onImportDeck}>{deckForm.id ? 'Reimporta .ydk' : 'Importa .ydk'}</Button>
              {importError ? <HelperText type="error" visible>Impossibile leggere il file.</HelperText> : null}
              {deckCardCount > 0 ? <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>{deckCardCount} carte importate.</Text> : null}
              {deckForm.id && deckCardCount === 0 ? <HelperText type="info" visible>Lascia senza import per conservare le carte attuali.</HelperText> : null}
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeckFormOpen(false)}>Annulla</Button>
            <Button disabled={!deckForm.name.trim() || (!deckForm.id && deckCardCount === 0) || createDeck.isPending || updateDeck.isPending} loading={createDeck.isPending || updateDeck.isPending} onPress={onSaveDeck}>Salva</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={confirmDeleteTournament} onDismiss={() => setConfirmDeleteTournament(false)} style={dialogWidth}>
          <Dialog.Title>Eliminare il torneo?</Dialog.Title>
          <Dialog.Content><Text variant="bodyMedium">Verranno eliminati anche i deck da torneo collegati.</Text></Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteTournament(false)}>Annulla</Button>
            <Button loading={deleteTournament.isPending} onPress={async () => { await deleteTournament.mutateAsync(id); router.replace('/admin/tournaments'); }}>Elimina</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {!isAdmin ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Accesso riservato admin.</Text>
      ) : isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError || !data ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Torneo non trovato.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.panel, { backgroundColor: colors.surfaceVariant }]}> 
            <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" />
            <TextInput label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} mode="outlined" />
            <TextInput label="Location" value={location} onChangeText={setLocation} mode="outlined" />
            <View style={styles.chips}>
              {FORMAT_LIST.map((f) => <Chip key={f} selected={format === f} showSelectedOverlay onPress={() => setFormat(f)}>{FORMATS[f].label}</Chip>)}
            </View>
            <View style={styles.actions}>
              <Button mode="contained" disabled={!name.trim() || !date.trim() || updateTournament.isPending} loading={updateTournament.isPending} onPress={onSaveTournament}>Salva torneo</Button>
              <Button mode="text" textColor={colors.error} onPress={() => setConfirmDeleteTournament(true)}>Elimina</Button>
            </View>
          </View>

          <List.Subheader>{`Deck da torneo · ${formatTournamentDate(data.tournament.date)}`}</List.Subheader>
          {data.decks.length === 0 ? (
            <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Nessun deck da torneo.</Text>
          ) : (
            data.decks.map((deck) => (
              <List.Item
                key={deck.id}
                title={deck.name}
                description={[placementLabel(deck.placement), deck.playerName, `${deck.cardCount} carte`, deck.status].filter(Boolean).join(' · ')}
                left={(props) => <List.Icon {...props} icon={deck.status === 'published' ? 'earth' : 'file-document-edit'} />}
                right={() => (
                  <Menu
                    visible={menuDeckId === deck.id}
                    onDismiss={() => setMenuDeckId(null)}
                    anchor={<Button compact onPress={() => setMenuDeckId(deck.id)}>Azioni</Button>}>
                    <Menu.Item leadingIcon="pencil" title="Modifica" onPress={() => { setMenuDeckId(null); openEditDeck(deck.id); }} />
                    <Menu.Item leadingIcon={deck.status === 'published' ? 'file-document-edit' : 'earth'} title={deck.status === 'published' ? 'Rimetti in draft' : 'Pubblica'} onPress={() => { setMenuDeckId(null); setStatus.mutate({ id: deck.id, status: deck.status === 'published' ? 'draft' : 'published' }); }} />
                    <Divider />
                    <Menu.Item leadingIcon="delete" title="Elimina" titleStyle={{ color: colors.error }} onPress={() => { setMenuDeckId(null); deleteDeck.mutate(deck.id); }} />
                  </Menu>
                )}
                style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
              />
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
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  panel: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.three },
  form: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { borderRadius: Spacing.three, marginBottom: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
