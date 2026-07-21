// QueryClient + persistenza su AsyncStorage (una sola API KV, web + native).
// I dati carta cambiano di rado (YGOPRODeck cacha 2 giorni server-side) → cache lunga,
// così rispettiamo anche il "store data locally" del loro rate limit.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { defaultShouldDehydrateQuery, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';

const DAY = 1000 * 60 * 60 * 24;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DAY, // non rifetchare entro 24h
      gcTime: DAY * 7, // >= maxAge del persister (default 24h)
      retry: 2,
    },
  },
});

export const persister = createAsyncStoragePersister({ storage: AsyncStorage });

// La cache persistita è pensata per i DATI CARTA stabili (byId/byIds). Le ricerche
// per nome sono effimere: NON persisterle, altrimenti un risultato vuoto resta
// "fresco" per 24h e maschera il fallback di searchCardsByName (es. "blue eye").
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  dehydrateOptions: {
    shouldDehydrateQuery: (query) =>
      defaultShouldDehydrateQuery(query) &&
      !(query.queryKey[0] === 'cards' && query.queryKey[1] === 'search'),
  },
};
