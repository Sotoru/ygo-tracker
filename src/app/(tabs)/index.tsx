// Tab Wishlist: una sola schermata. Casella di ricerca in alto; sotto, i risultati
// di ricerca (≥2 lettere) oppure la wishlist salvata — raggruppata per carta e
// divisa in "Da prendere" (Wanted) e "Prese" (Obtained). Da un risultato o dalla
// matita di una carta si apre il PrintPicker per scegliere rarità + copie.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  ActivityIndicator,
  Button,
  Dialog,
  Divider,
  IconButton,
  List,
  Menu,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  useTheme,
} from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardCell } from "@/components/card-cell";
import { CardRow } from "@/components/card-row";
import { PrintPicker } from "@/components/print-picker";
import { ThemedView } from "@/components/themed-view";
import {
  BottomTabInset,
  contentContainer,
  dialogWidth,
  Spacing,
} from "@/constants/theme";
import type { YgoCard } from "@/data/ygoprodeck";
import { shortRarity } from "@/domain/rarity";
import type { WishlistItem } from "@/domain/types";
import { useCardDetail } from "@/hooks/use-card-detail";
import { useCardsByIds, useCardSearch } from "@/hooks/use-cards";
import { useBreakpoint, useGrid } from "@/hooks/use-layout";
import { useSettings } from "@/hooks/use-settings";
import {
  useDeleteCard,
  useSetObtained,
  useSetWishlistEntries,
  useWishlist,
} from "@/hooks/use-wishlist";

function summarize(
  items: WishlistItem[],
  card: YgoCard | undefined,
  short: boolean,
): string[] {
  const order = [...new Set((card?.card_sets ?? []).map((p) => p.set_rarity))];
  const rank = (r: string) => {
    const i = order.indexOf(r);
    return i === -1 ? 999 : i;
  };
  return [...items]
    .sort((a, b) => rank(a.rarity) - rank(b.rarity))
    .map((i) => `${i.count}x ${short ? shortRarity(i.rarity) : i.rarity}`);
}

const maxOf = (
  items: WishlistItem[],
  f: (i: WishlistItem) => string | undefined,
) =>
  items.reduce((m, i) => {
    const v = f(i) ?? "";
    return v > m ? v : m;
  }, "");

