// Dettaglio Deck: le carte divise per zona (Main / Extra / Side), risolte per id
// via YGOPRODeck (stesso pattern di wishlist/banlist). Gli id non risolvibili non
// si disegnano. In edit mode (matita) la griglia passa a <DeckEditor>, che lavora
// sulla bozza locale e scrive in blocco al Salva.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Appbar, Button, Dialog, Portal, Snackbar, TextInput } from 'react-native-paper';

import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { CoverStar } from '@/components/deck/cover-star';
import { DeckEditor } from '@/components/deck/deck-editor';
import { DeckGrid } from '@/components/deck/deck-grid';
import { DeckMenu } from '@/components/deck/deck-menu';
import { appbarStyle, ScreenHeader } from '@/components/shared/screen-header';
import { ScreenMessage, ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { contentContainer, DenseGridColumns, dialogWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/data/auth';
import { pickTextFile } from '@/data/pick-file';
import { shareTextFile } from '@/data/share-file';
import { FORMATS, type Deck } from '@/domain/types';
import { buildYdk, parseYdk } from '@/domain/ydk';
import { useCardDetail } from '@/hooks/card/use-card-detail';
import { useDeckCards } from '@/hooks/deck/use-deck-cards';
import { useDeckDraft } from '@/hooks/deck/use-deck-draft';
import { useGrid } from '@/hooks/shared/use-layout';
import { useDeck, useDeleteDeck, useReplaceDeckEntries, useSetDeckName } from '@/hooks/deck/use-decks';

// Nome file da esportare: slug del nome deck, fallback se resta vuoto dopo lo strip.
const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck';

// Header in vista: titolo + banlist, il globo se pubblico, matita e kebab al
// proprietario. Finché il deck non è arrivato ci sono solo titolo e back.
function ViewHeader({
  deck,
  canEdit,
  onEdit,
  menu,
}: {
  deck: Deck | undefined;
  canEdit: boolean;
  onEdit: () => void;
  menu: (deck: Deck) => ReactNode;
}) {
  return (
    <ScreenHeader
      title={deck?.name ?? 'Deck'}
      subtitle={deck ? FORMATS[deck.format]?.label : undefined}
      fallback={canEdit ? '/deck' : '/public-decks'}>
      {deck?.isPublic ? <Appbar.Action icon="earth" accessibilityLabel="Deck pubblico" onPress={() => {}} /> : null}
      {deck && canEdit ? (
        <Appbar.Action icon="pencil" accessibilityLabel="Modifica carte" onPress={onEdit} />
      ) : null}
      {deck ? menu(deck) : null}
    </ScreenHeader>
  );
}

// Header in modifica: nessun back, si esce con la X o si salva.
function EditHeader({
  canSave,
  saving,
  onCancel,
  onSave,
}: {
  canSave: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Appbar.Header style={styles.appbar}>
      <Appbar.Action icon="close" accessibilityLabel="Annulla modifiche" onPress={onCancel} />
      <Appbar.Content title="Modifica" />
      <Button mode="contained" compact disabled={!canSave} loading={saving} onPress={onSave} style={styles.saveBtn}>
        Salva
      </Button>
    </Appbar.Header>
  );
}

export default function DeckDetailScreen() {
  const router = useRouter();
  const openDetail = useCardDetail((s) => s.open);
  const { id } = useLocalSearchParams<{ id: string }>();

  // Sempre montato (con o senza sessione): loggato = proprietario (RLS → solo righe
  // proprie), quindi controlli di modifica. Anonimo = vista read-only del deck pubblico.
  const { data: session } = useSession();
  const { data, isLoading, isError } = useDeck(id);
  const del = useDeleteDeck();
  const setName = useSetDeckName();
  const replace = useReplaceDeckEntries(); // sorgente unica: Salva editor + re-import

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const { byId, cardsLoading, sections } = useDeckCards(entries);
  const draft = useDeckDraft(entries);
  const { cellWidth } = useGrid(DenseGridColumns);

  const coverCardId = data?.deck.coverCardId ?? null; // scelta ESPLICITA (la stella piena)

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [reimportOpen, setReimportOpen] = useState(false);
  const [exportUnavailable, setExportUnavailable] = useState(false);

  const canSave = draft.staging.length === 0 && !replace.isPending; // niente Salva finché lo staging non è vuoto
  const save = async () => {
    await replace.mutateAsync({ deckId: id, entries: draft.draft });
    draft.cancel();
  };

  const onRename = () => {
    const name = renameText.trim();
    setRenameOpen(false);
    if (name && name !== data?.deck.name) setName.mutate({ deckId: id, name });
  };

  const onReimport = async () => {
    setReimportOpen(false);
    const picked = await pickTextFile();
    if (!picked) return; // annullato
    replace.mutate({ deckId: id, entries: parseYdk(picked.text) });
  };

  const onExport = async () => {
    if (!data) return;
    const ok = await shareTextFile(`${slugify(data.deck.name)}.ydk`, buildYdk(entries));
    if (!ok) setExportUnavailable(true);
  };

  return (
    <ThemedView style={styles.screen}>
      {draft.editing ? (
        <EditHeader canSave={canSave} saving={replace.isPending} onCancel={draft.cancel} onSave={save} />
      ) : (
        <ViewHeader
          deck={data?.deck}
          canEdit={!!session}
          onEdit={draft.enter}
          menu={(deck) => (
            <DeckMenu
              deck={deck}
              canEdit={!!session}
              onRename={() => {
                setRenameText(deck.name);
                setRenameOpen(true);
              }}
              onReimport={() => setReimportOpen(true)}
              onExport={onExport}
              onDelete={() => setConfirmOpen(true)}
            />
          )}
        />
      )}

      <ConfirmDialog
        visible={confirmOpen}
        title="Eliminare il deck?"
        confirmLabel="Elimina"
        loading={del.isPending}
        onDismiss={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await del.mutateAsync(id);
          router.replace('/deck');
        }}>
        {`«${data?.deck.name}» verrà eliminato. Non è reversibile.`}
      </ConfirmDialog>

      <ConfirmDialog
        visible={reimportOpen}
        title="Reimporta .ydk?"
        confirmLabel="Scegli file"
        onDismiss={() => setReimportOpen(false)}
        onConfirm={onReimport}>
        Tutte le carte del deck verranno sostituite con quelle del file scelto.
      </ConfirmDialog>

      <Portal>
        <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)} style={dialogWidth}>
          <Dialog.Title>Rinomina deck</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Nome" value={renameText} onChangeText={setRenameText} mode="outlined" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameOpen(false)}>Annulla</Button>
            <Button disabled={!renameText.trim()} onPress={onRename}>
              Salva
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar visible={exportUnavailable} onDismiss={() => setExportUnavailable(false)} style={dialogWidth}>
          Condivisione non disponibile su questo dispositivo.
        </Snackbar>
      </Portal>

      <ScreenState loading={isLoading || cardsLoading} error={isError} notFound="Deck non trovato." data={data}>
        {() => {
          if (draft.editing)
            return (
              <DeckEditor
                draft={draft}
                cellWidth={cellWidth}
                resolveCard={(cardId) => byId.get(cardId) ?? draft.extraCards.get(cardId)}
              />
            );
          if (sections.length === 0) return <ScreenMessage>Deck vuoto.</ScreenMessage>;
          return (
            <ScrollView contentContainerStyle={styles.content}>
              <DeckGrid
                sections={sections}
                byId={byId}
                cellWidth={cellWidth}
                onPressCard={openDetail}
                topRight={(cardId) => (
                  <CoverStar deckId={id} cardId={cardId} coverCardId={coverCardId} canPick={!!session} />
                )}
              />
            </ScrollView>
          );
        }}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: appbarStyle, // l'header dell'edit mode non è uno ScreenHeader: nessun back
  saveBtn: { marginRight: Spacing.two },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
});
