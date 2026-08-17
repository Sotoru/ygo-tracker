// Nuovo Deck: nome (obbligatorio) + Format (obbligatorio) + import (opzionale).
// I due import non sono simmetrici, ed è voluto: un file .ydk porta con sé il nome
// (filename) quindi crea subito un deck per file, un codice YDKe no, quindi riempie
// le carte di questo form e il nome lo dà l'utente. Rotta sopra le tab (Stack root)
// → header/back propri, come /banlist/[format].
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, HelperText, Text, TextInput, useTheme } from 'react-native-paper';

import { FormatChips } from '@/components/shared/format-chips';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ThemedView } from '@/components/shared/themed-view';
import { contentContainer, Spacing } from '@/constants/theme';
import { pickTextFiles } from '@/data/pick-file';
import { type DeckEntryInput, type Format } from '@/domain/types';
import { parseYdk } from '@/domain/ydk';
import { parseYdke } from '@/domain/ydke';
import { useCreateDeck } from '@/hooks/deck/use-decks';

export default function NewDeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const create = useCreateDeck();

  const [name, setName] = useState('');
  const [format, setFormat] = useState<Format>('goat');
  const [entries, setEntries] = useState<DeckEntryInput[]>([]); // solo da YDKe: i file creano da sé
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isPasting, setIsPasting] = useState(false);
  // Firefox non espone la clipboard alle pagine e Safari può negarla: allora si incolla a mano.
  const [pasted, setPasted] = useState<string | null>(null);

  const cardCount = entries.reduce((n, e) => n + e.count, 0);

  // Un deck per file, nome dal filename: non tocca il form, crea e torna alla lista.
  async function onImportFiles() {
    setImportError(null);
    setIsImporting(true);
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
      setImportError('Impossibile leggere il file.');
    } finally {
      setIsImporting(false);
    }
  }

  function readYdke(code: string) {
    try {
      setEntries(parseYdke(code));
      setImportError(null);
    } catch {
      setEntries([]);
      setImportError('Codice YDKe non valido.');
    }
  }

  async function onPasteYdke() {
    // Il loading non è per la lettura (è istantanea) ma per il prompt di permesso del
    // browser: senza, la getStringAsync appesa fa sembrare il pulsante morto.
    setIsPasting(true);
    const code = await Clipboard.getStringAsync().catch(() => '');
    setIsPasting(false);
    if (!code.trim()) {
      setPasted(''); // apre il campo manuale: appunti vuoti o lettura negata
      setImportError('Appunti non leggibili: incolla il codice qui sotto.');
      return;
    }
    readYdke(code);
  }

  // L'import da file è terminale (crea e naviga via): l'unico da poter annullare è
  // l'YDKe, che resta in sospeso in `entries`.
  function resetYdke() {
    setEntries([]);
    setImportError(null);
    setPasted(null);
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
      <ScreenHeader title="Nuovo deck" fallback="/deck" />

      <ScrollView contentContainerStyle={styles.content}>
        <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" />

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Formato
        </Text>
        <FormatChips value={format} onChange={(f) => f && setFormat(f)} />

        <Text variant="labelLarge" style={styles.sectionLabel}>
          Importa
        </Text>
        <View style={styles.buttons}>
          <Button
            mode="outlined"
            icon="file-upload"
            onPress={onImportFiles}
            loading={isImporting}
            // con carte in sospeso il file creerebbe altri deck buttandole via: la X del chip è l'uscita
            disabled={isImporting || isPasting || cardCount > 0}>
            Scegli file .ydk
          </Button>
          <Button
            mode="outlined"
            icon="clipboard-text"
            onPress={onPasteYdke}
            loading={isPasting}
            disabled={isImporting || isPasting}>
            Incolla codice YDKe
          </Button>
        </View>
        <View>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            File .ydk: un deck per file, con il nome del file (puoi sceglierne più di uno).
          </Text>
          <Text variant="bodySmall" style={{ color: colors.onSurfaceVariant }}>
            Codice YDKe: riempie le carte di questo deck, il nome lo scegli tu.
          </Text>
        </View>
        {pasted !== null ? (
          <TextInput
            label="Codice YDKe"
            value={pasted}
            onChangeText={(text) => {
              setPasted(text);
              if (text.trim()) readYdke(text);
            }}
            mode="outlined"
            multiline
            autoCapitalize="none"
            autoCorrect={false}
          />
        ) : null}
        {importError ? (
          <HelperText type="error" visible>
            {importError}
          </HelperText>
        ) : cardCount > 0 ? (
          // Chip invece di Text: la X è la sua closeIcon, niente IconButton da allineare.
          <Chip
            icon="cards-outline"
            onClose={resetYdke}
            closeIconAccessibilityLabel="Annulla l'import"
            style={styles.staged}>
            {cardCount} carte importate
          </Chip>
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
  content: {
    ...contentContainer,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  sectionLabel: { marginBottom: -Spacing.two },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  staged: { alignSelf: 'flex-start' }, // il chip si stringe sul testo, non sulla riga
  create: { marginTop: Spacing.two },
});
