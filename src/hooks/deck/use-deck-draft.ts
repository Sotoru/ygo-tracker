// Bozza locale dell'edit mode di un deck: lo stepper deve essere istantaneo, quindi
// le modifiche vivono qui e si scrivono in blocco al Salva (replaceDeckEntries).
// Le carte aggiunte da ricerca passano da `staging` (in attesa di zona) prima di
// entrare nella bozza: finché lo staging non è vuoto non si può salvare.
import { useState } from 'react';

import type { YgoCard } from '@/data/ygoprodeck';
import type { DeckEntryInput, Zone } from '@/domain/types';

export const MAX_COPIES = 3; // regola copie YGO nello stepper (il DB resta permissivo 1..9)

export function useDeckDraft(entries: DeckEntryInput[]) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeckEntryInput[]>([]);
  const [staging, setStaging] = useState<number[]>([]); // cardId aggiunte, in attesa di zona
  const [extraCards, setExtraCards] = useState<Map<number, YgoCard>>(new Map()); // carte da ricerca

  const enter = () => {
    setDraft(entries.map((e) => ({ cardId: e.cardId, zone: e.zone, count: e.count })));
    setStaging([]);
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setStaging([]);
  };

  const add = (card: YgoCard) => {
    setExtraCards((m) => (m.has(card.id) ? m : new Map(m).set(card.id, card)));
    setStaging((s) => (s.includes(card.id) ? s : [...s, card.id]));
  };

  const assign = (cardId: number, zone: Zone) => {
    setDraft((d) => {
      const i = d.findIndex((e) => e.cardId === cardId && e.zone === zone);
      if (i < 0) return [...d, { cardId, zone, count: 1 }];
      const next = [...d];
      next[i] = { ...next[i], count: Math.min(MAX_COPIES, next[i].count + 1) }; // già presente → incrementa
      return next;
    });
    setStaging((s) => s.filter((c) => c !== cardId));
  };

  const bump = (cardId: number, zone: Zone, delta: number) =>
    setDraft((d) =>
      d.map((e) =>
        e.cardId === cardId && e.zone === zone
          ? { ...e, count: Math.min(MAX_COPIES, Math.max(1, e.count + delta)) } // − ferma a 1, + cappa a 3
          : e,
      ),
    );

  const remove = (cardId: number, zone: Zone) =>
    setDraft((d) => d.filter((e) => !(e.cardId === cardId && e.zone === zone)));

  return { editing, draft, staging, extraCards, enter, cancel, add, assign, bump, remove };
}

export type DeckDraft = ReturnType<typeof useDeckDraft>;
