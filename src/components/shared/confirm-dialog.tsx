// Dialog di conferma: titolo, una frase, Annulla + azione. Le quattro conferme
// dell'app (elimina deck, elimina torneo, reimporta, ripristina carta) erano lo
// stesso blocco con testi diversi.
import type { ReactNode } from 'react';
import { Button, Dialog, Portal, Text } from 'react-native-paper';

import { dialogWidth } from '@/constants/theme';

export function ConfirmDialog({
  visible,
  title,
  confirmLabel,
  loading,
  mode,
  onConfirm,
  onDismiss,
  children,
}: {
  visible: boolean;
  title: string;
  confirmLabel: string;
  loading?: boolean;
  mode?: 'contained'; // default: text, come le azioni MD3 di un dialog
  onConfirm: () => void;
  onDismiss: () => void;
  children: ReactNode; // il testo del corpo, già impaginato dal chiamante
}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={dialogWidth}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text variant="bodyMedium">{children}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Annulla</Button>
          <Button mode={mode} loading={loading} onPress={onConfirm}>
            {confirmLabel}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}
