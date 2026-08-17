// Cella carta per la vista griglia, presentazionale: immagine grande in alto,
// nome + una o più righe "rarità ×N" sotto, e le stesse azioni della lista come
// slot trailing (children) in fondo. Stesse props della CardRow: cambia solo
// l'impaginazione (verticale invece che orizzontale). La larghezza responsive
// (flexWrap) la decide il contenitore, non la cella.
import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { Icon, Text, useTheme } from "react-native-paper";

import { Spacing } from "@/constants/theme";
import { cardImageUrl } from "@/data/ygoprodeck";

import { frameHue, frameTint } from "./frame-tint";

// Artwork 1:1. Senza url resta il riquadro vuoto: la cella non cambia altezza.
function Artwork({
  imageUrl,
  name,
  onPress,
}: {
  imageUrl?: string;
  name: string;
  onPress?: () => void;
}) {
  if (!imageUrl) return <View style={styles.image} />;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={onPress ? `Dettaglio ${name}` : undefined}
    >
      <Image
        source={{ uri: cardImageUrl(imageUrl, { width: 300 }) }}
        style={styles.image}
        contentFit="contain"
      />
    </Pressable>
  );
}

// Pillola in alto a sinistra sull'artwork (es. "×2").
function Badge({
  label,
  count,
  frameType,
  opacity,
}: {
  label: string;
  count?: number;
  frameType?: string;
  opacity: number;
}) {
  const { colors } = useTheme();
  return (
    <View
      style={styles.badge}
      accessibilityLabel={count ? `${count} copie` : undefined}
    >
      {/* sfondo come layer a sé: l'opacity vale solo qui, il testo resta pieno.
          Tinta del frame piena = stesso colore della cella (che è al 20%) più scuro. */}
      <View
        style={[
          styles.badgeBg,
          {
            backgroundColor: frameHue(frameType) ?? colors.onSurfaceVariant,
            opacity,
          },
        ]}
      />
      {/* bianco fisso: le hue del frame non vengono dal tema, quindi non cambiano
          con chiaro/scuro e il contrasto migliore è sempre lo stesso */}
      <Text variant="labelMedium" style={styles.badgeText}>
        {label}
      </Text>
    </View>
  );
}

// Righe sotto il nome: `subtitle` se il chiamante le ha già pronte (una per rarità),
// altrimenti la singola riga rarità ×N. Niente di nessuno dei due = nessuna riga:
// il messaggio "Nessuna stampa" lo passa chi lo vuole (la ricerca in wishlist), non
// lo indovina la cella — nei deck e nelle banlist la rarità non c'entra.
const metaLines = (subtitle: string[] | undefined, rarity: string | undefined, count: number | undefined) => {
  if (subtitle) return subtitle;
  if (!rarity) return [];
  return [count ? `${rarity} ${count}x` : rarity];
};

// Nome (con la spunta "posseduta") e le righe di dettaglio sotto l'artwork.
function CardMeta({
  name,
  showTitle,
  owned,
  lines,
  nameLines,
}: {
  name: string;
  showTitle: boolean;
  owned?: boolean;
  lines: string[];
  nameLines: number;
}) {
  const { colors } = useTheme();
  return (
    <>
      {showTitle ? (
        <View style={styles.titleRow}>
          <Text numberOfLines={nameLines} variant="titleMedium" style={styles.name}>
            {name}
          </Text>
          {owned ? (
            <Icon source="check-circle" size={16} color={colors.primary} />
          ) : null}
        </View>
      ) : null}
      {lines.map((line, i) => (
        <Text
          key={i}
          variant="bodySmall"
          numberOfLines={1}
          style={{ color: colors.onSurfaceVariant }}
        >
          {line}
        </Text>
      ))}
    </>
  );
}

export function CardCell({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  badge,
  badgeOpacity = 0.6,
  topRight,
  owned,
  frameType,
  showTitle = true,
  nameLines = 2,
  onPress,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità; ha priorità su rarity/count
  badge?: string; // pillola in alto a sinistra sull'artwork (es. "×2"); assente = niente pillola
  badgeOpacity?: number; // opacità del solo sfondo della pillola (il testo resta pieno)
  topRight?: React.ReactNode; // slot in alto a destra sull'artwork (es. stella copertina)
  owned?: boolean;
  frameType?: string; // frameType YGOPRODeck → sfondo per tipo carta; assente = neutro del tema
  showTitle?: boolean; // false = solo immagine (+ eventuali righe), niente nome
  nameLines?: number; // righe del nome prima del troncamento; 3 dove non c'è didascalia (ricerca)
  onPress?: () => void; // tap sull'immagine → apre il dettaglio (assente = non tappabile)
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const background = frameTint(frameType) ?? colors.surfaceVariant;

  return (
    <View style={[styles.cell, { backgroundColor: background }]}>
      <View>
        <Artwork imageUrl={imageUrl} name={name} onPress={onPress} />
        {badge ? (
          <Badge
            label={badge}
            count={count}
            frameType={frameType}
            opacity={badgeOpacity}
          />
        ) : null}
        {topRight ? <View style={styles.topRight}>{topRight}</View> : null}
      </View>

      <CardMeta
        name={name}
        showTitle={showTitle}
        owned={owned}
        lines={metaLines(subtitle, rarity, count)}
        nameLines={nameLines}
      />

      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    // larghezza decisa dal genitore (numero di colonne); flex:1 riempie l'altezza
    // dello slot, che la riga stira alla carta più alta → stessa altezza per riga
    width: "100%",
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  image: {
    width: "100%",
    aspectRatio: 1, // artwork cropped 624×624 (1:1)
    borderRadius: Spacing.two, // raggio annidato: card (three) − padding (two)
  },
  badge: {
    position: "absolute",
    top: Spacing.one,
    left: Spacing.one,
    minWidth: 30,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Spacing.two,
    alignItems: "center",
  },
  badgeText: {
    color: "#FFF",
    fontWeight: "bold",
  },
  badgeBg: {
    position: "absolute",
    inset: 0,
    borderRadius: Spacing.two, // stesso raggio della pillola
  },
  topRight: {
    position: "absolute",
    top: Spacing.one, // stesso inset del badge in alto a sinistra → simmetrici
    right: Spacing.one,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-end", // btn a destra in griglia
    marginTop: "auto", // spinge le azioni in fondo → allineate tra carte della stessa riga
  },
});
