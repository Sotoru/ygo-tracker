// Admin catalogo tornei: permesso editoriale via allowlist client + RLS lato DB.
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Appbar, Button, Chip, Dialog, HelperText, List, Portal, Text, TextInput, useTheme } from 'react-native-paper';

import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, Spacing, dialogWidth } from '@/constants/theme';
import { isAdminSession, useSession } from '@/data/auth';
import { formatTournamentDate } from '@/domain/tournaments';
import { FORMATS, type Format } from '@/domain/types';
import { useAdminTournaments, useCreateTournament } from '@/hooks/use-tournaments';

const FORMAT_LIST = Object.keys(FORMATS) as Format[];

export default function AdminTournamentsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { data: session } = useSession();
  const isAdmin = isAdminSession(session);
  const { data: tournaments = [], isLoading, isError } = useAdminTournaments(isAdmin);
  const create = useCreateTournament();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [format, setFormat] = useState<Format>('goat');

  async function onCreate() {
    const tournament = await create.mutateAsync({ name: name.trim(), date: date.trim(), location: location.trim() || null, format });
    setOpen(false);
    setName('');
    setLocation('');
    router.push({ pathname: '/admin/tournaments/[id]', params: { id: tournament.id } });
  }

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace('/deck'))} />
        <Appbar.Content title="Admin tornei" />
        {isAdmin ? <Appbar.Action icon="plus" accessibilityLabel="Nuovo torneo" onPress={() => setOpen(true)} /> : null}
      </Appbar.Header>

      <Portal>
        <Dialog visible={open} onDismiss={() => setOpen(false)} style={dialogWidth}>
          <Dialog.Title>Nuovo torneo</Dialog.Title>
          <Dialog.Content>
            <View style={styles.form}>
              <TextInput label="Nome" value={name} onChangeText={setName} mode="outlined" />
              <TextInput label="Data (YYYY-MM-DD)" value={date} onChangeText={setDate} mode="outlined" />
              <TextInput label="Location" value={location} onChangeText={setLocation} mode="outlined" />
              <View style={styles.chips}>
                {FORMAT_LIST.map((f) => <Chip key={f} selected={format === f} showSelectedOverlay onPress={() => setFormat(f)}>{FORMATS[f].label}</Chip>)}
              </View>
              {create.isError ? <HelperText type="error" visible>{(create.error as { message?: string })?.message ?? 'Errore nel salvataggio.'}</HelperText> : null}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setOpen(false)}>Annulla</Button>
            <Button disabled={!name.trim() || !date.trim() || create.isPending} loading={create.isPending} onPress={onCreate}>Crea</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {!isAdmin ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Accesso riservato admin.</Text>
      ) : isLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>Errore di rete. Riprova.</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {tournaments.map((tournament) => (
            <List.Item
              key={tournament.id}
              title={tournament.name}
              description={[formatTournamentDate(tournament.date), tournament.location, FORMATS[tournament.format]?.label, `${tournament.publishedDeckCount} published`].filter(Boolean).join(' · ')}
              left={(props) => <List.Icon {...props} icon="trophy" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => router.push({ pathname: '/admin/tournaments/[id]', params: { id: tournament.id } })}
              style={[styles.row, { backgroundColor: colors.surfaceVariant }]}
            />
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { ...cappedWidth, backgroundColor: 'transparent' },
  content: { ...contentContainer, paddingBottom: Spacing.six, gap: Spacing.two },
  form: { gap: Spacing.three },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  row: { borderRadius: Spacing.three, marginBottom: Spacing.two },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
