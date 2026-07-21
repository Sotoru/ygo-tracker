// Cella carta per la vista griglia, presentazionale: immagine grande in alto,
// nome + una o più righe "rarità ×N" sotto, e le stesse azioni della lista come
// slot trailing (children) in fondo. Stesse props della CardRow: cambia solo
// l'impaginazione (verticale invece che orizzontale). La larghezza responsive
// (flexWrap) la decide il contenitore, non la cella.
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { cardImageUrl } from '@/data/ygoprodeck';

export function CardCell({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  owned,
  showTitle = true,
  onPress,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità; ha priorità su rarity/count
  owned?: boolean;
  showTitle?: boolean; // false = solo immagine (+ eventuali righe), niente nome
  onPress?: () => void; // tap sull'immagine → apre il dettaglio (assente = non tappabile)
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const lines =
    subtitle ?? (rarity ? [`${rarity}${count ? ` ×${count}` : ''}`] : ['Nessuna stampa']);

  return (
    <View style={[styles.cell, { backgroundColor: colors.surfaceVariant }]}>
      {imageUrl ? (
        <Pressable onPress={onPress} disabled={!onPress} accessibilityLabel={onPress ? `Dettaglio ${name}` : undefined}>
          <Image
            source={{ uri: cardImageUrl(imageUrl, { width: 300 }) }}
            style={styles.image}
            contentFit="contain"
          />
        </Pressable>
      ) : (
        <View style={styles.image} />
      )}

      {showTitle ? (
        <View style={styles.titleRow}>
          <Text numberOfLines={2} variant="titleMedium" style={styles.name}>
            {name}
          </Text>
          {owned ? <Icon source="check-circle" size={16} color={colors.primary} /> : null}
        </View>
      ) : null}

      {lines.map((line, i) => (
        <Text
          key={i}
          variant="bodySmall"
          numberOfLines={1}
          style={{ color: colors.onSurfaceVariant }}>
          {line}
        </Text>
      ))}

      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cell: {
    // larghezza decisa dal genitore (numero di colonne); flex:1 riempie l'altezza
    // dello slot, che la riga stira alla carta più alta → stessa altezza per riga
    width: '100%',
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.two,
  },
  image: {
    width: '100%',
    aspectRatio: 1, // artwork cropped 624×624 (1:1)
    borderRadius: Spacing.two, // raggio annidato: card (three) − padding (two)
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  name: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end', // btn a destra in griglia
    marginTop: 'auto', // spinge le azioni in fondo → allineate tra carte della stessa riga
  },
});
