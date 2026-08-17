// Self-check dell'unica logica non banale: l'URL del proxy immagini (l'hotlink
// diretto a YGOPRODeck è vietato dai loro termini).
// Esegui: npx tsx src/data/ygoprodeck.check.ts
import assert from 'node:assert/strict';

import { cardImageUrl } from './ygoprodeck';

const u = cardImageUrl('https://images.ygoprodeck.com/images/cards/46986414.jpg', { width: 200 });

assert.ok(u.startsWith('https://images.weserv.nl/?'), 'deve usare il proxy weserv');
assert.ok(
  decodeURIComponent(u).includes('url=images.ygoprodeck.com/images/cards/46986414.jpg'),
  'lo schema http(s) va tolto dal src',
);
assert.ok(u.includes('w=200'), 'deve propagare la larghezza');

console.log('OK ygoprodeck self-check');
