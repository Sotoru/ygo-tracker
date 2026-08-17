// Kebab del dettaglio Deck. Un solo Menu con due contenuti (azioni / scelta banlist):
// `page` decide quale. Le azioni che bastano a se stesse (banlist, reset copertina,
// visibilità) mutano da qui; quelle che aprono un dialog tornano al chiamante.
import { useState } from 'react';
import { Appbar, Divider, Menu, useTheme } from 'react-native-paper';

import { FORMAT_LIST, FORMATS, type Deck, type Format } from '@/domain/types';
import { useSetDeckCover, useSetDeckFormat, useSetDeckPublic } from '@/hooks/deck/use-decks';

// Pagina "scegli banlist": la voce corrente ha la spunta.
function FormatPage({ deck, onPick }: { deck: Deck; onPick: (format: Format) => void }) {
  return FORMAT_LIST.map((f) => (
    <Menu.Item
      key={f}
      title={FORMATS[f].label}
      leadingIcon={f === deck.format ? 'check' : undefined}
      onPress={() => onPick(f)}
    />
  ));
}

// Azioni riservate al proprietario. L'anonimo vede solo l'export (fuori da qui).
function OwnerActions({
  deck,
  onRename,
  onReimport,
  onBanlist,
}: {
  deck: Deck;
  onRename: () => void;
  onReimport: () => void;
  onBanlist: () => void;
}) {
  const setCover = useSetDeckCover();
  const setPublic = useSetDeckPublic();
  return (
    <>
      <Menu.Item leadingIcon="rename-box" title="Rinomina" onPress={onRename} />
      <Menu.Item
        leadingIcon="star-off"
        title="Reset carta in evidenza"
        disabled={deck.coverCardId == null}
        onPress={() => setCover.mutate({ deckId: deck.id, cardId: null })}
      />
      <Menu.Item leadingIcon="playlist-edit" title="Cambia banlist" onPress={onBanlist} />
      <Menu.Item
        leadingIcon={deck.isPublic ? 'lock' : 'earth'}
        title={deck.isPublic ? 'Rendi privato' : 'Rendi pubblico'}
        onPress={() => setPublic.mutate({ deckId: deck.id, isPublic: !deck.isPublic })}
      />
      <Menu.Item leadingIcon="file-upload" title="Reimporta .ydk" onPress={onReimport} />
    </>
  );
}

export function DeckMenu({
  deck,
  canEdit,
  onRename,
  onReimport,
  onExport,
  onDelete,
}: {
  deck: Deck;
  canEdit: boolean; // proprietario loggato: l'anonimo vede solo l'export
  onRename: () => void;
  onReimport: () => void;
  onExport: () => void;
  onDelete: () => void;
}) {
  const { colors } = useTheme();
  const setFormat = useSetDeckFormat();
  const [page, setPage] = useState<null | 'main' | 'format'>(null);

  const close = () => setPage(null);
  const act = (fn: () => void) => () => {
    close();
    fn();
  };

  const body =
    page === 'format' ? (
      <FormatPage
        deck={deck}
        onPick={(format) => {
          close();
          if (format !== deck.format) setFormat.mutate({ deckId: deck.id, format });
        }}
      />
    ) : (
      <>
        {canEdit ? (
          <OwnerActions
            deck={deck}
            onRename={act(onRename)}
            onReimport={act(onReimport)}
            onBanlist={() => setPage('format')}
          />
        ) : null}
        <Menu.Item leadingIcon="file-download" title="Esporta .ydk" onPress={act(onExport)} />
        {canEdit ? (
          <>
            <Divider />
            <Menu.Item
              leadingIcon="delete"
              title="Elimina deck"
              titleStyle={{ color: colors.error }}
              onPress={act(onDelete)}
            />
          </>
        ) : null}
      </>
    );

  return (
    <Menu
      visible={page != null}
      onDismiss={close}
      anchorPosition="bottom" // scende SOTTO il kebab; essendo in alto a destra si apre verso sinistra
      anchor={
        <Appbar.Action icon="dots-vertical" accessibilityLabel="Altre azioni" onPress={() => setPage('main')} />
      }>
      {body}
    </Menu>
  );
}
