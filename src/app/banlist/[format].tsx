// Pool di una banlist statica, diviso per status (Semi-Limited → Limited →
// Forbidden). Le carte arrivano da YGOPRODeck per nome esatto (una richiesta,
// vedi useBanlistCards); lo status lo conosco già dal file (banlists.ts) e
// ordino ogni sezione come nel file. Riusa i presenter della Wishlist col toggle
// griglia/lista. Rotta sopra le tab (Stack root) → header/back propri.
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Appbar, List, Menu } from 'react-native-paper';

import { CardCell } from '@/components/card/card-cell';
import { ScreenHeader } from '@/components/shared/screen-header';
import { ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { contentContainer, Spacing } from '@/constants/theme';
import { BANLISTS } from '@/domain/banlists';
import { FORMATS, type BanStatus, type Format } from '@/domain/types';
import { useCardDetail } from '@/hooks/card/use-card-detail';
import { useBanlistCards } from '@/hooks/card/use-cards';
import { useGrid } from '@/hooks/shared/use-layout';
import { BANLIST_COLUMN_OPTIONS, useSettings } from '@/hooks/shared/use-settings';

// Ordine di visualizzazione scelto: dal meno al più restrittivo.
const SECTIONS: { status: Exclude<BanStatus, 'unlimited'>; label: string }[] = [
  { status: 'semiLimited', label: 'Semi-Limited' },
  { status: 'limited', label: 'Limited' },
  { status: 'forbidden', label: 'Forbidden' },
];

export default function BanlistScreen() {
  const openDetail = useCardDetail((s) => s.open);
  const { format } = useLocalSearchParams<{ format: Format }>();
  const known = format in FORMATS;

  const { data: cards = [], isLoading, isError } = useBanlistCards(format);

  // griglia densa (browse/reference): colonne scelte dall'utente (picker in
  // appbar, persistito), ridotte a quante ci stanno per non scendere sotto
  // MinCellWidth → sempre usabile anche su phone.
  const { banlistColumns: desiredColumns, setBanlistColumns, banlistShowTitles, setBanlistShowTitles } =
    useSettings();
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const { cellWidth } = useGrid(desiredColumns);

  // carte per nome → sezioni nell'ordine del file (le non risolte, 0 oggi, cadono)
  const sections = useMemo(() => {
    const byName = new Map(cards.map((c) => [c.name, c]));
    return SECTIONS.map(({ status, label }) => ({
      label,
      cards: (known ? (BANLISTS[format][status] ?? []) : []).flatMap((n) => byName.get(n) ?? []),
    })).filter((s) => s.cards.length);
  }, [cards, format, known]);

  return (
    <ThemedView style={styles.screen}>
      <ScreenHeader title={known ? FORMATS[format].label : 'Banlist'} fallback="/deck">
        {/* Toggle nome carte: l'icona mostra lo stato corrente (occhio aperto =
            visibile). Bool → un tap, niente menu. */}
        <Appbar.Action
          icon={banlistShowTitles ? 'eye' : 'eye-off'}
          accessibilityLabel={banlistShowTitles ? 'Nascondi nomi' : 'Mostra nomi'}
          onPress={() => setBanlistShowTitles(!banlistShowTitles)}
        />
        {/* Picker colonne: stesso pattern del menu cardView (anchor + Menu.Item
            con check sulla scelta). Mostra la scelta, non l'effettivo clampato. */}
        <Menu
          visible={colMenuOpen}
          onDismiss={() => setColMenuOpen(false)}
          anchor={
            <Appbar.Action
              icon="view-grid"
              accessibilityLabel="Colonne griglia"
              onPress={() => setColMenuOpen(true)}
            />
          }>
          {BANLIST_COLUMN_OPTIONS.map((n) => (
            <Menu.Item
              key={n}
              title={String(n)}
              trailingIcon={n === desiredColumns ? 'check' : undefined}
              onPress={() => {
                setBanlistColumns(n);
                setColMenuOpen(false);
              }}
            />
          ))}
        </Menu>
      </ScreenHeader>

      <ScreenState
        gate={known ? undefined : 'Formato sconosciuto.'}
        loading={isLoading}
        error={isError}
        data={sections}>
        {(list) => (
          // ponytail: ScrollView non virtualizza; ~160 righe con expo-image reggono
          // per un placeholder. Se pesa, passa la lista a SectionList (la griglia
          // resta flexWrap).
          <ScrollView contentContainerStyle={styles.content}>
            {list.map((sec) => (
              <View key={sec.label}>
                <List.Subheader>{`${sec.label} (${sec.cards.length})`}</List.Subheader>
                <View style={styles.grid}>
                  {sec.cards.map((c) => (
                    <View key={c.id} style={{ width: cellWidth }}>
                      <CardCell
                        name={c.name}
                        imageUrl={c.card_images[0]?.image_url_cropped}
                        showTitle={banlistShowTitles}
                        onPress={() => openDetail(c)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </ScreenState>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    ...contentContainer,
    paddingBottom: Spacing.six,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
