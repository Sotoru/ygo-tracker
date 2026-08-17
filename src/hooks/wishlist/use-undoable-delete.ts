// Elimina con undo: la carta sparisce subito dalla lista, ma la DELETE reale parte
// solo quando la Snackbar si chiude SENZA "Annulla". Paper chiama onDismiss anche
// premendo l'azione (Snackbar.tsx) → distinguo con undoRef.
import { useRef, useState } from 'react';

export function useUndoableDelete(remove: (cardId: number) => void) {
  const [pending, setPending] = useState<{ cardId: number; name: string } | null>(null);
  const undoRef = useRef(false);
  const [lastName, setLastName] = useState(''); // tiene il nome durante il fade-out (pending è già null)

  const ask = (cardId: number, name: string) => {
    // un pendente alla volta: se ne era in coda un altro, lo confermo subito
    if (pending && pending.cardId !== cardId) remove(pending.cardId);
    undoRef.current = false;
    setLastName(name);
    setPending({ cardId, name });
  };

  /** onDismiss della Snackbar: scatta sia al timeout sia sull'azione. */
  const close = () => {
    if (!undoRef.current && pending) remove(pending.cardId);
    undoRef.current = false;
    setPending(null);
  };

  const undo = () => {
    undoRef.current = true;
  };

  return { pending, lastName, ask, close, undo };
}
