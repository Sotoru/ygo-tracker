// Parser .ydk puro (nessun import RN): dal testo del file alle voci di un Deck.
// Un .ydk è righe di passcode divise in sezioni: `#main`, `#extra`, `!side`.
// Il passcode coincide col campo `id` YGOPRODeck della Card (vedi CONTEXT.md).
// Ci fidiamo delle zone del file (non le ricalcoliamo dal tipo carta): è ciò che
// l'utente ha costruito nel deck editor. Import "as-is": nessuna validazione.
import type { DeckEntryInput, Zone } from '@/domain/types';

// Header di sezione → zona. Le altre righe `#...` (es. `#created by ...`) si ignorano.
const SECTIONS: Record<string, Zone> = { '#main': 'main', '#extra': 'extra', '!side': 'side' };

/**
 * Passcode ripetuti = copie: li aggrego in `count`. Condiviso con `ydke.ts`, così
 * i due formati hanno le stesse regole su copie e ordine (prima apparizione).
 */
export function collectEntries(passcodes: Iterable<[cardId: number, zone: Zone]>): DeckEntryInput[] {
  const acc = new Map<string, DeckEntryInput>(); // chiave: `${zone}:${cardId}`
  for (const [cardId, zone] of passcodes) {
    const key = `${zone}:${cardId}`;
    const existing = acc.get(key);
    if (existing) existing.count += 1;
    else acc.set(key, { cardId, zone, count: 1 });
  }
  return [...acc.values()];
}

/**
 * Righe fuori da ogni sezione, vuote o non numeriche cadono. L'ordine delle voci
 * restituite segue la prima apparizione nel file.
 */
export function parseYdk(text: string): DeckEntryInput[] {
  let zone: Zone | null = null;
  const passcodes: [number, Zone][] = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const section = SECTIONS[line.toLowerCase()];
    if (section) {
      zone = section;
      continue;
    }
    if (line.startsWith('#') || line.startsWith('!')) continue; // altri commenti/sezioni note
    if (!zone || !/^\d+$/.test(line)) continue;
    passcodes.push([Number(line), zone]);
  }
  return collectEntries(passcodes);
}

const ZONE_ORDER: Zone[] = ['main', 'extra', 'side'];
const ZONE_HEADER: Record<Zone, string> = { main: '#main', extra: '#extra', side: '!side' };

/**
 * Inverso di `parseYdk`: `count` si espande in passcode ripetuti. Le 3 sezioni
 * sono sempre presenti (anche vuote); l'ordine delle carte dentro ciascuna
 * segue l'ordine di `entries`, nessun resort.
 */
export function buildYdk(entries: DeckEntryInput[]): string {
  const lines = ['#created by ygo-tracker'];
  for (const zone of ZONE_ORDER) {
    lines.push(ZONE_HEADER[zone]);
    for (const e of entries.filter((e) => e.zone === zone)) {
      for (let i = 0; i < e.count; i++) lines.push(String(e.cardId));
    }
  }
  return lines.join('\n');
}
