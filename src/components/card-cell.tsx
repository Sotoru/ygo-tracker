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

import { frameTint } from './frame-tint';

export function CardCell({
  name,
  imageUrl,
  rarity,
  count,
  subtitle,
  badge,
  topRight,
  owned,
  frameType,
  showTitle = true,
  onPress,
  children,
}: {
  name: string;
  imageUrl?: string;
  rarity?: string;
  count?: number;
  subtitle?: string[]; // righe già pronte, una per rarità; ha priorità su rarity/count
  badge?: string; // pillola in alto a sinistra sull'artwork (es. "×2"); assente = niente pillola
  topRight?: React.ReactNode; // slot in alto a destra sull'artwork (es. stella copertina)
  owned?: boolean;
  frameType?: string; // frameType YGOPRODeck → sfondo per tipo carta; assente = neutro del tema
  showTitle?: boolean; // false = solo immagine (+ eventuali righe), niente nome
  onPress?: () => void; // tap sull'immagine → apre il dettaglio (assente = non tappabile)
  children?: React.ReactNode;
}) {
  const { colors } = useTheme();
  const lines =
    subtitle ?? (rarity ? [`${rarity}${count ? ` ${count}x` : ''}`] : ['Nessuna stampa']);
  const background = frameTint(frameType) ?? colors.surfaceVariant;

  return (
    <View style={[styles.cell, { backgroundColor: background }]}>
      <View>
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
        {badge ? (
          <View
            style={[styles.badge, { backgroundColor: colors.primaryContainer }]}
            accessibilityLabel={count ? `${count} copie` : undefined}>
            <Text variant="labelMedium" style={{ color: colors.onPrimaryContainer, fontWeight: 'bold' }}>
              {badge}
            </Text>
          </View>
        ) : null}
        {topRight ? <View style={styles.topRight}>{topRight}</View> : null}
      </View>

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
  badge: {
    position: 'absolute',
    top: Spacing.one,
    left: Spacing.one,
    minWidth: 24,
    paddingHorizontal: Spacing.one,
    paddingVertical: 1,
    borderRadius: Spacing.two,
    alignItems: 'center',
  },
  topRight: {
    position: 'absolute',
    top: Spacing.one, // stesso inset del badge in alto a sinistra → simmetrici
    right: Spacing.one,
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
