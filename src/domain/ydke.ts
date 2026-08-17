// Parser YDKe (il "YDKe Code" di Duelingbook, spec EDOPro/Omega): un URL
// `ydke://<main>!<extra>!<side>!` dove ogni sezione è il base64 dei passcode come
// uint32 little-endian. Stessi passcode di un .ydk → stesse DeckEntryInput, quindi
// l'aggregazione delle copie è quella di ydk.ts.
import type { DeckEntryInput, Zone } from '@/domain/types';
import { collectEntries } from '@/domain/ydk';

const PREFIX = 'ydke://';
const ZONES: Zone[] = ['main', 'extra', 'side']; // l'ordine è quello delle sezioni nell'URL

/** `atob` è globale su web e su Hermes; lancia lui su base64 invalido. */
function passcodesOf(base64: string): number[] {
  const bytes = atob(base64);
  if (bytes.length % 4) throw new Error('sezione troncata');
  const out: number[] = [];
  for (let i = 0; i < bytes.length; i += 4) {
    const le =
      bytes.charCodeAt(i) |
      (bytes.charCodeAt(i + 1) << 8) |
      (bytes.charCodeAt(i + 2) << 16) |
      (bytes.charCodeAt(i + 3) << 24);
    out.push(le >>> 0); // i passcode alti superano 2^31: senza questo diventano negativi
  }
  return out;
}

/**
 * Lancia se il codice non è un YDKe: prefisso e 3 sezioni sono obbligatori (niente
 * indovinare cosa intendeva l'utente). Spazi e newline attorno o dentro cadono —
 * il base64 non ne contiene, e un paste dalla chat ne porta sempre. Il `!` finale
 * della spec è di fatto opzionale: non porta dati, con 3 sezioni non c'è ambiguità.
 */
export function parseYdke(code: string): DeckEntryInput[] {
  const clean = code.replace(/\s+/g, '');
  if (!clean.toLowerCase().startsWith(PREFIX)) throw new Error('manca il prefisso ydke://');
  const sections = clean.slice(PREFIX.length).split('!');
  if (sections.length < ZONES.length) throw new Error('servono 3 sezioni separate da !');
  return collectEntries(
    ZONES.flatMap((zone, i) => passcodesOf(sections[i]).map((cardId): [number, Zone] => [cardId, zone])),
  );
}
