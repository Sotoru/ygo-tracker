// Self-check del parser .ydk. Esegui: npx tsx src/domain/ydk.check.ts
import assert from 'node:assert/strict';

import { buildYdk, parseYdk } from './ydk';

// File tipico: header ignorato, CRLF, passcode ripetuti (= copie), tutte e tre le zone.
const sample = [
  '#created by YGOProDeck',
  '#main',
  '89631139',
  '89631139',
  '89631139',
  '46986414',
  '#extra',
  '',
  '1861629',
  '!side',
  '89631139',
].join('\r\n');

const entries = parseYdk(sample);

// 3 copie del drago aggregate in una voce main
const dragon = entries.find((e) => e.cardId === 89631139 && e.zone === 'main')!;
assert.equal(dragon.count, 3, 'passcode ripetuti si aggregano in count');

// stessa carta in una zona diversa (side) è una voce separata
assert.ok(
  entries.some((e) => e.cardId === 89631139 && e.zone === 'side' && e.count === 1),
  'stessa Card in zona diversa = voce separata',
);

// zone dal file, non ricalcolate
assert.ok(entries.some((e) => e.cardId === 1861629 && e.zone === 'extra'), 'la zona viene dal file');

// header/vuote/non numeriche non entrano; totale voci distinte = 4
assert.equal(entries.length, 4, 'righe non-passcode e vuote cadono');

// passcode prima di ogni sezione: cadono (nessuna zona attiva)
assert.deepEqual(parseYdk('12345\n#main\n67890'), [{ cardId: 67890, zone: 'main', count: 1 }]);

// file vuoto → nessuna voce
assert.deepEqual(parseYdk(''), []);

// buildYdk: inverso di parseYdk. count si espande, sezioni sempre tutte e 3.
const built = buildYdk([
  { cardId: 89631139, zone: 'main', count: 3 },
  { cardId: 46986414, zone: 'main', count: 1 },
  { cardId: 1861629, zone: 'extra', count: 1 },
]);
assert.deepEqual(built.split('\n'), [
  '#created by ygo-tracker',
  '#main',
  '89631139',
  '89631139',
  '89631139',
  '46986414',
  '#extra',
  '1861629',
  '!side',
]);

// round-trip: parseYdk(buildYdk(entries)) riproduce le stesse voci (a meno dell'ordine delle chiavi)
assert.deepEqual(
  parseYdk(built),
  [
    { cardId: 89631139, zone: 'main', count: 3 },
    { cardId: 46986414, zone: 'main', count: 1 },
    { cardId: 1861629, zone: 'extra', count: 1 },
  ],
);

// deck vuoto: 3 header, zero righe carta
assert.equal(buildYdk([]), '#created by ygo-tracker\n#main\n#extra\n!side');

console.log('OK ydk self-check');
