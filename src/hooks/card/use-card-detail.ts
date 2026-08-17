// Dialog di dettaglio carta, globale: la carta selezionata vive qui così ogni
// schermata la apre con open(card) e il Dialog (montato una volta nel root
// layout) la mostra. Stato UI effimero → niente persist. Vedi CardDetailDialog.
import { create } from 'zustand';

import type { YgoCard } from '@/data/ygoprodeck';

type CardDetail = {
  detailCard: YgoCard | null;
  open: (card: YgoCard) => void;
  close: () => void;
};

export const useCardDetail = create<CardDetail>((set) => ({
  detailCard: null,
  open: (detailCard) => set({ detailCard }),
  close: () => set({ detailCard: null }),
}));
