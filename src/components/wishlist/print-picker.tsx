// Editor della Wishlist per una Card. La Wishlist vive su (Card, Rarity): il Set
// è ignorato, quindi mostriamo le rarità distinte della carta (dedup di
// set_rarity, ordine di prima apparizione ≈ release). Ogni rarità ha uno stepper
// 0..9 precompilato col count in wishlist; "Conferma" riconcilia (upsert >0,
// rimuove =0). Dialog MD3 cross-platform (Portal).
import { useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';

import { dialogWidth, Spacing } from '@/constants/theme';
import type { YgoCard } from '@/data/ygoprodeck';
import type { WishlistItem } from '@/domain/types';
import { useDialogScrollBounds } from '@/hooks/shared/use-dialog-scroll-bounds';

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
  const rarities = [...new Set((card.card_sets ?? []).map((p) => p.set_rarity))];

  const savedCount = (rarity: string) =>
    wishlist.find((w) => w.cardId === card.id && w.rarity === rarity)?.count ?? 0;

  const [counts, setCounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(rarities.map((r) => [r, savedCount(r)])),
  );
  const {
    dialogStyle,
    scrollAreaMaxHeight,
    topChromeStyle,
    titleStyle,
    scrollAreaStyle,
    actionsStyle,
    onTopLayout,
    onBottomLayout,
  } = useDialogScrollBounds();

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
      <Dialog visible onDismiss={onClose} style={[dialogWidth, dialogStyle]}>
        <View onLayout={onTopLayout} style={topChromeStyle}>
          <Dialog.Title numberOfLines={2} style={titleStyle}>
            {card.name}
          </Dialog.Title>
        </View>

        {rarities.length === 0 ? (
          <Dialog.Content>
            <Text variant="bodyMedium">Nessuna stampa disponibile per questa carta.</Text>
          </Dialog.Content>
        ) : (
          <Dialog.ScrollArea style={[scrollAreaStyle, { maxHeight: scrollAreaMaxHeight }]}>
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

        <Dialog.Actions onLayout={onBottomLayout} style={actionsStyle}>
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
