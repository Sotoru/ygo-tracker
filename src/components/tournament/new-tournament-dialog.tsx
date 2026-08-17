// Dialog "Nuovo torneo": tiene il proprio form, la schermata admin resta con la sola
// lista. Il torneo creato torna al chiamante, che decide dove navigare.
import { useState } from 'react';
import { Button, Dialog, HelperText, Portal } from 'react-native-paper';

import {
  canSaveTournament,
  TournamentFields,
  type TournamentFieldsValue,
} from '@/components/tournament/tournament-fields';
import { dialogWidth } from '@/constants/theme';
import type { Tournament } from '@/domain/types';
import { useCreateTournament } from '@/hooks/tournament/use-tournaments';

const emptyForm = (): TournamentFieldsValue => ({
  name: '',
  date: new Date().toISOString().slice(0, 10),
  location: '',
  format: 'goat',
});

export function NewTournamentDialog({
  visible,
  onDismiss,
  onCreated,
}: {
  visible: boolean;
  onDismiss: () => void;
  onCreated: (tournament: Tournament) => void;
}) {
  const create = useCreateTournament();
  const [form, setForm] = useState<TournamentFieldsValue>(emptyForm);

  const onCreate = async () => {
    const tournament = await create.mutateAsync({
      name: form.name.trim(),
      date: form.date.trim(),
      location: form.location.trim() || null,
      format: form.format,
    });
    setForm(emptyForm());
    onCreated(tournament);
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={dialogWidth}>
        <Dialog.Title>Nuovo torneo</Dialog.Title>
        <Dialog.Content>
          <TournamentFields value={form} onChange={setForm} />
          {create.isError ? (
            <HelperText type="error" visible>
              {(create.error as { message?: string })?.message ?? 'Errore nel salvataggio.'}
            </HelperText>
          ) : null}
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Annulla</Button>
          <Button disabled={!canSaveTournament(form) || create.isPending} loading={create.isPending} onPress={onCreate}>
            Crea
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
