// La stessa lista di righe disegnata in due modi: griglia (ScrollView + flexWrap) o
// lista (FlatList). È qui perché è l'unica differenza tra i due valori di `cardView`,
// e la schermata non deve tenere due alberi JSX per una preferenza.
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';
import Animated, { FadeIn, LayoutAnimationConfig, LinearTransition } from 'react-native-reanimated';

import { BottomTabInset, contentContainer, Spacing } from '@/constants/theme';

export type ListRow = { kind: 'header' | 'card' | 'search'; key: string; title?: string };

// rows senza header, raggruppate per sezione (per la griglia flexWrap)
function toSections<T extends ListRow>(rows: T[]) {
  const out: { key: string; title?: string; items: T[] }[] = [];
  for (const r of rows) {
    if (r.kind === 'header') out.push({ key: r.key, title: r.title, items: [] });
    else {
      if (!out.length) out.push({ key: 'grid', items: [] });
      out[out.length - 1].items.push(r);
    }
  }
  return out;
}

export function WishlistList<T extends ListRow>({
  rows,
  grid,
  cellWidth,
  empty,
  renderRow,
}: {
  rows: T[];
  grid: boolean;
  cellWidth: number;
  empty: ReactNode;
  renderRow: (row: T) => ReactNode; // solo righe carta: gli header li disegna questo componente
}) {
  if (grid)
    // Griglia: ScrollView (niente virtualizzazione) con, per sezione, header a piena
    // larghezza + celle in flexWrap → colonne responsive senza calcoli. Wanted↔Obtained
    // non si vedeva: la riga spariva da una sezione e riappariva nell'altra. Qui le
    // sezioni sono parent distinti, React non conserva l'identità della cella → il move
    // è impossibile senza appiattire la griglia, resta il fade all'arrivo. skipEntering
    // evita la cascata al mount (la cache React Query è persistita: senza gate rifarebbe
    // il fade a ogni cambio tab).
    // ponytail: in lista il move è vero (itemLayoutAnimation sotto) — asimmetria voluta,
    // nessuno confronta le due viste affiancate. Niente exiting: in flexWrap terrebbe il
    // buco per tutta la durata del fade, poi scatto secco.
    return (
      <LayoutAnimationConfig skipEntering>
        <ScrollView contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
          {rows.length === 0
            ? empty
            : toSections(rows).map((s) => (
                <View key={s.key}>
                  {s.title ? <List.Subheader>{s.title}</List.Subheader> : null}
                  <View style={styles.grid}>
                    {s.items.map((r) => (
                      <Animated.View
                        key={r.key}
                        style={{ width: cellWidth }}
                        entering={r.kind === 'card' ? FadeIn : undefined}>
                        {renderRow(r)}
                      </Animated.View>
                    ))}
                  </View>
                </View>
              ))}
        </ScrollView>
      </LayoutAnimationConfig>
    );

  return (
    <Animated.FlatList
      itemLayoutAnimation={LinearTransition}
      data={rows}
      keyExtractor={(r) => r.key}
      renderItem={({ item: r }) =>
        r.kind === 'header' ? <List.Subheader>{r.title}</List.Subheader> : <>{renderRow(r)}</>
      }
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      contentContainerStyle={styles.listContent}
      keyboardShouldPersistTaps="handled"
      // View e non Fragment: VirtualizedList clona questo elemento aggiungendoci
      // onLayout, e un Fragment accetta solo key/children.
      ListEmptyComponent={<View>{empty}</View>}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { ...contentContainer, paddingBottom: BottomTabInset + Spacing.four },
  separator: { height: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
