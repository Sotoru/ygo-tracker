// Wishlist come server state: TanStack Query sopra il repository Neon (Data API).
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { wishlist as repository } from '@/data/store';

const KEY = ['wishlist'] as const;

export function useWishlist() {
  return useQuery({ queryKey: KEY, queryFn: () => repository.getWishlist(), staleTime: 0 });
}

export function useSetWishlistEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: { cardId: number; entries: { rarity: string; count: number }[] }) =>
      repository.setWishlistEntries(e.cardId, e.entries),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useSetObtained() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: { cardId: number; obtained: boolean }) =>
      repository.setObtained(e.cardId, e.obtained),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (cardId: number) => repository.deleteCard(cardId),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
