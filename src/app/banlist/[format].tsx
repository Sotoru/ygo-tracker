// Pool di una banlist statica, diviso per status (Semi-Limited → Limited →
// Forbidden). Le carte arrivano da YGOPRODeck per nome esatto (una richiesta,
// vedi useBanlistCards); lo status lo conosco già dal file (banlists.ts) e
// ordino ogni sezione come nel file. Riusa i presenter della Wishlist col toggle
// griglia/lista. Rotta sopra le tab (Stack root) → header/back propri.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { ActivityIndicator, Appbar, List, Menu, Text, useTheme } from 'react-native-paper';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { BANLISTS } from '@/domain/banlists';
import { FORMATS, type BanStatus, type Format } from '@/domain/types';
import { useCardDetail } from '@/hooks/use-card-detail';
import { useBanlistCards } from '@/hooks/use-cards';
import { BANLIST_COLUMN_OPTIONS, useSettings } from '@/hooks/use-settings';

// Sotto questa larghezza le celle diventano illeggibili: la scelta utente viene
// ridotta a quante colonne ci stanno davvero.
const MIN_CELL_WIDTH = 120;

// Ordine di visualizzazione scelto: dal meno al più restrittivo.
const SECTIONS: { status: Exclude<BanStatus, 'unlimited'>; label: string }[] = [
  { status: 'semiLimited', label: 'Semi-Limited' },
  { status: 'limited', label: 'Limited' },
  { status: 'forbidden', label: 'Forbidden' },
];

export default function BanlistScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const openDetail = useCardDetail((s) => s.open);
  const { format } = useLocalSearchParams<{ format: Format }>();
  const known = format in FORMATS;

  const { data: cards = [], isLoading, isError } = useBanlistCards(format);

  // griglia densa (browse/reference): colonne scelte dall'utente (picker in
  // appbar, persistito), ridotte a quante ci stanno per non scendere sotto
  // MIN_CELL_WIDTH → sempre usabile anche su phone.
  const { banlistColumns: desiredColumns, setBanlistColumns, banlistShowTitles, setBanlistShowTitles } =
    useSettings();
  const [colMenuOpen, setColMenuOpen] = useState(false);
  const { width } = useWindowDimensions();
  // padding sottratto DOPO il cap: dentro il content box (maxWidth − padding),
  // non sulla finestra, altrimenti su desktop il cap vince e le celle wrappano
  const available = Math.min(width, MaxContentWidth) - Spacing.three * 2;
  const fits = Math.max(1, Math.floor((available + Spacing.two) / (MIN_CELL_WIDTH + Spacing.two)));
  const columns = Math.min(desiredColumns, fits);
  const cellWidth = Math.floor((available - Spacing.two * (columns - 1)) / columns);

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
      {/* barra cappata a 800 e centrata come il resto dell'app (sfondo trasparente) */}
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title={known ? FORMATS[format].label : 'Banlist'} />
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
      </Appbar.Header>

      {!known ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Formato sconosciuto.
        </Text>
      ) : isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Errore di rete. Riprova.
        </Text>
      ) : (
        // ponytail: ScrollView non virtualizza; ~160 righe con expo-image reggono
        // per un placeholder. Se pesa, passa la lista a SectionList (la griglia
        // resta flexWrap).
        <ScrollView contentContainerStyle={styles.content}>
          {sections.map((sec) => (
            <View key={sec.label}>
              <List.Subheader>{`${sec.label} (${sec.cards.length})`}</List.Subheader>
              <View style={styles.grid}>
                {sec.cards.map((c) => (
                  <View key={c.id} style={{ width: cellWidth }}>
                    <CardCell
                      name={c.name}
                      imageUrl={c.card_images[0]?.image_url_cropped}
                      subtitle={[]}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { backgroundColor: 'transparent', width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  content: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.six,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six },
});
