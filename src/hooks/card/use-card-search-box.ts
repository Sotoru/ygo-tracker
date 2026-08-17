// Casella di ricerca carte con debounce: identica nella Wishlist e nell'edit mode
// del Deck. Il debounce è il punto: senza, ogni tasto è una richiesta a YGOPRODeck.
import { useEffect, useState } from 'react';

import { useCardSearch } from '@/hooks/card/use-cards';

const DEBOUNCE_MS = 350; // rispetta il rate limit di YGOPRODeck

export function useCardSearchBox() {
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching, isError } = useCardSearch(debounced);

  const clear = () => {
    setQuery('');
    setDebounced('');
  };

  return { query, setQuery, debounced, searching: query.trim().length > 0, results, isFetching, isError, clear };
}
