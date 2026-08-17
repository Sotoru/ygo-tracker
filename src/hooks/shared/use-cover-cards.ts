// Artwork di copertina per una lista di cose che hanno una copertina: un solo
// batch-fetch per tutta la lista, invece di una richiesta per riga. Sta in shared/
// perché lo usano due feature — la lista dei Deck e il dettaglio di un Tournament —
// e non conosce nessun tipo del deck: gli basta `coverCardId`.
import { useMemo } from 'react';

import { useCardsByIds } from '@/hooks/card/use-cards';

type HasCover = { coverCardId: number | null };

export function useCoverCards(items: HasCover[] | undefined) {
  const ids = useMemo(
    () => [...new Set((items ?? []).map((d) => d.coverCardId).filter((id): id is number => id != null))],
    [items],
  );
  const { data: covers = [], isLoading: coversLoading } = useCardsByIds(ids);
  const coverById = useMemo(() => new Map(covers.map((c) => [c.id, c])), [covers]);

  const coverUrl = (item: HasCover) =>
    (item.coverCardId != null ? coverById.get(item.coverCardId) : undefined)?.card_images[0]?.image_url_cropped;

  return { coverUrl, coversLoading };
}
