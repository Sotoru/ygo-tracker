// Self-check del resolver frame→tinta. Esegui: npx tsx src/components/frame-tint.check.ts
import assert from 'node:assert/strict';

import { frameHue, frameTint, TINT_ALPHA } from './frame-tint';

// frame noto → hue + alpha (8-digit hex)
assert.equal(frameTint('spell'), '#1E8E5A' + TINT_ALPHA, 'spell = verde traslucido');

// pendulum → strippa il suffisso e usa il colore del mostro base
assert.equal(frameTint('effect_pendulum'), frameTint('effect'), 'pendulum usa il frame base');

// frame sconosciuto/assente → undefined (il chiamante ripiega sul neutro)
assert.equal(frameTint('link_monster'), undefined, 'frame sconosciuto → undefined');
assert.equal(frameTint(undefined), undefined, 'assente → undefined');

// frameHue = stessa tinta senza alpha (badge: stesso colore della cella, più scuro)
assert.equal(frameHue('effect_pendulum'), '#B85C1E', 'hue piena, suffisso strippato');
assert.equal(frameHue('link_monster'), undefined, 'frame sconosciuto → undefined');

// synchro (bianco) e xyz (nero) hanno tinte diverse → restano distinguibili
assert.notEqual(frameTint('synchro'), frameTint('xyz'), 'acromatici distinti');

console.log('OK frame-tint self-check');
