// Riga carta, presentazionale: List.Item MD3 con thumbnail a sinistra, nome +
// una o più righe "rarità ×N" impilate (una per rarità) al centro e uno slot
// trailing (children) a destra. La riga cresce in altezza con le rarità. Stessa
// riga per i risultati di ricerca e per la wishlist salvata: cambia solo il
// bottone trailing (aggiungi vs rimuovi).
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { Icon, List, Text, useTheme } from "react-native-paper";

import { Spacing } from "@/constants/theme";
import { cardImageUrl } from "@/data/ygoprodeck";

export function CardRow({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  owned,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità (es. ["Ultra Rare ×2", "Secret Rare ×1"]); ha priorità su rarity/count
  owned?: boolean; // mostra il segno "Presa" (check-circle) accanto al nome
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const lines =
    subtitle ??
    (rarity ? [`${rarity}${count ? ` ×${count}` : ""}`] : ["Nessuna stampa"]);

  return (
    <List.Item
      title={
        owned
          ? (props) => (
              <View style={styles.titleRow}>
                <Text {...props} numberOfLines={2} variant="titleLarge">
                  {name}
                </Text>
                <Icon source="check-circle" size={16} color={colors.primary} />
              </View>
            )
          : name
      }
      titleNumberOfLines={2}
      // una Text per riga (numberOfLines={1}): ogni rarità sta su una riga e
      // tronca con "…" se troppo lunga; la List.Item cresce in altezza da sola.
      description={({ color, ellipsizeMode }) => (
        <View>
          {lines.map((line, i) => (
            <Text
              key={i}
              variant="bodyMedium"
              numberOfLines={1}
              ellipsizeMode={ellipsizeMode}
              style={{ color }}
            >
              {line}
            </Text>
          ))}
        </View>
      )}
      style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
      left={() =>
        imageUrl ? (
          <Image
            source={{ uri: cardImageUrl(imageUrl, { width: 120 }) }}
            style={styles.thumb}
            contentFit="contain"
          />
        ) : (
          <View style={styles.thumb} />
        )
      }
      right={
        children
          ? () => <View style={styles.right}>{children}</View>
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Spacing.three,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.two,
  },
  thumb: {
    width: 44,
    height: 64,
    borderRadius: Spacing.one,
    alignSelf: "center",
    marginLeft: Spacing.two,
  },
  right: {
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});
