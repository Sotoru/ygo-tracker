// Le due righe della Wishlist: un risultato di ricerca (SearchRow) e una carta salvata
// (SavedCardRow). Entrambe scelgono il presenter — cella o riga — dal toggle globale
// cardView: è la stessa carta impaginata in due modi, non due componenti diversi.
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Divider, IconButton, Menu, useTheme } from 'react-native-paper';

import { CardCell } from '@/components/card/card-cell';
import { CardRow } from '@/components/card/card-row';
import type { YgoCard } from '@/data/ygoprodeck';
import { shortRarity } from '@/domain/rarity';
import type { WishlistItem } from '@/domain/types';
import { useCardDetail } from '@/hooks/card/use-card-detail';
import { useBreakpoint } from '@/hooks/shared/use-layout';
import { useSettings } from '@/hooks/shared/use-settings';

/** Righe "N× rarità" nell'ordine delle stampe della carta (le rarità ignote in fondo). */
function summarize(items: WishlistItem[], card: YgoCard | undefined, short: boolean): string[] {
  const order = [...new Set((card?.card_sets ?? []).map((p) => p.set_rarity))];
  const rank = (r: string) => {
    const i = order.indexOf(r);
    return i === -1 ? 999 : i;
  };
  return [...items]
    .sort((a, b) => rank(a.rarity) - rank(b.rarity))
    .map((i) => `${i.count}x ${short ? shortRarity(i.rarity) : i.rarity}`);
}

export type WishlistRowData =
  | { kind: 'search'; key: string; card: YgoCard }
  | {
      kind: 'card';
      key: string;
      cardId: number;
      card?: YgoCard;
      items: WishlistItem[];
      obtained: boolean;
    };

/** Quale forma disegnare si decide qui, accanto alle righe, non nella schermata. */
export function WishlistRow({
  row,
  owned,
  onPick,
  onCheck,
  onRestore,
  onDelete,
}: {
  row: WishlistRowData | { kind: 'header' }; // WishlistList disegna gli header da sé
  owned: boolean;
  onPick: (card: YgoCard) => void;
  onCheck: (cardId: number) => void;
  onRestore: (cardId: number, name: string) => void;
  onDelete: (cardId: number, name: string) => void;
}) {
  if (row.kind === 'header') return null;
  if (row.kind === 'search') return <SearchRow card={row.card} owned={owned} onPick={onPick} />;
  return (
    <SavedCardRow
      cardId={row.cardId}
      card={row.card}
      items={row.items}
      obtained={row.obtained}
      onCheck={onCheck}
      onEdit={onPick}
      onRestore={onRestore}
      onDelete={onDelete}
    />
  );
}

function SearchRow({
  card,
  owned,
  onPick,
}: {
  card: YgoCard;
  owned: boolean;
  onPick: (card: YgoCard) => void;
}) {
  const Presenter = useSettings((s) => s.cardView) === 'grid' ? CardCell : CardRow;
  const tint = useSettings((s) => s.frameTint);
  const openDetail = useCardDetail((s) => s.open);
  const hasPrints = (card.card_sets?.length ?? 0) > 0;
  return (
    <Presenter
      name={card.name}
      owned={owned}
      imageUrl={card.card_images[0]?.image_url_cropped}
      frameType={tint ? card.frameType : undefined}
      // niente rarità qui: mostrarne una sola (la prima stampa) su N possibili
      // ingannava, e la scelta si fa comunque nel PrintPicker. Senza didascalia c'è
      // spazio per una terza riga di nome — i nomi lunghi sono la norma in ricerca.
      // "Nessuna stampa" lo passiamo solo da qui: è l'unico posto che ne ha bisogno.
      subtitle={hasPrints ? undefined : ['Nessuna stampa']}
      nameLines={3}
      onPress={() => openDetail(card)}>
      <IconButton icon="plus" accessibilityLabel="Scegli rarità" disabled={!hasPrints} onPress={() => onPick(card)} />
    </Presenter>
  );
}

type Actions = {
  onCheck: () => void;
  onEdit: (() => void) | undefined; // assente se la carta non è ancora risolta
  onRestore: () => void;
  onDelete: () => void;
};

// In lista su phone lo spazio per due IconButton non c'è: stesse azioni in un kebab.
function ActionsMenu({ obtained, onCheck, onEdit, onRestore, onDelete }: Actions & { obtained: boolean }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const act = (fn: (() => void) | undefined) => () => {
    setOpen(false);
    fn?.();
  };

  return (
    <Menu
      visible={open}
      onDismiss={() => setOpen(false)}
      anchorPosition="bottom"
      anchor={<IconButton icon="dots-vertical" accessibilityLabel="Altre azioni" onPress={() => setOpen(true)} />}>
      {obtained ? (
        <>
          <Menu.Item leadingIcon="restore" title="Rimetti tra le carte da prendere" onPress={act(onRestore)} />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            title="Elimina dalla wishlist"
            titleStyle={{ color: colors.error }}
            onPress={act(onDelete)}
          />
        </>
      ) : (
        <>
          <Menu.Item leadingIcon="pencil" title="Modifica rarità e copie" disabled={!onEdit} onPress={act(onEdit)} />
          <Menu.Item leadingIcon="check" title="Segna come presa" onPress={act(onCheck)} />
        </>
      )}
    </Menu>
  );
}

function ActionButtons({ obtained, onCheck, onEdit, onRestore, onDelete }: Actions & { obtained: boolean }) {
  return obtained ? (
    <View style={styles.actions}>
      <IconButton icon="delete" accessibilityLabel="Elimina dalla wishlist" onPress={onDelete} />
      <IconButton icon="restore" accessibilityLabel="Rimetti tra le carte da prendere" onPress={onRestore} />
    </View>
  ) : (
    <View style={styles.actions}>
      <IconButton icon="pencil" accessibilityLabel="Modifica rarità e copie" disabled={!onEdit} onPress={onEdit} />
      <IconButton icon="check" accessibilityLabel="Segna come presa" onPress={onCheck} />
    </View>
  );
}

function SavedCardRow({
  cardId,
  card,
  items,
  obtained,
  onCheck,
  onEdit,
  onRestore,
  onDelete,
}: {
  cardId: number;
  card?: YgoCard;
  items: WishlistItem[];
  obtained: boolean;
  onCheck: (cardId: number) => void;
  onEdit: (card: YgoCard) => void;
  onRestore: (cardId: number, name: string) => void;
  onDelete: (cardId: number, name: string) => void;
}) {
  const view = useSettings((s) => s.cardView);
  const rarityShort = useSettings((s) => s.rarityShort);
  const tint = useSettings((s) => s.frameTint);
  const Presenter = view === 'grid' ? CardCell : CardRow;
  const openDetail = useCardDetail((s) => s.open);
  const phone = useBreakpoint() === 'phone'; // fuori dalla && : l'hook va chiamato sempre
  const name = card?.name ?? '…';

  const actions: Actions = {
    onCheck: () => onCheck(cardId),
    onEdit: card ? () => onEdit(card) : undefined,
    onRestore: () => onRestore(cardId, name),
    onDelete: () => onDelete(cardId, name),
  };

  return (
    <Presenter
      name={name}
      owned={obtained}
      imageUrl={card?.card_images[0]?.image_url_cropped}
      frameType={tint ? card?.frameType : undefined}
      subtitle={summarize(items, card, rarityShort)}
      onPress={card ? () => openDetail(card) : undefined}>
      {view === 'list' && phone ? (
        <ActionsMenu obtained={obtained} {...actions} />
      ) : (
        <ActionButtons obtained={obtained} {...actions} />
      )}
    </Presenter>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
});
