// Riga carta, presentazionale: List.Item MD3 con thumbnail a sinistra, nome +
// una o più righe "rarità ×N" impilate (una per rarità) al centro e uno slot
// trailing (children) a destra. La riga cresce in altezza con le rarità. Stessa
// riga per i risultati di ricerca e per la wishlist salvata: cambia solo il
// bottone trailing (aggiungi vs rimuovi).
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, List, Text, useTheme } from "react-native-paper";

import { Spacing } from "@/constants/theme";
import { cardImageUrl } from "@/data/ygoprodeck";

// spezza le righe in colonne da `size`: [a,b,c,d,e] → [[a,b,c,d],[e]]
const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

export function CardRow({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  owned,
  onPress,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità (es. ["Ultra Rare ×2", "Secret Rare ×1"]); ha priorità su rarity/count
  owned?: boolean; // mostra il segno "Presa" (check-circle) accanto al nome
  onPress?: () => void; // tap sull'immagine → apre il dettaglio (assente = non tappabile)
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
        // ogni 4 righe una colonna, colonne affiancate
        <View style={styles.descRow}>
          {chunk(lines, 4).map((col, ci) => (
            <View key={ci} style={styles.descCol}>
              {col.map((line, i) => (
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
          ))}
        </View>
      )}
      style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
      // Paper aggiunge marginVertical:6 alla riga → lo azzero per un inset uniforme
      containerStyle={styles.rowInner}
      contentStyle={styles.content}
      left={() =>
        imageUrl ? (
          <Pressable onPress={onPress} disabled={!onPress} accessibilityLabel={onPress ? `Dettaglio ${name}` : undefined}>
            <Image
              source={{ uri: cardImageUrl(imageUrl, { width: 260 }) }}
              style={styles.thumb}
              contentFit="contain"
            />
          </Pressable>
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
    padding: Spacing.two, // inset uniforme 8 su tutti i lati (concentrico: 16 − 8 = raggio immagine 8)
  },
  rowInner: {
    marginVertical: 0,
  },
  content: {
    justifyContent: "flex-start", // titolo + rarità partono dall'alto (Paper le centra)
  },
  descRow: {
    flexDirection: "row",
    gap: Spacing.three,
  },
  descCol: {
    flexShrink: 1,
  },
  thumb: {
    width: 120,
    height: 120, // artwork cropped 1:1
    borderRadius: Spacing.two,
    alignSelf: "center",
  },
  right: {
    justifyContent: "flex-start",
    marginRight: -6, // annulla il margin:6 built-in dell'IconButton → allineato all'inset 8
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
  },
});
