// Le carte di un deck in sola lettura: una sezione per zona, dentro una griglia per
// gruppo. Identica nel dettaglio del Deck personale e in quello da torneo — l'unica
// differenza è lo slot in alto a destra della cella (la stella copertina), qui uno slot.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';

import { CardCell } from '@/components/card/card-cell';
import { Spacing } from '@/constants/theme';
import type { YgoCard } from '@/data/ygoprodeck';
import type { Zone } from '@/domain/types';

type Entry = { cardId: number; zone: Zone; count: number };

export function DeckGrid<T extends Entry>({
  sections,
  byId,
  cellWidth,
  onPressCard,
  topRight,
}: {
  sections: { label: string; groups: T[][] }[];
  byId: Map<number, YgoCard>;
  cellWidth: number;
  onPressCard: (card: YgoCard) => void;
  topRight?: (cardId: number) => ReactNode;
}) {
  return sections.map((sec) => (
    <View key={sec.label} style={styles.zone}>
      <List.Subheader>{`${sec.label} (${sec.groups.flat().reduce((n, e) => n + e.count, 0)})`}</List.Subheader>
      {/* un gruppo = una griglia: con «Gruppi a capo» sono Mostri/Magie/Trappole e la
          riga si chiude a fine gruppo, altrimenti è un gruppo solo */}
      {sec.groups.map((group) => (
        <View key={`${sec.label}-${group[0].cardId}`} style={styles.grid}>
          {group.flatMap((e) => {
            const card = byId.get(e.cardId);
            if (!card) return []; // id non risolto → non si disegna
            return (
              <View key={`${e.zone}-${e.cardId}`} style={{ width: cellWidth }}>
                <CardCell
                  name={card.name}
                  imageUrl={card.card_images[0]?.image_url_cropped}
                  frameType={card.frameType}
                  count={e.count}
                  badge={e.count >= 2 ? `×${e.count}` : undefined}
                  onPress={() => onPressCard(card)}
                  topRight={topRight?.(e.cardId)}
                />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  ));
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  zone: { gap: Spacing.two }, // stessa distanza tra le righe di gruppi diversi e dentro la griglia
});
