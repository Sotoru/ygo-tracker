// Editor della Wishlist per una Card. La Wishlist vive su (Card, Rarity): il Set
// è ignorato, quindi mostriamo le rarità distinte della carta (dedup di
// set_rarity, ordine di prima apparizione ≈ release). Ogni rarità ha uno stepper
// 0..9 precompilato col count in wishlist; "Conferma" riconcilia (upsert >0,
// rimuove =0). Dialog MD3 cross-platform (Portal).
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';

import { dialogWidth, Spacing } from '@/constants/theme';
import type { YgoCard } from '@/data/ygoprodeck';
import type { WishlistItem } from '@/domain/types';

const MAX = 9;

export function PrintPicker({
  card,
  wishlist,
  onSet,
  onClose,
}: {
  card: YgoCard;
  wishlist: WishlistItem[];
  onSet: (entry: { cardId: number; entries: { rarity: string; count: number }[] }) => void;
  onClose: () => void;
}) {
  // rarità distinte della carta, ordine di prima apparizione
  const rarities = [...new Set((card.card_sets ?? []).map((p) => p.set_rarity))];

  const savedCount = (rarity: string) =>
    wishlist.find((w) => w.cardId === card.id && w.rarity === rarity)?.count ?? 0;

  // stato locale: count per rarità, prefill dai valori in wishlist
  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(rarities.map((r) => [r, savedCount(r)])),
  );
  // cap al 60% dell'altezza schermo: lascia respiro per titolo+azioni e
  // resta centrato (il Modal di Paper centra in verticale). Bounded → la
  // FlatList scrolla e non collassa a 0 su web.
  const { height } = useWindowDimensions();

  const bump = (rarity: string, delta: number) =>
    setCounts((c) => ({ ...c, [rarity]: Math.max(0, Math.min(MAX, (c[rarity] ?? 0) + delta)) }));

  const confirm = () => {
    // un solo batch con tutte le rarità del picker (idempotente sui non cambiati):
    // una sola write nel repo → niente lost update. Vedi setWishlistEntries.
    onSet({ cardId: card.id, entries: rarities.map((rarity) => ({ rarity, count: counts[rarity] ?? 0 })) });
    onClose();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onClose} style={dialogWidth}>
        <Dialog.Title numberOfLines={2}>{card.name}</Dialog.Title>

        {rarities.length === 0 ? (
          <Dialog.Content>
            <Text variant="bodyMedium">Nessuna stampa disponibile per questa carta.</Text>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={[styles.scrollArea, { maxHeight: height * 0.6 }]}>
            <FlatList
              data={rarities}
              keyExtractor={(r) => r}
              renderItem={({ item: rarity }) => {
                const count = counts[rarity] ?? 0;
                return (
                  <View style={styles.row}>
                    <Text variant="bodyLarge" style={styles.rarity} numberOfLines={1}>
                      {rarity}
                    </Text>
                    <View style={styles.stepper}>
                      <IconButton
                        icon="minus"
                        accessibilityLabel={`Meno ${rarity}`}
                        disabled={count <= 0}
                        onPress={() => bump(rarity, -1)}
                      />
                      <Text variant="titleMedium" style={styles.count}>
                        {count}
                      </Text>
                      <IconButton
                        icon="plus"
                        accessibilityLabel={`Più ${rarity}`}
                        disabled={count >= MAX}
                        onPress={() => bump(rarity, +1)}
                      />
                    </View>
                  </View>
                );
              }}
            />
          </Dialog.ScrollArea>
        )}

        <Dialog.Actions>
          <Button onPress={onClose}>Annulla</Button>
          <Button mode="contained" disabled={rarities.length === 0} onPress={confirm}>
            Conferma
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  scrollArea: {
    paddingHorizontal: Spacing.four,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  rarity: {
    flex: 1,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  count: {
    minWidth: 24,
    textAlign: 'center',
  },
});
