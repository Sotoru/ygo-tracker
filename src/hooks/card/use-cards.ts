// Hook di ricerca/lettura carte. Il `cardId` dei risultati è ciò che passi al
// repository (addToWishlist / setDeckEntry).
import { useQuery } from '@tanstack/react-query';

import { BANLISTS } from '@/domain/banlists';
import type { Format } from '@/domain/types';
import { getCardsByIds, getCardsByNames, searchCardsByName } from '@/data/ygoprodeck';

export function useCardSearch(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['cards', 'search', q],
    queryFn: () => searchCardsByName(q),
    enabled: q.length >= 2, // niente fetch per query troppo corte (payload + rate limit)
    // 5 min: deduplica ricerche ripetute (rispetta il "store data locally" di YGOPRODeck).
    // Le ricerche non sono persistite (vedi query-client) → nessun empty "fresco" per 24h.
    staleTime: 1000 * 60 * 5,
  });
}

// Fetch batch delle Card salvate in wishlist (una richiesta). La key è ordinata
// così l'ordine di inserimento non invalida la cache.
export function useCardsByIds(ids: number[]) {
  const key = [...ids].sort((a, b) => a - b);
  return useQuery({
    queryKey: ['cards', 'byIds', key],
    queryFn: () => getCardsByIds(ids),
    enabled: ids.length > 0,
  });
}

// Tutte le Card di una banlist statica in una richiesta (per nome esatto). Dato
// immutabile → staleTime lungo: si scarica una volta e resta in cache.
export function useBanlistCards(format: Format) {
  const names = Object.values(BANLISTS[format]).flat();
  return useQuery({
    queryKey: ['cards', 'banlist', format],
    queryFn: () => getCardsByNames(names),
    staleTime: 1000 * 60 * 60 * 24, // 24h: la banlist non cambia
  });
}
