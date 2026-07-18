// Tab Wishlist: una sola schermata. Casella di ricerca in alto; sotto, i risultati
// di ricerca (≥2 lettere) oppure la wishlist salvata — raggruppata per carta e
// divisa in "Da prendere" (Wanted) e "Prese" (Obtained). Da un risultato o dalla
// matita di una carta si apre il PrintPicker per scegliere rarità + copie.
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, List, Portal, Searchbar, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardRow } from '@/components/card-row';
import { PrintPicker } from '@/components/print-picker';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import type { YgoCard } from '@/data/ygoprodeck';
import type { WishlistItem } from '@/domain/types';
import { useCardSearch, useCardsByIds } from '@/hooks/use-cards';
import { useSetObtained, useSetWishlistEntries, useWishlist } from '@/hooks/use-wishlist';

// ["Ultra Rare ×2", "Secret Rare ×1"] — una riga per rarità, ordinate come nel
// picker (prima apparizione in card_sets). La CardRow le impila una sotto l'altra.
function summarize(items: WishlistItem[], card?: YgoCard): string[] {
  const order = [...new Set((card?.card_sets ?? []).map((p) => p.set_rarity))];
  const rank = (r: string) => {
    const i = order.indexOf(r);
    return i === -1 ? 999 : i;
  };
  return [...items]
    .sort((a, b) => rank(a.rarity) - rank(b.rarity))
    .map((i) => `${i.rarity} ×${i.count}`);
}

// il valore massimo di un campo tra le righe di una carta (per l'ordinamento "più recenti in alto")
const maxOf = (items: WishlistItem[], f: (i: WishlistItem) => string | undefined) =>
  items.reduce((m, i) => {
    const v = f(i) ?? '';
    return v > m ? v : m;
  }, '');

function SearchRow({
  card,
  owned,
  onPick,
}: {
  card: YgoCard;
  owned: boolean;
  onPick: (card: YgoCard) => void;
}) {
  const hasPrints = (card.card_sets?.length ?? 0) > 0;
  return (
    <CardRow
      name={card.name}
      owned={owned}
      imageUrl={card.card_images[0]?.image_url_small}
      rarity={card.card_sets?.[0]?.set_rarity}>
      <IconButton
        icon="plus"
        accessibilityLabel="Scegli rarità"
        disabled={!hasPrints}
        onPress={() => onPick(card)}
      />
    </CardRow>
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
}: {
  cardId: number;
  card?: YgoCard;
  items: WishlistItem[];
  obtained: boolean;
  onCheck: (cardId: number) => void;
  onEdit: (card: YgoCard) => void;
  onRestore: (cardId: number, name: string) => void;
}) {
  const name = card?.name ?? '…';
  return (
    <CardRow
      name={name}
      owned={obtained}
      imageUrl={card?.card_images[0]?.image_url_small}
      subtitle={summarize(items, card)}>
      {obtained ? (
        <IconButton
          icon="restore"
          accessibilityLabel="Rimetti tra le carte da prendere"
          onPress={() => onRestore(cardId, name)}
        />
      ) : (
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            accessibilityLabel="Modifica rarità e copie"
            disabled={!card}
            onPress={() => card && onEdit(card)}
          />
          <IconButton icon="check" accessibilityLabel="Segna come presa" onPress={() => onCheck(cardId)} />
        </View>
      )}
    </CardRow>
  );
}

