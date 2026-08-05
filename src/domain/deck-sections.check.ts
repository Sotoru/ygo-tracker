// Self-check sezioni deck. Esegui: npx tsx src/domain/deck-sections.check.ts
import assert from 'node:assert/strict';

import { deckSections } from './deck-sections';
import type { Zone } from './types';

const e = (cardId: number, zone: Zone, count: number) => ({ cardId, zone, count });
// 1,2 mostri · 3,4 magie · 5 trappola · 6 synchro (Extra) · 7 mostro in Side
// 20+ = Extra Deck: fusion, xyz_pendulum, link
const FRAMES: Record<number, string> = {
  1: 'effect',
  2: 'normal',
  3: 'spell',
  4: 'spell',
  5: 'trap',
  6: 'synchro',
  7: 'effect',
  20: 'fusion',
  21: 'xyz_pendulum',
  22: 'link',
};
const frameTypeOf = (id: number) => FRAMES[id];
// inserite mescolate: magia, mostro 1x, trappola, mostro 3x
const entries = [e(3, 'main', 3), e(1, 'main', 1), e(5, 'main', 1), e(2, 'main', 3), e(4, 'main', 1), e(6, 'extra', 1), e(7, 'side', 2)];
const ids = (g: { cardId: number }[]) => g.map((x) => x.cardId);

// zone sempre in sezioni, nell'ordine Main → Extra → Side; le vuote cadono
let secs = deckSections(entries, frameTypeOf, { groupRows: false, sortByCopies: false });
assert.deepEqual(
  secs.map((s) => s.label),
  ['Main', 'Extra', 'Side'],
);

// senza «gruppi a capo»: una griglia sola per zona, ma già ordinata per tipo
assert.equal(secs[0].groups.length, 1, 'un solo gruppo = griglia continua');
assert.deepEqual(ids(secs[0].groups[0]), [1, 2, 3, 4, 5], 'mostri → magie → trappole, ordine di inserimento dentro il tipo');

// «gruppi a capo»: un gruppo per tipo presente (le trappole del Main sono una sola)
secs = deckSections(entries, frameTypeOf, { groupRows: true, sortByCopies: false });
assert.deepEqual(secs[0].groups.map(ids), [[1, 2], [3, 4], [5]], 'un gruppo per Card Type');
assert.deepEqual(secs[1].groups.map(ids), [[6]], 'Extra: solo mostri');

// copie: ordina DENTRO il gruppo, mai tra tipi (la magia 3x non passa davanti ai mostri)
secs = deckSections(entries, frameTypeOf, { groupRows: false, sortByCopies: true });
assert.deepEqual(ids(secs[0].groups[0]), [2, 1, 3, 4, 5], '3x prima dentro i mostri, poi le magie');
secs = deckSections(entries, frameTypeOf, { groupRows: true, sortByCopies: true });
assert.deepEqual(secs[0].groups.map(ids), [[2, 1], [3, 4], [5]]);

// Extra Deck: stessa suddivisione, ma per sotto-tipo → Fusion → Synchro → Xyz → Link
// (le varianti pendulum ricadono nel loro tipo: xyz_pendulum sta con gli Xyz)
const extra = [e(22, 'extra', 1), e(21, 'extra', 1), e(6, 'extra', 3), e(20, 'extra', 1), e(1, 'main', 1)];
secs = deckSections(extra, frameTypeOf, { groupRows: true, sortByCopies: false });
assert.equal(secs[1].label, 'Extra');
assert.deepEqual(secs[1].groups.map(ids), [[20], [6], [21], [22]], 'fusion → synchro → xyz → link');
// senza «gruppi a capo» resta una griglia sola, ma nell'ordine dei sotto-tipi
secs = deckSections(extra, frameTypeOf, { groupRows: false, sortByCopies: true });
assert.deepEqual(ids(secs[1].groups[0]), [20, 6, 21, 22], 'la 3x synchro non passa davanti al fusion');

// frame Extra non riconosciuto (carta non ancora risolta) → ultimo gruppo, mai persa
const unknownExtra = deckSections([e(99, 'extra', 1), e(20, 'extra', 1)], frameTypeOf, {
  groupRows: true,
  sortByCopies: false,
});
assert.deepEqual(unknownExtra[0].groups.map(ids), [[20], [99]]);

// carta non ancora risolta (frameType assente) → coda dei mostri, niente crash
const unresolved = deckSections([e(99, 'main', 1), e(3, 'main', 1)], frameTypeOf, { groupRows: true, sortByCopies: false });
assert.deepEqual(unresolved[0].groups.map(ids), [[99], [3]]);

// deck vuoto: nessuna sezione, così la schermata mostra «Deck vuoto»
assert.deepEqual(deckSections([], frameTypeOf, { groupRows: true, sortByCopies: true }), []);

console.log('OK deck-sections self-check');
