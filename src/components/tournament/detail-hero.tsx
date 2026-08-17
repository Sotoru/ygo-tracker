// Pannello di testa dei dettagli torneo / deck da torneo: titolo grande e una riga
// di metadati separati da " · ". Le voci assenti cadono, così il separatore non
// rimane appeso.
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

export function DetailHero({
  title,
  meta,
  children,
}: {
  title: string;
  meta: (string | null | undefined)[];
  children?: ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.hero, { backgroundColor: colors.surfaceVariant }]}>
      <Text variant="headlineSmall">{title}</Text>
      <Text variant="bodyMedium" style={{ color: colors.onSurfaceVariant }}>
        {meta.filter(Boolean).join(' · ')}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.one },
});