type CardGroup = { cardId: number; card?: YgoCard; items: WishlistItem[]; obtained: boolean };
type Row =
  | { kind: 'search'; key: string; card: YgoCard }
  | { kind: 'header'; key: string; title: string }
  | ({ kind: 'card'; key: string } & CardGroup);

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350); // debounce: rispetta il rate limit
    return () => clearTimeout(t);
  }, [query]);

  const searching = query.trim().length > 0;

  const { data: results = [], isFetching, isError } = useCardSearch(debounced);
  const loading = searching && isFetching;

  const clearSearch = () => {
    setQuery('');
    setDebounced('');
  };
  const { data: wishlist = [] } = useWishlist();

  // fetch batch (una richiesta) delle Card salvate, per mostrare nome + immagine
  const ids = useMemo(() => [...new Set(wishlist.map((w) => w.cardId))], [wishlist]);
  const { data: savedCards = [] } = useCardsByIds(ids);
  const cardById = useMemo(() => new Map(savedCards.map((c) => [c.id, c])), [savedCards]);

  const setEntry = useSetWishlistEntries();
  const setObtained = useSetObtained();
  const [pickerCard, setPickerCard] = useState<YgoCard | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{ cardId: number; name: string } | null>(null);

  const applyEntry = (entry: { cardId: number; entries: { rarity: string; count: number }[] }) => {
    // se ho modificato qualcosa svuoto la ricerca: torno alla wishlist e vedo il risultato
    setEntry.mutate(entry, { onSuccess: clearSearch });
  };

  // wishlist raggruppata per carta; obtained è per-carta (invariante: some === all)
  const groups = useMemo<CardGroup[]>(() => {
    const byCard = new Map<number, WishlistItem[]>();
    for (const it of wishlist) {
      const arr = byCard.get(it.cardId);
      if (arr) arr.push(it);
      else byCard.set(it.cardId, [it]);
    }
    return [...byCard.entries()].map(([cardId, items]) => ({
      cardId,
      items,
      card: cardById.get(cardId),
      obtained: items.some((i) => !!i.obtainedAt),
    }));
  }, [wishlist, cardById]);

  // segno "Presa" nei risultati di ricerca
  const obtainedIds = useMemo(
    () => new Set(wishlist.filter((i) => i.obtainedAt).map((i) => i.cardId)),
    [wishlist],
  );

  const rows = useMemo<Row[]>(() => {
    if (searching) return results.map((card) => ({ kind: 'search', key: `s${card.id}`, card }));
    const toRow = (c: CardGroup): Row => ({ kind: 'card', key: `c${c.cardId}`, ...c });
    const wanted = groups
      .filter((c) => !c.obtained)
      .sort((a, b) => maxOf(b.items, (i) => i.addedAt).localeCompare(maxOf(a.items, (i) => i.addedAt)));
    const prese = groups
      .filter((c) => c.obtained)
      .sort((a, b) =>
        maxOf(b.items, (i) => i.obtainedAt).localeCompare(maxOf(a.items, (i) => i.obtainedAt)),
      );
    return [
      ...(wanted.length ? [{ kind: 'header', key: 'h-wanted', title: 'Da prendere' } as Row, ...wanted.map(toRow)] : []),
      ...(prese.length ? [{ kind: 'header', key: 'h-prese', title: `Prese (${prese.length})` } as Row, ...prese.map(toRow)] : []),
    ];
  }, [searching, results, groups]);

  return (
    <ThemedView
      style={[
        styles.screen,
        // web: la tab bar è una pill flottante in alto → lascia spazio per non coprirla
        { paddingTop: Platform.select({ web: Spacing.six, default: insets.top + Spacing.three }) },
      ]}>
      <View style={styles.center}>
        <Searchbar
          value={query}
          onChangeText={setQuery}
          placeholder="Cerca una carta…"
          loading={loading}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          // `right` disattiva la clear icon di default (il cui Surface disegna un
          // cerchio bianco a campo vuoto, ora visibile sul bar blu). Mostro la X
          // solo con testo e non durante lo spinner.
          right={({ color, style }) =>
            searching && !loading ? (
              <IconButton
                style={style}
                icon="close"
                iconColor={color}
                size={24}
                accessibilityLabel="Cancella ricerca"
                onPress={clearSearch}
              />
            ) : null
          }
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(r) => r.key}
        renderItem={({ item: r }) =>
          r.kind === 'header' ? (
            <List.Subheader>{r.title}</List.Subheader>
          ) : r.kind === 'search' ? (
            <SearchRow card={r.card} owned={obtainedIds.has(r.card.id)} onPick={setPickerCard} />
          ) : (
            <SavedCardRow
              cardId={r.cardId}
              card={r.card}
              items={r.items}
              obtained={r.obtained}
              onCheck={(cardId) => setObtained.mutate({ cardId, obtained: true })}
              onEdit={setPickerCard}
              onRestore={(cardId, name) => setConfirmRestore({ cardId, name })}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text variant="bodyMedium" style={[styles.empty, { color: colors.onSurfaceVariant }]}>
            {!searching
              ? 'Wishlist vuota — cerca una carta qui sopra per aggiungerla.'
              : isError
                ? 'Errore di rete. Riprova.'
                : debounced.trim().length < 2
                  ? 'Scrivi almeno 2 lettere per cercare.'
                  : isFetching
                    ? 'Cerco…'
                    : 'Nessun risultato.'}
          </Text>
        }
      />

      {pickerCard ? (
        <PrintPicker
          card={pickerCard}
          wishlist={wishlist}
          onSet={applyEntry}
          onClose={() => setPickerCard(null)}
        />
      ) : null}

      {confirmRestore ? (
        <Portal>
          <Dialog visible onDismiss={() => setConfirmRestore(null)}>
            <Dialog.Title>Ripristinare la carta?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                «{confirmRestore.name}» tornerà tra le carte da prendere.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmRestore(null)}>Annulla</Button>
              <Button
                mode="contained"
                onPress={() => {
                  setObtained.mutate({ cardId: confirmRestore.cardId, obtained: false });
                  setConfirmRestore(null);
                }}>
                Ripristina
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: Spacing.three,
  },
  center: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    marginBottom: Spacing.three,
  },
  listContent: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingBottom: BottomTabInset + Spacing.four,
  },
  separator: {
    height: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
  },
  empty: {
    textAlign: 'center',
    paddingVertical: Spacing.six,
  },
});
