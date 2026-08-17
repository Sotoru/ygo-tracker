// Form di un deck da torneo (nuovo o modifica), dialog autonomo: tiene il proprio
// stato e sa salvarsi. Il format non si scelge qui — lo detta il torneo.
// In modifica, un import assente conserva le carte già presenti.
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Dialog, HelperText, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { dialogWidth, Spacing } from '@/constants/theme';
import { pickTextFile } from '@/data/pick-file';
import type { TournamentDeckSummary } from '@/data/neon-tournaments';
import { PLACEMENT_LIST } from '@/domain/tournaments';
import { PLACEMENTS, type DeckEntryInput, type Placement, type Tournament } from '@/domain/types';
import { parseYdk } from '@/domain/ydk';
import {
  useCreateTournamentDeck,
  useReplaceTournamentDeckEntries,
  useUpdateTournamentDeck,
} from '@/hooks/tournament/use-tournaments';

type Form = {
  name: string;
  playerName: string;
  placement: Placement;
  sourceUrl: string;
  coverCardId: string;
  entries: DeckEntryInput[];
};

const formFor = (deck: TournamentDeckSummary | null): Form =>
  deck
    ? {
        name: deck.name,
        playerName: deck.playerName ?? '',
        placement: deck.placement,
        sourceUrl: deck.sourceUrl ?? '',
        coverCardId: deck.coverCardId?.toString() ?? '',
        entries: [],
      }
    : { name: '', playerName: '', placement: 'top8', sourceUrl: '', coverCardId: '', entries: [] };

/** L'id di copertina è testo nel form: numero valido o niente copertina. */
const coverIdOf = (text: string) => {
  const n = Number(text.trim());
  return text.trim() && Number.isFinite(n) ? n : null;
};

export function TournamentDeckDialog({
  tournament,
  deck,
  onDismiss,
}: {
  tournament: Tournament;
  deck: TournamentDeckSummary | null; // null = nuovo deck
  onDismiss: () => void;
}) {
  const { colors } = useTheme();
  const createDeck = useCreateTournamentDeck();
  const updateDeck = useUpdateTournamentDeck();
  const replaceEntries = useReplaceTournamentDeckEntries();

  const [form, setForm] = useState<Form>(() => formFor(deck));
  const [importError, setImportError] = useState(false);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const cardCount = form.entries.reduce((n, e) => n + e.count, 0);
  const saving = createDeck.isPending || updateDeck.isPending;

  const onImport = async () => {
    setImportError(false);
    try {
      const picked = await pickTextFile();
      if (!picked) return; // annullato
      const entries = parseYdk(picked.text);
      setForm((f) => ({ ...f, entries, name: f.name || picked.name.replace(/\.[^.]+$/, '') }));
    } catch {
      setImportError(true);
    }
  };

  const onSave = async () => {
    const common = {
      name: form.name.trim(),
      format: tournament.format,
      placement: form.placement,
      playerName: form.playerName.trim() || null,
      coverCardId: coverIdOf(form.coverCardId),
      sourceUrl: form.sourceUrl.trim() || null,
    };
    if (deck) {
      await updateDeck.mutateAsync({ id: deck.id, ...common });
      if (form.entries.length) await replaceEntries.mutateAsync({ id: deck.id, entries: form.entries });
    } else {
      await createDeck.mutateAsync({ tournamentId: tournament.id, entries: form.entries, ...common });
    }
    onDismiss();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onDismiss} style={dialogWidth}>
        <Dialog.Title>{deck ? 'Modifica deck da torneo' : 'Nuovo deck da torneo'}</Dialog.Title>
        <Dialog.Content>
          <ScrollView contentContainerStyle={styles.form}>
            <TextInput label="Nome deck" value={form.name} onChangeText={(v) => set('name', v)} mode="outlined" />
            <TextInput label="Player" value={form.playerName} onChangeText={(v) => set('playerName', v)} mode="outlined" />
            <TextInput
              label="Fonte URL"
              value={form.sourceUrl}
              onChangeText={(v) => set('sourceUrl', v)}
              mode="outlined"
              autoCapitalize="none"
            />
            <TextInput
              label="Cover card id"
              value={form.coverCardId}
              onChangeText={(v) => set('coverCardId', v.replace(/[^0-9]/g, ''))}
              mode="outlined"
              keyboardType="number-pad"
            />
            <Text variant="labelLarge">Placement</Text>
            <View style={styles.chips}>
              {PLACEMENT_LIST.map((p) => (
                <Chip key={p} selected={form.placement === p} showSelectedOverlay onPress={() => set('placement', p)}>
                  {PLACEMENTS[p].label}
                </Chip>
              ))}
            </View>
            <Button mode="outlined" icon="file-upload" onPress={onImport}>
              {deck ? 'Reimporta .ydk' : 'Importa .ydk'}
            </Button>
            {importError ? (
              <HelperText type="error" visible>
                Impossibile leggere il file.
              </HelperText>
            ) : null}
            {cardCount > 0 ? (
              <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
                {cardCount} carte importate.
              </Text>
            ) : null}
            {deck && cardCount === 0 ? (
              <HelperText type="info" visible>
                Lascia senza import per conservare le carte attuali.
              </HelperText>
            ) : null}
          </ScrollView>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Annulla</Button>
          <Button
            disabled={!form.name.trim() || (!deck && cardCount === 0) || saving}
            loading={saving}
            onPress={onSave}>
            Salva
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  form: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
