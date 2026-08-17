// Tab Deck: la griglia dei tuoi Deck. Ogni deck è una card in stile wishlist, con
// l'artwork della carta "in evidenza" (copertina risolta lato repo: scelta esplicita
// o fallback alla prima carta) + FAB (+) per crearne uno nuovo. La copertina si
// sceglie nel dettaglio del deck.
// «Dividi per banlist» (Impostazioni → Deck): una sezione titolata per banlist invece
// della lista piatta, e il nome della banlist esce dal sottotitolo delle card.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Button, FAB, List } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardCell } from '@/components/card/card-cell';
import { ScreenState } from '@/components/shared/screen-state';
import { ThemedView } from '@/components/shared/themed-view';
import { BottomTabInset, contentContainer, Spacing } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { FORMAT_LIST, FORMATS, type Format } from '@/domain/types';
import { useCoverCards } from '@/hooks/shared/use-cover-cards';
import { useDecks } from '@/hooks/deck/use-decks';
import { useGrid } from '@/hooks/shared/use-layout';
import { useSettings } from '@/hooks/shared/use-settings';

// il DB tiene `format` come text (vedi neon-decks.ts): una chiave fuori dal registro
// non è impossibile, e non deve far sparire il deck dalla lista
const banlistLabel = (format: string) => FORMATS[format as Format]?.label ?? 'Missing format';

export default function DeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data: decks = [], isLoading, isError } = useDecks();
  const groupByFormat = useSettings((s) => s.groupByFormat);

  // Sezioni nell'ordine del registro FORMATS; le vuote cadono. Consumo una Map: ogni
  // deck entra una volta, quel che resta dopo le chiavi note è per definizione senza
  // format → nessun deck può sparire per strada. null = lista piatta.
  const sections = useMemo(() => {
    if (!groupByFormat) return null;
    const byFormat = new Map<string, typeof decks>();
    for (const d of decks) byFormat.set(d.format, [...(byFormat.get(d.format) ?? []), d]);
    const known = FORMAT_LIST.map((f) => ({ label: FORMATS[f].label, decks: byFormat.get(f) ?? [] }));
    FORMAT_LIST.forEach((f) => byFormat.delete(f));
    return [...known, { label: 'Missing format', decks: [...byFormat.values()].flat() }].filter(
      (s) => s.decks.length,
    );
  }, [decks, groupByFormat]);

  const { coverUrl } = useCoverCards(decks);

  // copertine: celle grandi, poche per riga (non è una lista densa di carte)
  const { cellWidth } = useGrid({ phone: 3, tablet: 4, desktop: 5 });

  const cell = (d: (typeof decks)[number]) => (
    <View key={d.id} style={{ width: cellWidth }}>
      <CardCell
        name={d.name}
        imageUrl={coverUrl(d)}
        subtitle={[groupByFormat ? `${d.cardCount} carte` : `${banlistLabel(d.format)} · ${d.cardCount} carte`]}
        onPress={() => router.push(`/deck/${d.id}`)}
      />
    </View>
  );

  return (
    <ThemedView
      style={[styles.screen, { paddingTop: Platform.select({ web: 0, default: insets.top + Spacing.three }) }]}>
      <View style={styles.actions}>
        <Button mode="contained-tonal" icon="trophy" onPress={() => router.push('/public-decks')}>
          Tornei
        </Button>
        {isAdmin ? (
          <Button mode="outlined" icon="shield-crown" onPress={() => router.push('/admin/tournaments')}>
            Admin tornei
          </Button>
        ) : null}
      </View>

      <ScreenState
        loading={isLoading}
        error={isError}
        empty="Nessun deck. Tocca + per crearne uno."
        data={decks}>
        {(list) => (
          <ScrollView contentContainerStyle={styles.content}>
            {sections ? (
              sections.map((s) => (
                <View key={s.label}>
                  <List.Subheader>{s.label}</List.Subheader>
                  <View style={styles.grid}>{s.decks.map(cell)}</View>
                </View>
              ))
            ) : (
              <View style={styles.grid}>{list.map(cell)}</View>
            )}
          </ScrollView>
        )}
      </ScreenState>

      <View style={[styles.fabLane, { bottom: Spacing.four + BottomTabInset }]}>
        <FAB icon="plus" accessibilityLabel="Nuovo deck" onPress={() => router.push('/deck/new')} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six },
  actions: { ...contentContainer, alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  // Il FAB segue il bordo destro del container (non quello dello schermo): stessa
  // geometria del contenuto, così sopra i 960 non se ne stacca. La corsia è
  // box-none, altrimenti coprirebbe la griglia sotto.
  fabLane: { position: 'absolute', ...contentContainer, alignItems: 'flex-end', pointerEvents: 'box-none' },
});
