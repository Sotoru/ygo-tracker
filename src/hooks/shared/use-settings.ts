// Impostazioni dell'app, persistite cross-platform. Primo (e per ora unico)
// campo: cardView, come la Wishlist mostra le carte. Store Zustand generico:
// aggiungere un setting = un campo + il suo setter. Le opzioni di cardView sono
// un array per accettare nuovi valori in futuro (una voce = una riga).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type CardView = 'list' | 'grid';

export const CARD_VIEW_OPTIONS: { value: CardView; label: string }[] = [
  { value: 'list', label: 'Lista' },
  { value: 'grid', label: 'Griglia' },
];

// Colonne desiderate per la griglia banlist (ceiling): la schermata mostra
// min(scelta, quante ci stanno).
export const BANLIST_COLUMN_OPTIONS = [4, 5, 6, 7] as const;

type Settings = {
  cardView: CardView;
  setCardView: (view: CardView) => void;
  banlistColumns: number;
  setBanlistColumns: (n: number) => void;
  banlistShowTitles: boolean;
  setBanlistShowTitles: (show: boolean) => void;
  rarityShort: boolean;
  setRarityShort: (short: boolean) => void;
  groupRows: boolean;
  setGroupRows: (on: boolean) => void;
  sortByCopies: boolean;
  setSortByCopies: (on: boolean) => void;
  groupByFormat: boolean;
  setGroupByFormat: (on: boolean) => void;
  frameTint: boolean;
  setFrameTint: (on: boolean) => void;
};

// Web: localStorage (sincrono → idrata prima del paint, niente flash), guardato
// per lo static render dove window non esiste. Native: AsyncStorage (async).
const storage = createJSONStorage<
  Pick<
    Settings,
    | 'cardView'
    | 'banlistColumns'
    | 'banlistShowTitles'
    | 'rarityShort'
    | 'groupRows'
    | 'sortByCopies'
    | 'groupByFormat'
    | 'frameTint'
  >
>(
  () =>
  Platform.OS === 'web'
    ? typeof window !== 'undefined'
      ? window.localStorage
      : (undefined as never)
    : AsyncStorage
);

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      cardView: 'list',
      setCardView: (cardView) => set({ cardView }),
      banlistColumns: 6,
      setBanlistColumns: (banlistColumns) => set({ banlistColumns }),
      banlistShowTitles: true,
      setBanlistShowTitles: (banlistShowTitles) => set({ banlistShowTitles }),
      rarityShort: false,
      setRarityShort: (rarityShort) => set({ rarityShort }),
      groupRows: false, // default = griglia continua dentro la zona, il look storico
      setGroupRows: (groupRows) => set({ groupRows }),
      sortByCopies: false,
      setSortByCopies: (sortByCopies) => set({ sortByCopies }),
      groupByFormat: false, // default = lista piatta per updated_at, il look storico
      setGroupByFormat: (groupByFormat) => set({ groupByFormat }),
      frameTint: true, // acceso: nella Wishlist il tipo carta si legge dal colore, come nei deck
      setFrameTint: (frameTint) => set({ frameTint }),
    }),
    {
      name: 'settings',
      storage,
      // solo dati, mai i setter
      partialize: (s) => ({
        cardView: s.cardView,
        banlistColumns: s.banlistColumns,
        banlistShowTitles: s.banlistShowTitles,
        rarityShort: s.rarityShort,
        groupRows: s.groupRows,
        sortByCopies: s.sortByCopies,
        groupByFormat: s.groupByFormat,
        frameTint: s.frameTint,
      }),
    }
  )
);
