// Self-check della logica pura del NeonRepository. Esegui: npx tsx src/data/neon-repository.check.ts
// Solo planEntries: le chiamate PostgREST sono I/O glue (territorio integrazione).
import assert from 'node:assert/strict';

import { planEntries } from './wishlist-plan';

// batch misto: le count>0 si upsertano, le <=0 si cancellano, resta desiderata → reset
let p = planEntries([
  { rarity: 'Ultra Rare', count: 3 },
  { rarity: 'Secret Rare', count: 2 },
  { rarity: 'Rare', count: 0 },
]);
assert.deepEqual(
  p.toUpsert,
  [
    { rarity: 'Ultra Rare', count: 3 },
    { rarity: 'Secret Rare', count: 2 },
  ],
  'solo le rarità con count>0 vanno in upsert',
);
assert.deepEqual(p.toDelete, ['Rare'], 'le count<=0 si cancellano');
assert.equal(p.resetObtained, true, 'resta una rarità desiderata → la carta torna Wanted');

// pura RIMOZIONE: nessun upsert, nessun reset (la carta resta Presa)
p = planEntries([{ rarity: 'Secret Rare', count: 0 }]);
assert.deepEqual(p.toUpsert, []);
assert.deepEqual(p.toDelete, ['Secret Rare']);
assert.equal(p.resetObtained, false, 'una rimozione non deve riattivare la carta');

console.log('OK neon-repository planEntries self-check');
