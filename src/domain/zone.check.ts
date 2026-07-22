// Self-check zona. Esegui: npx tsx src/domain/zone.check.ts
import assert from 'node:assert/strict';

import { isExtraDeck, suggestedZone } from './zone';

// Extra Deck: i quattro frame + le loro varianti pendulum
for (const f of ['fusion', 'synchro', 'xyz', 'link', 'xyz_pendulum', 'synchro_pendulum'])
  assert.ok(isExtraDeck(f), `${f} deve essere Extra Deck`);

// Main Deck: mostri normali/effetto/ritual e magie/trappole (ritual si evoca dalla mano)
for (const f of ['normal', 'effect', 'ritual', 'spell', 'trap', 'normal_pendulum'])
  assert.ok(!isExtraDeck(f), `${f} NON deve essere Extra Deck`);

assert.equal(suggestedZone('fusion'), 'extra');
assert.equal(suggestedZone('effect'), 'main');

console.log('OK zone self-check');
