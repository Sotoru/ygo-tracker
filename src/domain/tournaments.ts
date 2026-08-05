import { PLACEMENTS, type Placement, type Tournament } from './types';

export const PLACEMENT_LIST = Object.keys(PLACEMENTS) as Placement[];

export function tournamentYear(tournament: Pick<Tournament, 'date'>) {
  return tournament.date.slice(0, 4);
}

export function formatTournamentDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export function placementLabel(placement: Placement) {
  return PLACEMENTS[placement]?.label ?? placement;
}
