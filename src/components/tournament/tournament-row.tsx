// Riga di un torneo in lista: stessa forma nel catalogo pubblico e in admin, cambia
// solo la coda della descrizione ("N deck" / "N published") e dove porta il tap.
import { StyleSheet } from 'react-native';
import { List, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';
import { formatTournamentDate } from '@/domain/tournaments';
import { FORMATS, type Tournament } from '@/domain/types';

export function TournamentRow({
  tournament,
  countLabel,
  onPress,
}: {
  tournament: Tournament;
  countLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <List.Item
      title={tournament.name}
      description={[formatTournamentDate(tournament.date), tournament.location, FORMATS[tournament.format]?.label, countLabel]
        .filter(Boolean)
        .join(' · ')}
      left={(props) => <List.Icon {...props} icon="trophy" />}
      right={(props) => <List.Icon {...props} icon="chevron-right" />}
      onPress={onPress}
      style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
    />
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: Spacing.three, marginBottom: Spacing.two },
});
