// Tab Wishlist: una sola schermata. Casella di ricerca in alto; sotto, i risultati
// di ricerca (≥2 lettere) oppure la wishlist salvata — raggruppata per carta e
// divisa in "Da prendere" (Wanted) e "Prese" (Obtained). Da un risultato o dalla
// matita di una carta si apre il PrintPicker per scegliere rarità + copie.
import { useMemo, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import {
  IconButton,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PrintPicker } from "@/components/wishlist/print-picker";
import { ScreenLoading, ScreenMessage } from "@/components/shared/screen-state";
import { ThemedView } from "@/components/shared/themed-view";
import { WishlistList } from "@/components/wishlist/wishlist-list";
import { WishlistRow, type WishlistRowData } from "@/components/wishlist/wishlist-row";
import { contentContainer, dialogWidth, Spacing } from "@/constants/theme";
import type { YgoCard } from "@/data/ygoprodeck";
import type { WishlistItem } from "@/domain/types";
import { useCardSearchBox } from "@/hooks/card/use-card-search-box";
import { useCardsByIds } from "@/hooks/card/use-cards";
import { useGrid } from "@/hooks/shared/use-layout";
import { useSettings } from "@/hooks/shared/use-settings";
import { useUndoableDelete } from "@/hooks/wishlist/use-undoable-delete";
import {
  useDeleteCard,
  useSetObtained,
  useSetWishlistEntries,
  useWishlist,
} from "@/hooks/wishlist/use-wishlist";

type CardGroup = {
  cardId: number;
  card?: YgoCard;
  items: WishlistItem[];
  obtained: boolean;
};
type Row = WishlistRowData | { kind: "header"; key: string; title: string };

const maxOf = (
  items: WishlistItem[],
  f: (i: WishlistItem) => string | undefined,
) =>
  items.reduce((m, i) => {
    const v = f(i) ?? "";
    return v > m ? v : m;
  }, "");

// Ordine della lista: prima "Da prendere" (per aggiunta più recente), poi "Prese"
// (per presa più recente). `hiddenCardId` è la carta con delete pendente: sparisce
// dalla lista finché l'undo è disponibile.
function wishlistRows(
  searching: boolean,
  results: YgoCard[],
  groups: CardGroup[],
  hiddenCardId: number | undefined,
): Row[] {
  if (searching)
    return results.map((card) => ({
      kind: "search",
      key: `s${card.id}`,
      card,
    }));

  const toRow = (c: CardGroup): Row => ({
    kind: "card",
    key: `c${c.cardId}`,
    ...c,
  });
  const visible = groups.filter((c) => c.cardId !== hiddenCardId);
  const byRecent =
    (f: (i: WishlistItem) => string | undefined) =>
    (a: CardGroup, b: CardGroup) =>
      maxOf(b.items, f).localeCompare(maxOf(a.items, f));
  const wanted = visible
    .filter((c) => !c.obtained)
    .sort(byRecent((i) => i.addedAt));
  const prese = visible
    .filter((c) => c.obtained)
    .sort(byRecent((i) => i.obtainedAt));

  return [
    ...(wanted.length
      ? [
          { kind: "header", key: "h-wanted", title: "Da prendere" } as Row,
          ...wanted.map(toRow),
        ]
      : []),
    ...(prese.length
      ? [
          {
            kind: "header",
            key: "h-prese",
            title: `Prese (${prese.length})`,
          } as Row,
          ...prese.map(toRow),
        ]
      : []),
  ];
}

// Cosa dire quando non c'è niente da mostrare: dipende da se stai cercando, da
// quanto hai scritto e dall'esito della richiesta.
function EmptyState({
  search,
  wishlistLoading,
}: {
  search: ReturnType<typeof useCardSearchBox>;
  wishlistLoading: boolean;
}) {
  // primo caricamento da Neon: spinner, non il messaggio "vuota" (che lampeggerebbe)
  if (!search.searching)
    return wishlistLoading ? (
      <ScreenLoading />
    ) : (
      <ScreenMessage>
        Wishlist vuota — cerca una carta qui sopra per aggiungerla.
      </ScreenMessage>
    );
  if (search.isError) return <ScreenMessage>Errore di rete. Riprova.</ScreenMessage>;
  if (search.debounced.trim().length < 2)
    return <ScreenMessage>Scrivi almeno 2 lettere per cercare.</ScreenMessage>;
  return <ScreenMessage>{search.isFetching ? "Cerco…" : "Nessun risultato."}</ScreenMessage>;
}

export default function WishlistScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const view = useSettings((s) => s.cardView);

  // Griglia: 5 colonne da tablet in su, 2 su phone.
  const { cellWidth: gridCellWidth } = useGrid({
    phone: 2,
    tablet: 5,
    desktop: 5,
  });

  const search = useCardSearchBox();
  const loading = search.searching && search.isFetching;
  const { data: wishlist = [], isLoading: wishlistLoading } = useWishlist();

  // fetch batch (una richiesta) delle Card salvate, per mostrare nome + immagine
  const ids = useMemo(
    () => [...new Set(wishlist.map((w) => w.cardId))],
    [wishlist],
  );
  const { data: savedCards = [] } = useCardsByIds(ids);
  const cardById = useMemo(
    () => new Map(savedCards.map((c) => [c.id, c])),
    [savedCards],
  );

  const setEntry = useSetWishlistEntries();
  const setObtained = useSetObtained();
  const deleteCard = useDeleteCard();
  const pendingDelete = useUndoableDelete((cardId) =>
    deleteCard.mutate(cardId),
  );
  const [pickerCard, setPickerCard] = useState<YgoCard | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{
    cardId: number;
    name: string;
  } | null>(null);

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

  // memo: `rows` è il `data` della FlatList, un'identità nuova a ogni render la
  // farebbe ridisegnare per nulla.
  const hiddenCardId = pendingDelete.pending?.cardId;
  const rows = useMemo(
    () => wishlistRows(search.searching, search.results, groups, hiddenCardId),
    [search.searching, search.results, groups, hiddenCardId],
  );

  return (
    <ThemedView
      style={[
        styles.screen,
        // web: lo spazio sotto la tab bar è gestito dal layout (marginBottom della barra)
        {
          paddingTop: Platform.select({
            web: 0,
            default: insets.top + Spacing.three,
          }),
        },
      ]}
    >
      <View style={[styles.center, styles.header]}>
        <Searchbar
          style={styles.search}
          value={search.query}
          onChangeText={search.setQuery}
          placeholder="Cerca una carta…"
          loading={loading}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          // `right` disattiva la clear icon di default (il cui Surface disegna un
          // cerchio bianco a campo vuoto, ora visibile sul bar blu). Mostro la X
          // solo con testo e non durante lo spinner.
          right={({ color, style }) =>
            search.searching && !loading ? (
              <IconButton
                style={style}
                icon="close"
                iconColor={color}
                size={24}
                accessibilityLabel="Cancella ricerca"
                onPress={search.clear}
              />
            ) : null
          }
        />
      </View>

      <WishlistList
        rows={rows}
        grid={view === "grid"}
        cellWidth={gridCellWidth}
        empty={<EmptyState search={search} wishlistLoading={wishlistLoading} />}
        // una riga carta (search o salvata), senza header — sorgente unica per lista e griglia
        renderRow={(row) => (
          <WishlistRow
            row={row}
            owned={row.kind === "search" ? obtainedIds.has(row.card.id) : false}
            onPick={setPickerCard}
            onCheck={(cardId) => setObtained.mutate({ cardId, obtained: true })}
            onRestore={(cardId, name) => setConfirmRestore({ cardId, name })}
            onDelete={pendingDelete.ask}
          />
        )}
      />

      {pickerCard ? (
        <PrintPicker
          card={pickerCard}
          wishlist={wishlist}
          onSet={(entry) =>
            // se ho modificato qualcosa svuoto la ricerca: torno alla wishlist e vedo il risultato
            setEntry.mutate(entry, { onSuccess: search.clear })
          }
          onClose={() => setPickerCard(null)}
        />
      ) : null}

      {/* montato solo quando serve: così il nome non svanisce durante la chiusura */}
      {confirmRestore ? (
        <ConfirmDialog
          visible
          title="Ripristinare la carta?"
          confirmLabel="Ripristina"
          mode="contained"
          onDismiss={() => setConfirmRestore(null)}
          onConfirm={() => {
            setObtained.mutate({
              cardId: confirmRestore.cardId,
              obtained: false,
            });
            setConfirmRestore(null);
          }}
        >
          <>
            <Text style={styles.snackbarName}>{confirmRestore.name}</Text>
            {" tornerà tra le carte da prendere."}
          </>
        </ConfirmDialog>
      ) : null}

      {/* Portal (root): è l'approccio consigliato dalla doc di Paper e tiene il
          wrapper absolute width:100% della Snackbar fuori da qualunque padding
          di layout, così resta un popup centrato. key={cardId} rimonta la Snackbar
          per carta: timeout fresco con la regola "un pendente alla volta". */}
      <Portal>
        <Snackbar
          key={pendingDelete.pending?.cardId}
          visible={!!pendingDelete.pending}
          style={dialogWidth}
          onDismiss={pendingDelete.close}
          action={{ label: "Annulla", onPress: pendingDelete.undo }}
        >
          {/* elemento <Text>: Paper non colora i figli non-stringa → colore esplicito su
            entrambi (l'eredità su RN-Web non è affidabile). inverseOnSurface = il testo Snackbar. */}
          <Text variant="bodyMedium" style={{ color: colors.inverseOnSurface }}>
            <Text
              style={[styles.snackbarName, { color: colors.inverseOnSurface }]}
            >
              {pendingDelete.pending?.name ?? pendingDelete.lastName}
            </Text>
            {" eliminata"}
          </Text>
        </Snackbar>
      </Portal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    ...contentContainer,
    marginBottom: Spacing.three,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  search: {
    flex: 1,
  },
  snackbarName: {
    fontWeight: "bold",
  },
});
