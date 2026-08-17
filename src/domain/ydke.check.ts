// Self-check del parser YDKe. Esegui: npx tsx src/domain/ydke.check.ts
import assert from 'node:assert/strict';

import { parseYdke } from './ydke';

// Codice noto: main = 2x Blue-Eyes (89631139) + Pot of Greed (46986414), extra =
// 1861629, side = 89631139. Hardcoded, non ricalcolato: è il byte order che stiamo
// verificando, e un base64 generato dallo stesso codice sbagliato tornerebbe.
const code = 'ydke://o6lXBaOpVwWu9MwC!/WccAA==!o6lXBQ==!';

assert.deepEqual(parseYdke(code), [
  { cardId: 89631139, zone: 'main', count: 2 }, // passcode ripetuti = copie
  { cardId: 46986414, zone: 'main', count: 1 },
  { cardId: 1861629, zone: 'extra', count: 1 },
  { cardId: 89631139, zone: 'side', count: 1 }, // stessa Card, zona diversa = voce separata
]);

// Sezioni vuote: deck di solo main, niente extra/side.
assert.deepEqual(parseYdke('ydke://o6lXBQ==!!!'), [{ cardId: 89631139, zone: 'main', count: 1 }]);

// Paste dalla chat: newline e spazi attorno e dentro il codice.
assert.deepEqual(parseYdke(`  ydke://o6lXBQ==!\n!!  `), [{ cardId: 89631139, zone: 'main', count: 1 }]);

// Passcode con il bit alto acceso: uint32, non int32 negativo.
assert.deepEqual(parseYdke('ydke:///////w==!!!'), [{ cardId: 4294967295, zone: 'main', count: 1 }]);

// `!` finale mancante: 3 sezioni ci sono, il deck si legge.
assert.deepEqual(parseYdke('ydke://o6lXBQ==!!'), [{ cardId: 89631139, zone: 'main', count: 1 }]);

for (const bad of [
  'o6lXBQ==!!!', // manca il prefisso
  'ydke://o6lXBQ==!', // 2 sezioni
  'ydke://o6lXB!!!', // base64 non allineato a 4 byte
  'ydke://***!!!', // base64 invalido
]) {
  assert.throws(() => parseYdke(bad), `deve rifiutare: ${bad}`);
}

console.log('OK ydke self-check');
