// Dalle voci di un deck alle sezioni disegnabili: batch-fetch delle carte per id
// (una richiesta) + suddivisione via deckSections con le preferenze globali di vista.
// Condiviso da /deck/[id] e /tournament-decks/[id]: erano la stessa sequenza di
// quattro useMemo copiata due volte. Le copertine di una lista stanno invece in
// hooks/shared/use-cover-cards (le usa anche il dettaglio Tournament).
import { useMemo } from 'react';

import type { YgoCard } from '@/data/ygoprodeck';
import { deckSections } from '@/domain/deck-sections';
import type { Zone } from '@/domain/types';
import { useCardsByIds } from '@/hooks/card/use-cards';
import { useSettings } from '@/hooks/shared/use-settings';

export function useDeckCards<T extends { cardId: number; zone: Zone; count: number }>(entries: T[]) {
  const ids = useMemo(() => [...new Set(entries.map((e) => e.cardId))], [entries]);
  const { data: cards = [], isLoading: cardsLoading } = useCardsByIds(ids);
  const byId = useMemo(() => new Map<number, YgoCard>(cards.map((c) => [c.id, c])), [cards]);

  // preferenze globali (Impostazioni → Deck), persistite
  const groupRows = useSettings((s) => s.groupRows);
  const sortByCopies = useSettings((s) => s.sortByCopies);
  const sections = deckSections(entries, (cardId) => byId.get(cardId)?.frameType, { groupRows, sortByCopies });

  return { byId, cardsLoading, sections };
}
