// Zona "naturale" di una Card dal suo frameType YGOPRODeck: i mostri Extra Deck
// (Fusion / Synchro / Xyz / Link, inclusi i loro Pendulum, es. "xyz_pendulum")
// vanno in extra, tutto il resto in main. Il side è una scelta dell'utente, non
// inferibile dal tipo (vedi types.ts: "la zona è IN PARTE determinata dal tipo").
import type { CardType, Zone } from '@/domain/types';

/** I sotto-tipi dell'Extra Deck nell'ordine in cui si presentano (come in un file .ydk). */
export const EXTRA_TYPES = ['fusion', 'synchro', 'xyz', 'link'] as const;
export type ExtraType = (typeof EXTRA_TYPES)[number];

const EXTRA = new RegExp(EXTRA_TYPES.join('|'), 'i');

/** true se la Card appartiene all'Extra Deck (in base al frameType). */
export function isExtraDeck(frameType: string): boolean {
  return EXTRA.test(frameType);
}

/** Zona suggerita all'aggiunta: extra per i mostri Extra Deck, altrimenti main. */
export function suggestedZone(frameType: string): Zone {
  return isExtraDeck(frameType) ? 'extra' : 'main';
}

/** Card Type (vedi CONTEXT.md): spell/trap sono frame a sé, tutto il resto è mostro. */
export function cardType(frameType: string): CardType {
  const t = frameType.toLowerCase();
  return t === 'spell' || t === 'trap' ? t : 'monster';
}

/**
 * Sotto-tipo Extra Deck dal frameType, per suddividere la zona Extra come il Main si
 * suddivide per Card Type. Le varianti pendulum ricadono nel loro tipo
 * ("xyz_pendulum" → xyz). `undefined` se il frame non è dell'Extra Deck.
 */
export function extraType(frameType: string): ExtraType | undefined {
  const t = frameType.toLowerCase();
  return EXTRA_TYPES.find((x) => t.includes(x));
}