function SearchRow({
  card,
  owned,
  onPick,
}: {
  card: YgoCard;
  owned: boolean;
  onPick: (card: YgoCard) => void;
}) {
  const Presenter =
    useSettings((s) => s.cardView) === "grid" ? CardCell : CardRow;
  const openDetail = useCardDetail((s) => s.open);
  const hasPrints = (card.card_sets?.length ?? 0) > 0;
  return (
    <Presenter
      name={card.name}
      owned={owned}
      imageUrl={card.card_images[0]?.image_url_cropped}
      rarity={card.card_sets?.[0]?.set_rarity}
      onPress={() => openDetail(card)}
    >
      <IconButton
        icon="plus"
        accessibilityLabel="Scegli rarità"
        disabled={!hasPrints}
        onPress={() => onPick(card)}
      />
    </Presenter>
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
  const Presenter = view === "grid" ? CardCell : CardRow;
  const openDetail = useCardDetail((s) => s.open);
  const { colors } = useTheme();
  const phone = useBreakpoint() === "phone"; // fuori dalla && : l'hook va chiamato sempre
  const kebab = view === "list" && phone;
  const [menuOpen, setMenuOpen] = useState(false);
  const name = card?.name ?? "…";

  const actions = kebab ? (
    <Menu
      visible={menuOpen}
      onDismiss={() => setMenuOpen(false)}
      anchorPosition="bottom"
      anchor={
        <IconButton
          icon="dots-vertical"
          accessibilityLabel="Altre azioni"
          onPress={() => setMenuOpen(true)}
        />
      }
    >
      {obtained ? (
        <>
          <Menu.Item
            leadingIcon="restore"
            title="Rimetti tra le carte da prendere"
            onPress={() => {
              setMenuOpen(false);
              onRestore(cardId, name);
            }}
          />
          <Divider />
          <Menu.Item
            leadingIcon="delete"
            title="Elimina dalla wishlist"
            titleStyle={{ color: colors.error }}
            onPress={() => {
              setMenuOpen(false);
              onDelete(cardId, name);
            }}
          />
        </>
      ) : (
        <>
          <Menu.Item
            leadingIcon="pencil"
            title="Modifica rarità e copie"
            disabled={!card}
            onPress={() => {
              setMenuOpen(false);
              if (card) onEdit(card);
            }}
          />
          <Menu.Item
            leadingIcon="check"
            title="Segna come presa"
            onPress={() => {
              setMenuOpen(false);
              onCheck(cardId);
            }}
          />
        </>
      )}
    </Menu>
  ) : obtained ? (
    <View style={styles.actions}>
      <IconButton
        icon="delete"
        accessibilityLabel="Elimina dalla wishlist"
        onPress={() => onDelete(cardId, name)}
      />
      <IconButton
        icon="restore"
        accessibilityLabel="Rimetti tra le carte da prendere"
        onPress={() => onRestore(cardId, name)}
      />
    </View>
  ) : (
    <View style={styles.actions}>
      <IconButton
        icon="pencil"
        accessibilityLabel="Modifica rarità e copie"
        disabled={!card}
        onPress={() => card && onEdit(card)}
      />
      <IconButton
        icon="check"
        accessibilityLabel="Segna come presa"
        onPress={() => onCheck(cardId)}
      />
    </View>
  );

  return (
    <Presenter
      name={name}
      owned={obtained}
      imageUrl={card?.card_images[0]?.image_url_cropped}
      subtitle={summarize(items, card, rarityShort)}
      onPress={card ? () => openDetail(card) : undefined}
    >
      {actions}
    </Presenter>
  );
}

// rows senza header, raggruppate per sezione (per la griglia flexWrap)
function toSections(rows: Row[]) {
  const out: { key: string; title?: string; items: Row[] }[] = [];
  for (const r of rows) {
    if (r.kind === "header")
      out.push({ key: r.key, title: r.title, items: [] });
    else {
      if (!out.length) out.push({ key: "grid", items: [] });
      out[out.length - 1].items.push(r);
    }
  }
  return out;
}

type CardGroup = {
  cardId: number;
  card?: YgoCard;
  items: WishlistItem[];
  obtained: boolean;
};
type Row =
  | { kind: "search"; key: string; card: YgoCard }
  | { kind: "header"; key: string; title: string }
  | ({ kind: "card"; key: string } & CardGroup);

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

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350); // debounce: rispetta il rate limit
    return () => clearTimeout(t);
  }, [query]);

  const searching = query.trim().length > 0;

  const { data: results = [], isFetching, isError } = useCardSearch(debounced);
  const loading = searching && isFetching;

  const clearSearch = () => {
    setQuery("");
    setDebounced("");
  };
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
  const [pickerCard, setPickerCard] = useState<YgoCard | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<{
    cardId: number;
    name: string;
  } | null>(null);

  // Elimina con undo: la carta sparisce subito (filtro sotto), ma la DELETE reale
  // parte solo quando la Snackbar si chiude SENZA "Annulla". Paper chiama onDismiss
  // anche premendo l'azione (Snackbar.tsx) → distinguo con undoRef. key={cardId}
  // rimonta la Snackbar per carta: timeout fresco con la regola "un pendente alla volta".
  const [pendingDelete, setPendingDelete] = useState<{
    cardId: number;
    name: string;
  } | null>(null);
  const undoRef = useRef(false);
  const [lastName, setLastName] = useState(""); // tiene il nome durante il fade-out della Snackbar (pendingDelete già null)
  const askDelete = (cardId: number, name: string) => {
    // un pendente alla volta: se ne era in coda un altro, lo confermo subito
    if (pendingDelete && pendingDelete.cardId !== cardId)
      deleteCard.mutate(pendingDelete.cardId);
    undoRef.current = false;
    setLastName(name);
    setPendingDelete({ cardId, name });
  };

  const applyEntry = (entry: {
    cardId: number;
    entries: { rarity: string; count: number }[];
  }) => {
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
    // la carta con delete pendente è nascosta finché l'undo è disponibile
    const visible = pendingDelete
      ? groups.filter((c) => c.cardId !== pendingDelete.cardId)
      : groups;
    const wanted = visible
      .filter((c) => !c.obtained)
      .sort((a, b) =>
        maxOf(b.items, (i) => i.addedAt).localeCompare(
          maxOf(a.items, (i) => i.addedAt),
        ),
      );
    const prese = visible
      .filter((c) => c.obtained)
      .sort((a, b) =>
        maxOf(b.items, (i) => i.obtainedAt).localeCompare(
          maxOf(a.items, (i) => i.obtainedAt),
        ),
      );
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
  }, [searching, results, groups, pendingDelete]);

  // una riga carta (search o salvata), senza header — sorgente unica per lista e griglia
  const renderCardRow = (r: Extract<Row, { kind: "search" | "card" }>) =>
    r.kind === "search" ? (
      <SearchRow
        key={r.key}
        card={r.card}
        owned={obtainedIds.has(r.card.id)}
        onPick={setPickerCard}
      />
    ) : (
      <SavedCardRow
        key={r.key}
        cardId={r.cardId}
        card={r.card}
        items={r.items}
        obtained={r.obtained}
        onCheck={(cardId) => setObtained.mutate({ cardId, obtained: true })}
        onEdit={setPickerCard}
        onRestore={(cardId, name) => setConfirmRestore({ cardId, name })}
        onDelete={askDelete}
      />
    );

  const emptyContent =
    !searching && wishlistLoading ? (
      // primo caricamento da Neon: spinner, non il messaggio "vuota" (che lampeggerebbe)
      <ActivityIndicator style={styles.empty} />
    ) : (
      <Text
        variant="bodyMedium"
        style={[styles.empty, { color: colors.onSurfaceVariant }]}
      >
        {!searching
          ? "Wishlist vuota — cerca una carta qui sopra per aggiungerla."
          : isError
            ? "Errore di rete. Riprova."
            : debounced.trim().length < 2
              ? "Scrivi almeno 2 lettere per cercare."
              : isFetching
                ? "Cerco…"
                : "Nessun risultato."}
      </Text>
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

      {view === "grid" ? (
        // Griglia: ScrollView (niente virtualizzazione) con, per sezione, header a
        // piena larghezza + celle in flexWrap → colonne responsive senza calcoli.
        <ScrollView
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        >
          {rows.length === 0
            ? emptyContent
            : toSections(rows).map((s) => (
                <View key={s.key}>
                  {s.title ? <List.Subheader>{s.title}</List.Subheader> : null}
                  <View style={styles.grid}>
                    {s.items.map((r) => (
                      <View key={r.key} style={{ width: gridCellWidth }}>
                        {renderCardRow(
                          r as Extract<Row, { kind: "search" | "card" }>,
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              ))}
        </ScrollView>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={({ item: r }) =>
            r.kind === "header" ? (
              <List.Subheader>{r.title}</List.Subheader>
            ) : (
              renderCardRow(r)
            )
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={emptyContent}
        />
      )}

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
          <Dialog
            visible
            onDismiss={() => setConfirmRestore(null)}
            style={dialogWidth}
          >
            <Dialog.Title>Ripristinare la carta?</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">
                <Text style={styles.snackbarName}>{confirmRestore.name}</Text>
                {" tornerà tra le carte da prendere."}
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setConfirmRestore(null)}>Annulla</Button>
              <Button
                mode="contained"
                onPress={() => {
                  setObtained.mutate({
                    cardId: confirmRestore.cardId,
                    obtained: false,
                  });
                  setConfirmRestore(null);
                }}
              >
                Ripristina
              </Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      ) : null}

      {/* Portal (root): è l'approccio consigliato dalla doc di Paper e tiene il
          wrapper absolute width:100% della Snackbar fuori da qualunque padding
          di layout, così resta un popup centrato. */}
      <Portal>
        <Snackbar
          key={pendingDelete?.cardId}
          visible={!!pendingDelete}
          style={dialogWidth}
          onDismiss={() => {
            // scatta sia al timeout sia sull'azione: elimino solo se non è stato "Annulla"
            if (!undoRef.current && pendingDelete)
              deleteCard.mutate(pendingDelete.cardId);
            undoRef.current = false;
            setPendingDelete(null);
          }}
          action={{
            label: "Annulla",
            onPress: () => {
              undoRef.current = true;
            },
          }}
        >
          {/* elemento <Text>: Paper non colora i figli non-stringa → colore esplicito su
            entrambi (l'eredità su RN-Web non è affidabile). inverseOnSurface = il testo Snackbar. */}
          <Text variant="bodyMedium" style={{ color: colors.inverseOnSurface }}>
            <Text
              style={[styles.snackbarName, { color: colors.inverseOnSurface }]}
            >
              {pendingDelete?.name ?? lastName}
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
  listContent: {
    ...contentContainer,
    paddingBottom: BottomTabInset + Spacing.four,
  },
  separator: {
    height: Spacing.two,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.two,
  },
  actions: {
    flexDirection: "row",
  },
  snackbarName: {
    fontWeight: "bold",
  },
  empty: {
    textAlign: "center",
    paddingVertical: Spacing.six,
  },
});
