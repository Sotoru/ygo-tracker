// Self-check zona. Esegui: npx tsx src/domain/zone.check.ts
import assert from 'node:assert/strict';

import { cardType, extraType, isExtraDeck, suggestedZone } from './zone';

// Extra Deck: i quattro frame + le loro varianti pendulum
for (const f of ['fusion', 'synchro', 'xyz', 'link', 'xyz_pendulum', 'synchro_pendulum'])
  assert.ok(isExtraDeck(f), `${f} deve essere Extra Deck`);

// Main Deck: mostri normali/effetto/ritual e magie/trappole (ritual si evoca dalla mano)
for (const f of ['normal', 'effect', 'ritual', 'spell', 'trap', 'normal_pendulum'])
  assert.ok(!isExtraDeck(f), `${f} NON deve essere Extra Deck`);

assert.equal(suggestedZone('fusion'), 'extra');
assert.equal(suggestedZone('effect'), 'main');

// Card Type: solo i frame spell/trap NON sono mostri (pendulum e Extra Deck compresi)
assert.equal(cardType('spell'), 'spell');
assert.equal(cardType('trap'), 'trap');
for (const f of ['effect', 'normal_pendulum', 'xyz', 'ritual', 'link'])
  assert.equal(cardType(f), 'monster', `${f} deve essere monster`);

// Sotto-tipo Extra: le varianti pendulum ricadono nel loro tipo; i frame Main non ne hanno
assert.equal(extraType('xyz_pendulum'), 'xyz');
assert.equal(extraType('link'), 'link');
assert.equal(extraType('effect'), undefined);
assert.equal(extraType(''), undefined);

console.log('OK zone self-check');
