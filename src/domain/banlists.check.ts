// Self-check delle banlist statiche. Esegui: npx tsx src/domain/banlists.check.ts
// Nessun framework: solo assert. Verifica ciò che è controllabile SENZA rete
// (il match nome↔YGOPRODeck arriverà col validatore). Vedi ADR 0003.
import assert from 'node:assert/strict';

import { BANLISTS, banlistFor, statusOf } from './banlists';
import { COPIES_BY_BAN_STATUS, FORMATS, type Format } from './types';

const formats = Object.keys(FORMATS) as Format[];

for (const format of formats) {
  const groups = BANLISTS[format];
  const flat = banlistFor(format);

  // 1) Nessuna carta in due status diversi nello stesso format: se ci fosse un
  //    duplicato, la mappa piatta lo collasserebbe e avrebbe meno voci della somma.
  const total = (groups.forbidden?.length ?? 0) + (groups.limited?.length ?? 0) + (groups.semiLimited?.length ?? 0);
  assert.equal(
    Object.keys(flat).length,
    total,
    `${format}: un nome compare in più status (o duplicato) — la mappa piatta ha ${Object.keys(flat).length} voci su ${total}`,
  );

  // 2) Nessun nome vuoto o con spazi ai bordi (errori di trascrizione comuni).
  for (const name of Object.keys(flat)) {
    assert.ok(name.length > 0 && name === name.trim(), `${format}: nome carta malformato: ${JSON.stringify(name)}`);
  }
}

// 3) statusOf: elencata → status giusto; non elencata → unlimited (3 copie).
assert.equal(statusOf('goat', 'Pot of Greed'), 'limited');
assert.equal(statusOf('goat', 'Change of Heart'), 'forbidden');
assert.equal(statusOf('goat', 'Level Limit - Area B'), 'semiLimited');
assert.equal(statusOf('goat', 'Blue-Eyes White Dragon'), 'unlimited');
assert.equal(COPIES_BY_BAN_STATUS[statusOf('goat', 'Blue-Eyes White Dragon')], 3);

// 4) redu è cablato ovunque (Format ∋ redu, registro FORMATS, banlist presente).
assert.ok(BANLISTS.redu.forbidden?.includes('Chaos Emperor Dragon - Envoy of the End'));

console.log(`ok: ${formats.length} banlist verificate (${formats.join(', ')})`);
