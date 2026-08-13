// Tab Deck: la griglia dei tuoi Deck. Ogni deck è una card in stile wishlist, con
// l'artwork della carta "in evidenza" (copertina risolta lato repo: scelta esplicita
// o fallback alla prima carta) + FAB (+) per crearne uno nuovo. La copertina si
// sceglie nel dettaglio del deck.
// «Dividi per banlist» (Impostazioni → Deck): una sezione titolata per banlist invece
// della lista piatta, e il nome della banlist esce dal sottotitolo delle card.
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, FAB, List, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CardCell } from '@/components/card-cell';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, contentContainer, Spacing } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { FORMATS, type Format } from '@/domain/types';
import { useCardsByIds } from '@/hooks/use-cards';
import { useDecks } from '@/hooks/use-decks';
import { useGrid } from '@/hooks/use-layout';
import { useSettings } from '@/hooks/use-settings';

const FORMAT_LIST = Object.keys(FORMATS) as Format[];

// il DB tiene `format` come text (vedi neon-decks.ts): una chiave fuori dal registro
// non è impossibile, e non deve far sparire il deck dalla lista
const banlistLabel = (format: string) => FORMATS[format as Format]?.label ?? 'Missing format';

export default function DeckScreen() {
  const router = useRouter();
  const { colors } = useTheme();
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

  // batch-fetch (una richiesta) delle carte-copertina, per mostrarne l'artwork
  const coverIds = useMemo(
    () => [...new Set(decks.map((d) => d.coverCardId).filter((id): id is number => id != null))],
    [decks],
  );
  const { data: covers = [] } = useCardsByIds(coverIds);
  const coverById = useMemo(() => new Map(covers.map((c) => [c.id, c])), [covers]);

  // copertine: celle grandi, poche per riga (non è una lista densa di carte)
  const { cellWidth } = useGrid({ phone: 3, tablet: 4, desktop: 5 });

  const cell = (d: (typeof decks)[number]) => {
    const cover = d.coverCardId != null ? coverById.get(d.coverCardId) : undefined;
    return (
      <View key={d.id} style={{ width: cellWidth }}>
        <CardCell
          name={d.name}
          imageUrl={cover?.card_images[0]?.image_url_cropped}
          subtitle={[
            groupByFormat
              ? `${d.cardCount} carte`
              : `${banlistLabel(d.format)} · ${d.cardCount} carte`,
          ]}
          onPress={() => router.push(`/deck/${d.id}`)}
        />
      </View>
    );
  };

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

      {isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Errore di rete. Riprova.
        </Text>
      ) : decks.length === 0 ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Nessun deck. Tocca + per crearne uno.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {sections ? (
            sections.map((s) => (
              <View key={s.label}>
                <List.Subheader>{s.label}</List.Subheader>
                <View style={styles.grid}>{s.decks.map(cell)}</View>
              </View>
            ))
          ) : (
            <View style={styles.grid}>{decks.map(cell)}</View>
          )}
        </ScrollView>
      )}

      <FAB
        icon="plus"
        accessibilityLabel="Nuovo deck"
        style={[styles.fab, { bottom: Spacing.four + BottomTabInset }]}
        onPress={() => router.push('/deck/new')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { ...contentContainer, paddingBottom: Spacing.six },
  actions: { ...contentContainer, alignItems: 'flex-start', flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, paddingHorizontal: Spacing.three },
  // FAB standard MD3 ancorato al bordo dello schermo (allineamento identico web/native).
  fab: { position: 'absolute', right: Spacing.three },
});
