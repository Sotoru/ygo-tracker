// Tournament come server state: catalogo pubblico + mutazioni admin via repository Neon.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { tournaments as repository } from '@/data/store';
import type { DeckEntryInput, Format, Placement, TournamentDeckStatus } from '@/domain/types';

const KEY = ['tournaments'] as const;
const ADMIN_KEY = ['admin', 'tournaments'] as const;

export function useTournaments(format?: Format) {
  return useQuery({ queryKey: [...KEY, format ?? 'all'], queryFn: () => repository.getTournaments(format) });
}

export function useTournament(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, id], queryFn: () => repository.getTournament(id!), enabled: id != null });
}

export function useTournamentDeck(id: string | undefined) {
  return useQuery({ queryKey: [...KEY, 'deck', id], queryFn: () => repository.getTournamentDeck(id!), enabled: id != null });
}

export function useAdminTournaments(enabled: boolean) {
  return useQuery({ queryKey: ADMIN_KEY, queryFn: () => repository.getAdminTournaments(), enabled });
}

export function useAdminTournament(id: string | undefined, enabled: boolean) {
  return useQuery({ queryKey: [...ADMIN_KEY, id], queryFn: () => repository.getAdminTournament(id!), enabled: enabled && id != null });
}

export function useCreateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { name: string; format: Format; date: string; location?: string | null }) => repository.createTournament(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }),
  });
}

export function useUpdateTournament() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; name: string; format: Format; date: string; location?: string | null }) => repository.updateTournament(v.id, v),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_KEY, v.id] });
      qc.invalidateQueries({ queryKey: [...KEY, v.id] });
    },
  });
}

export function useDeleteTournament() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: string) => repository.deleteTournament(id), onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEY }) });
}

export function useCreateTournamentDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      tournamentId: string;
      name: string;
      format: Format;
      placement: Placement;
      entries: DeckEntryInput[];
      playerName?: string | null;
      coverCardId?: number | null;
      sourceUrl?: string | null;
    }) => repository.createTournamentDeck(v),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: [...ADMIN_KEY, v.tournamentId] });
      qc.invalidateQueries({ queryKey: [...KEY, v.tournamentId] });
    },
  });
}

export function useUpdateTournamentDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: {
      id: string;
      name: string;
      format: Format;
      placement: Placement;
      playerName?: string | null;
      coverCardId?: number | null;
      sourceUrl?: string | null;
    }) => repository.updateTournamentDeck(v.id, v),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useReplaceTournamentDeckEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; entries: DeckEntryInput[] }) => repository.replaceTournamentDeckEntries(v.id, v.entries),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
      qc.invalidateQueries({ queryKey: [...KEY, 'deck', v.id] });
    },
  });
}

export function useSetTournamentDeckStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (v: { id: string; status: TournamentDeckStatus }) => repository.setTournamentDeckStatus(v.id, v.status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}

export function useDeleteTournamentDeck() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repository.deleteTournamentDeck(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ADMIN_KEY });
    },
  });
}
