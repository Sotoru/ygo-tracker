// Parser .ydk puro (nessun import RN): dal testo del file alle voci di un Deck.
// Un .ydk è righe di passcode divise in sezioni: `#main`, `#extra`, `!side`.
// Il passcode coincide col campo `id` YGOPRODeck della Card (vedi CONTEXT.md).
// Ci fidiamo delle zone del file (non le ricalcoliamo dal tipo carta): è ciò che
// l'utente ha costruito nel deck editor. Import "as-is": nessuna validazione.
import type { DeckEntryInput, Zone } from '@/domain/types';

// Header di sezione → zona. Le altre righe `#...` (es. `#created by ...`) si ignorano.
const SECTIONS: Record<string, Zone> = { '#main': 'main', '#extra': 'extra', '!side': 'side' };

/**
 * Passcode ripetuti = copie: li aggrego in `count`. Righe fuori da ogni sezione,
 * vuote o non numeriche cadono. L'ordine delle voci restituite segue la prima
 * apparizione nel file.
 */
export function parseYdk(text: string): DeckEntryInput[] {
  let zone: Zone | null = null;
  const acc = new Map<string, DeckEntryInput>(); // chiave: `${zone}:${cardId}`
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
    const cardId = Number(line);
    const key = `${zone}:${cardId}`;
    const existing = acc.get(key);
    if (existing) existing.count += 1;
    else acc.set(key, { cardId, zone, count: 1 });
  }
  return [...acc.values()];
}
