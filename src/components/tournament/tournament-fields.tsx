// I campi di un torneo: gli stessi nel dialog "nuovo torneo" e nel pannello admin di
// modifica. Un solo oggetto di stato, così il chiamante non tiene quattro useState.
import { StyleSheet, View } from 'react-native';
import { TextInput } from 'react-native-paper';

import { FormatChips } from '@/components/shared/format-chips';
import { Spacing } from '@/constants/theme';
import type { Format } from '@/domain/types';

export type TournamentFieldsValue = { name: string; date: string; location: string; format: Format };

/** Compilabile: nome e data sono gli unici obbligatori (la location è opzionale nel DB). */
export const canSaveTournament = (v: TournamentFieldsValue) => !!v.name.trim() && !!v.date.trim();

export function TournamentFields({
  value,
  onChange,
}: {
  value: TournamentFieldsValue;
  onChange: (value: TournamentFieldsValue) => void;
}) {
  const set = <K extends keyof TournamentFieldsValue>(key: K, v: TournamentFieldsValue[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <View style={styles.fields}>
      <TextInput label="Nome" value={value.name} onChangeText={(v) => set('name', v)} mode="outlined" />
      <TextInput label="Data (YYYY-MM-DD)" value={value.date} onChangeText={(v) => set('date', v)} mode="outlined" />
      <TextInput label="Location" value={value.location} onChangeText={(v) => set('location', v)} mode="outlined" />
      <FormatChips value={value.format} onChange={(f) => f && set('format', f)} />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: Spacing.three },
});
