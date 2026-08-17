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
import { useBreakpoint } from "@/hooks/shared/use-layout";

import { frameTint } from "./frame-tint";

// spezza le righe in colonne da `size`: [a,b,c,d,e] → [[a,b,c,d],[e]]
const chunk = <T,>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// separa il conteggio finale " ×N" dal nome, così il ×N resta sempre visibile e
// a troncare è il nome. Riga senza conteggio (es. "Ultra Rare") → count assente.
const splitCount = (line: string): { name: string; count?: string } => {
  const m = line.match(/^(.*?)\s(\d+x)$/);
  return m ? { name: m[1], count: m[2] } : { name: line };
};

export function CardRow({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  owned,
  frameType,
  nameLines = 2,
  onPress,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità (es. ["Ultra Rare ×2", "Secret Rare ×1"]); ha priorità su rarity/count
  owned?: boolean; // mostra il segno "Presa" (check-circle) accanto al nome
  frameType?: string; // frameType YGOPRODeck → sfondo per tipo carta; assente = neutro del tema
  nameLines?: number; // righe del nome prima del troncamento; 3 dove non c'è didascalia (ricerca)
  onPress?: () => void; // tap sull'immagine → apre il dettaglio (assente = non tappabile)
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const background = frameTint(frameType) ?? colors.surfaceVariant;
  // niente subtitle né rarity = nessuna riga: "Nessuna stampa" lo passa chi lo vuole
  // (vedi metaLines in card-cell, stesso contratto).
  const lines =
    subtitle ?? (rarity ? [`${rarity}${count ? ` ${count}x` : ""}`] : []);
  // Su schermo stretto le colonne da 4 troncano le rarità ("Ultra Rare ×2" → "Ultra…"):
  // su phone le impilo tutte in un'unica colonna a piena larghezza.
  const narrow = useBreakpoint() === "phone";
  const cols = narrow ? [lines] : chunk(lines, 4);

  return (
    <List.Item
      title={
        owned
          ? (props) => (
              <View style={styles.titleRow}>
                <Text {...props} numberOfLines={nameLines} variant="titleLarge">
                  {name}
                </Text>
                <Icon source="check-circle" size={16} color={colors.primary} />
              </View>
            )
          : name
      }
      titleNumberOfLines={nameLines}
      // una Text per riga (numberOfLines={1}): ogni rarità sta su una riga e
      // tronca con "…" se troppo lunga; la List.Item cresce in altezza da sola.
      description={({ color, ellipsizeMode }) => (
        // ogni 4 righe una colonna, colonne affiancate
        <View style={styles.descRow}>
          {cols.map((col, ci) => (
            <View key={ci} style={styles.descCol}>
              {col.map((line, i) => {
                const { name, count } = splitCount(line);
                return (
                  // ×N fisso all'inizio + nome che tronca in coda (numberOfLines 1)
                  <View key={i} style={styles.line}>
                    {count ? (
                      <Text variant="bodyMedium" style={[styles.lineCount, { color }]}>
                        {`${count} `}
                      </Text>
                    ) : null}
                    <Text
                      variant="bodyMedium"
                      numberOfLines={1}
                      ellipsizeMode={ellipsizeMode}
                      style={[styles.lineName, { color }]}
                    >
                      {name}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
      style={[styles.row, { backgroundColor: background }]}
      // Paper aggiunge marginVertical:6 alla riga → lo azzero per un inset uniforme
      containerStyle={styles.rowInner}
      contentStyle={styles.content}
      left={() =>
        imageUrl ? (
          <Pressable
            onPress={onPress}
            disabled={!onPress}
            accessibilityLabel={onPress ? `Dettaglio ${name}` : undefined}
            style={styles.thumb}>
            <Image
              source={{ uri: cardImageUrl(imageUrl, { width: 260 }) }}
              style={styles.thumbImage}
              contentFit="cover"
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
  line: {
    flexDirection: "row",
    alignItems: "baseline", // nome + ×N sulla stessa linea di base
    flexWrap: "nowrap", // il ×N non deve mai andare a capo
  },
  lineName: {
    flexShrink: 1, // solo il nome si comprime/tronca…
    minWidth: 0, // …e su web deve poter scendere sotto la larghezza del contenuto
  },
  lineCount: {
    flexShrink: 0, // il ×N resta sempre intero e sulla stessa riga
  },
  thumb: {
    width: 120, // larghezza fissa
    minHeight: 120, // pavimento (artwork cropped 1:1); alignSelf stretch la fa crescere
    // con l'altezza della riga (row Paper senza alignItems → stretch di default)
    alignSelf: "stretch",
    borderRadius: Spacing.two,
    overflow: "hidden", // il cover rispetta gli angoli arrotondati
  },
  thumbImage: {
    flex: 1, // riempie l'altezza del box; contentFit cover ritaglia senza stirare
    width: "100%",
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
