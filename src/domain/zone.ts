// Zona "naturale" di una Card dal suo frameType YGOPRODeck: i mostri Extra Deck
// (Fusion / Synchro / Xyz / Link, inclusi i loro Pendulum, es. "xyz_pendulum")
// vanno in extra, tutto il resto in main. Il side è una scelta dell'utente, non
// inferibile dal tipo (vedi types.ts: "la zona è IN PARTE determinata dal tipo").
import type { Zone } from '@/domain/types';

const EXTRA = /fusion|synchro|xyz|link/i;

/** true se la Card appartiene all'Extra Deck (in base al frameType). */
export function isExtraDeck(frameType: string): boolean {
  return EXTRA.test(frameType);
}

/** Zona suggerita all'aggiunta: extra per i mostri Extra Deck, altrimenti main. */
export function suggestedZone(frameType: string): Zone {
  return isExtraDeck(frameType) ? 'extra' : 'main';
}
