// Riga di chip per scegliere il format: stesso controllo in 4 schermate (nuovo deck,
// nuovo torneo, admin torneo, filtro tornei pubblici). `allLabel` aggiunge la chip
// "tutti" davanti (filtro) — assente = scelta obbligatoria.
import { StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { FORMAT_LIST, FORMATS, type Format } from '@/domain/types';

export function FormatChips({
  value,
  onChange,
  allLabel,
}: {
  value: Format | undefined;
  onChange: (format: Format | undefined) => void;
  allLabel?: string;
}) {
  return (
    <View style={styles.chips}>
      {allLabel ? (
        <Chip selected={value == null} showSelectedOverlay onPress={() => onChange(undefined)}>
          {allLabel}
        </Chip>
      ) : null}
      {FORMAT_LIST.map((f) => (
        <Chip key={f} selected={value === f} showSelectedOverlay onPress={() => onChange(f)}>
          {FORMATS[f].label}
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
