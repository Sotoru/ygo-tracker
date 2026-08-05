// Nuovo Deck: nome (obbligatorio) + Format (obbligatorio) + import .ydk (opzionale).
// L'import riempie solo le carte; puoi salvare un deck vuoto. Rotta sopra le tab
// (Stack root) → header/back propri, come /banlist/[format].
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, Spacing } from '@/constants/theme';
import { pickTextFile, pickTextFiles } from '@/data/pick-file';
import { FORMATS, type DeckEntryInput, type Format } from '@/domain/types';
import { parseYdk } from '@/domain/ydk';
import { useCreateDeck } from '@/hooks/use-decks';

export default function NewDeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const create = useCreateDeck();

  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>('goat');
  const [entries, setEntries] = useState<DeckEntryInput[]>([]);
  const [importError, setImportError] = useState(false);
  const [isImportingMultiple, setIsImportingMultiple] = useState(false);

  const cardCount = entries.reduce((n, e) => n + e.count, 0);

  async function onImport() {
    setImportError(false);
    try {
      const picked = await pickTextFile();
      if (!picked) return; // annullato
      setEntries(parseYdk(picked.text));
      // default del nome dal filename (senza estensione), solo se non l'hai già scritto
      if (!name.trim()) setName(picked.name.replace(/\.[^.]+$/, ''));
    } catch {
      setImportError(true);
    }
  }

  // Import multiplo: un deck per file (il nome del deck viene dal filename),
  // niente staging in `entries` — a differenza del singolo, qui si crea subito.
  async function onImportMultiple() {
    setImportError(false);
    setIsImportingMultiple(true);
    try {
      const picked = await pickTextFiles();
      for (const file of picked) {
        await create.mutateAsync({
          name: file.name.replace(/\.[^.]+$/, ''),
          format,
          entries: parseYdk(file.text),
        });
      }
      if (picked.length) router.replace('/deck');
    } catch {
      setImportError(true);
    } finally {
      setIsImportingMultiple(false);
    }
  }

  async function onCreate() {
    const deck = await create.mutateAsync({
      name: name.trim(),
      format,
      entries: entries.length ? entries : undefined,
    });
    router.replace(`/deck/${deck.id}`);
  }

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/deck'))} />
        <Appbar.Content title="Nuovo deck" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" />

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Formato
        </Text>
        <View style={styles.chips}>
          {(Object.keys(FORMATS) as Format[]).map((f) => (
            <Chip key={f} selected={f === format} showSelectedOverlay onPress={() => setFormat(f)}>
              {FORMATS[f].label}
            </Chip>
          ))}
        </View>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Import
        </Text>
        <View style={styles.chips}>
          <Button mode="outlined" icon="file-upload" onPress={onImport} disabled={isImportingMultiple}>
            Importa .ydk
          </Button>
          <Button
            mode="outlined"
            icon="file-multiple"
            onPress={onImportMultiple}
            loading={isImportingMultiple}
            disabled={isImportingMultiple}>
            Importa più .ydk
          </Button>
        </View>
        {importError ? (
          <HelperText type="error" visible>
            Impossibile leggere il file.
          </HelperText>
        ) : cardCount > 0 ? (
          <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
            {cardCount} carte importate.
          </Text>
        ) : null}

        {create.isError ? (
          <HelperText type="error" visible>
            {(create.error as { message?: string })?.message ?? 'Errore nel salvataggio.'}
          </HelperText>
        ) : null}

        <Button
          mode="contained"
          onPress={onCreate}
          disabled={!name.trim() || create.isPending}
          loading={create.isPending}
          style={styles.create}>
          Crea
        </Button>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { ...cappedWidth, backgroundColor: 'transparent' },
  content: {
    ...contentContainer,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sectionLabel: { marginBottom: -Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  create: { marginTop: Spacing.two },
});
