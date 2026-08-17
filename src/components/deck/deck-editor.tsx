// Edit mode del dettaglio Deck: la griglia diventa editabile (stepper/rimuovi) e la
// Searchbar aggiunge carte, che passano da «Da assegnare» per scegliere la zona.
// Lavora sulla bozza (useDeckDraft): niente scritture finché non si salva.
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, HelperText, Icon, IconButton, List, Searchbar, Text, useTheme } from 'react-native-paper';

import { CardCell } from '@/components/card/card-cell';
import { CardRow } from '@/components/card/card-row';
import { ScreenMessage } from '@/components/shared/screen-state';
import { contentContainer, Spacing } from '@/constants/theme';
import type { YgoCard } from '@/data/ygoprodeck';
import { ZONES } from '@/domain/types';
import { suggestedZone } from '@/domain/zone';
import { useCardSearchBox } from '@/hooks/card/use-card-search-box';
import { MAX_COPIES, type DeckDraft } from '@/hooks/deck/use-deck-draft';

export function DeckEditor({
  draft,
  cellWidth,
  resolveCard,
}: {
  draft: DeckDraft;
  cellWidth: number;
  resolveCard: (cardId: number) => YgoCard | undefined;
}) {
  const { colors } = useTheme();
  const search = useCardSearchBox();

  const addCard = (card: YgoCard) => {
    draft.add(card);
    search.clear(); // torna al deck: la carta appare in «Da assegnare»
  };

  const sections = ZONES.map(({ zone, label }) => ({
    zone,
    label,
    entries: draft.draft.filter((e) => e.zone === zone),
  })).filter((s) => s.entries.length);

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Searchbar
        placeholder="Aggiungi una carta…"
        value={search.query}
        onChangeText={search.setQuery}
        loading={search.isFetching}
        autoCorrect={false}
        autoCapitalize="none"
        onClearIconPress={search.clear}
      />

      {search.searching ? (
        <View style={styles.grid}>
          {search.results.map((card) => (
            <View key={card.id} style={{ width: cellWidth }}>
              <CardCell
                name={card.name}
                imageUrl={card.card_images[0]?.image_url_cropped}
                frameType={card.frameType}
                onPress={() => addCard(card)}
                topRight={<Icon source="plus-circle" color={colors.primary} size={24} />}
              />
            </View>
          ))}
          {search.debounced.trim().length >= 2 && !search.isFetching && search.results.length === 0 ? (
            <ScreenMessage>Nessun risultato.</ScreenMessage>
          ) : null}
        </View>
      ) : (
        <>
          {draft.staging.length ? (
            <View>
              <List.Subheader>{`Da assegnare (${draft.staging.length})`}</List.Subheader>
              {draft.staging.map((cardId) => {
                const card = resolveCard(cardId);
                if (!card) return null;
                const sug = suggestedZone(card.frameType);
                return (
                  <CardRow
                    key={`st-${cardId}`}
                    name={card.name}
                    imageUrl={card.card_images[0]?.image_url_cropped}
                    subtitle={['In quale zona?']}>
                    <View style={styles.zoneChips}>
                      {ZONES.map(({ zone, label }) => (
                        <Chip
                          key={zone}
                          compact
                          selected={zone === sug} // zona inferita dal tipo, pre-evidenziata
                          showSelectedOverlay
                          onPress={() => draft.assign(cardId, zone)}>
                          {label}
                        </Chip>
                      ))}
                    </View>
                  </CardRow>
                );
              })}
              <HelperText type="info" visible>
                Assegna le carte in «Da assegnare» per poter salvare.
              </HelperText>
            </View>
          ) : null}

          {sections.length === 0 && draft.staging.length === 0 ? (
            <ScreenMessage>Deck vuoto — cerca una carta qui sopra per aggiungerla.</ScreenMessage>
          ) : (
            sections.map((sec) => (
              <View key={sec.label}>
                <List.Subheader>{`${sec.label} (${sec.entries.reduce((n, e) => n + e.count, 0)})`}</List.Subheader>
                <View style={styles.grid}>
                  {sec.entries.flatMap((e) => {
                    const card = resolveCard(e.cardId);
                    if (!card) return []; // id non risolto → non si disegna
                    return (
                      <View key={`${sec.zone}-${e.cardId}`} style={{ width: cellWidth }}>
                        <CardCell
                          name={card.name}
                          imageUrl={card.card_images[0]?.image_url_cropped}
                          frameType={card.frameType}>
                          <View style={styles.stepper}>
                            <View style={styles.stepGroup}>
                              <IconButton
                                icon="minus"
                                size={16}
                                mode="contained-tonal"
                                style={styles.stepBtn}
                                disabled={e.count <= 1}
                                accessibilityLabel="Una copia in meno"
                                onPress={() => draft.bump(e.cardId, sec.zone, -1)}
                              />
                              <Text variant="titleMedium">{e.count}</Text>
                              <IconButton
                                icon="plus"
                                size={16}
                                mode="contained-tonal"
                                style={styles.stepBtn}
                                disabled={e.count >= MAX_COPIES}
                                accessibilityLabel="Una copia in più"
                                onPress={() => draft.bump(e.cardId, sec.zone, 1)}
                              />
                            </View>
                            <IconButton
                              icon="delete"
                              size={16}
                              style={styles.stepBtn}
                              accessibilityLabel="Rimuovi carta"
                              onPress={() => draft.remove(e.cardId, sec.zone)}
                            />
                          </View>
                        </CardCell>
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.three },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  // − 2 + riempiono lo spazio; il cestino resta a destra a dimensione fissa
  stepGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' },
  stepBtn: { margin: 0 }, // azzera il margine 6 di Paper → i 3 controlli entrano nella cella stretta
  zoneChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'flex-end', maxWidth: 200 },
});
