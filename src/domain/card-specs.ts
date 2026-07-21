// Specifiche di una carta come righe (label, value) per il dettaglio: solo i
// campi presenti, in ordine fisso. Mostri hanno attributo/livello/atk/def;
// magie/trappole no → spariscono. atk/def possono valere 0 (valido) → il filtro
// confronta con null, non con "falsy". Puro (niente RN) così è verificabile:
// npx tsx src/domain/card-specs.check.ts
import type { YgoCard } from '@/data/ygoprodeck';

export function cardSpecs(card: YgoCard): { label: string; value: string }[] {
  const rows: [string, string | number | undefined][] = [
    ['Tipo', card.type],
    ['Attributo', card.attribute],
    ['Livello / Rango', card.level],
    ['ATK', card.atk],
    ['DEF', card.def],
    ['Categoria', card.race],
    ['Archetipo', card.archetype],
  ];
  return rows
    .filter(([, v]) => v != null && v !== '')
    .map(([label, v]) => ({ label, value: String(v) }));
}
