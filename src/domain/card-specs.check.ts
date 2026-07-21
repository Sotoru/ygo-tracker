// Self-check di cardSpecs. Esegui: npx tsx src/domain/card-specs.check.ts
// Nessun framework: solo assert. Protegge l'edge dei valori 0 e l'assenza campi.
import assert from 'node:assert/strict';

import type { YgoCard } from '@/data/ygoprodeck';
import { cardSpecs } from './card-specs';

// Mostro con ATK/DEF 0: entrambi DEVONO comparire (0 è valido, non "assente").
const zeroAtk = {
  type: 'Effect Monster',
  race: 'Spellcaster',
  attribute: 'DARK',
  level: 1,
  atk: 0,
  def: 0,
} as YgoCard;
const zero = cardSpecs(zeroAtk);
assert.deepEqual(
  zero.find((s) => s.label === 'ATK'),
  { label: 'ATK', value: '0' },
  'ATK 0 deve comparire',
);
assert.deepEqual(
  zero.find((s) => s.label === 'DEF'),
  { label: 'DEF', value: '0' },
  'DEF 0 deve comparire',
);

// Magia/trappola: niente attributo/livello/atk/def; restano Tipo e Razza.
const spell = { type: 'Spell Card', race: 'Quick-Play' } as YgoCard;
const spellLabels = cardSpecs(spell).map((s) => s.label);
assert.deepEqual(spellLabels, ['Tipo', 'Categoria'], 'magia: solo Tipo + Categoria');

// Ordine fisso e archetipo incluso solo se presente.
const full = {
  type: 'XYZ Monster',
  race: 'Machine',
  attribute: 'LIGHT',
  level: 4,
  atk: 2500,
  def: 2000,
  archetype: 'Test',
} as YgoCard;
assert.deepEqual(
  cardSpecs(full).map((s) => s.label),
  ['Tipo', 'Attributo', 'Livello / Rango', 'ATK', 'DEF', 'Categoria', 'Archetipo'],
  'ordine specifiche',
);

console.log('ok: cardSpecs (0 ATK/DEF, magia, ordine)');
