// Deck come server state: TanStack Query sopra il repository Neon (Data API).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { decks as repository } from '@/data/store';
import type { DeckEntryInput, Format } from '@/domain/types';

const KEY = ['decks'] as const;

export function useDecks() {
  return useQuery({ queryKey: KEY, queryFn: () => repository.getDecks() });
}

export function useDeck(id: string | undefined) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => repository.getDeck(id!),
    enabled: id != null,
  });
}

export function useCreateDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; format: Format; entries?: DeckEntryInput[] }) =>
      repository.createDeck(v.name, v.format, v.entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetDeckName() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { deckId: string; name: string }) => repository.setDeckName(v.deckId, v.name),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, v.deckId] });
    },
  });
}

// Sorgente unica per il Salva dell'editor e per il re-import .ydk (vedi replaceDeckEntries).
export function useReplaceDeckEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { deckId: string; entries: DeckEntryInput[] }) =>
      repository.replaceDeckEntries(v.deckId, v.entries),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, v.deckId] });
    },
  });
}

export function useSetDeckCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { deckId: string; cardId: number | null }) =>
      repository.setDeckCover(v.deckId, v.cardId),
    // la lista mostra la copertina risolta, il dettaglio la scelta esplicita: invalido entrambi
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, v.deckId] });
    },
  });
}

export function useSetDeckFormat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { deckId: string; format: Format }) =>
      repository.setDeckFormat(v.deckId, v.format),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, v.deckId] });
    },
  });
}

export function useSetDeckPublic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { deckId: string; isPublic: boolean }) =>
      repository.setDeckPublic(v.deckId, v.isPublic),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: [...KEY, v.deckId] });
    },
  });
}

export function useDeleteDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deleteDeck(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
