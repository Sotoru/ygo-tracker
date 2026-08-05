// Le carte di un Deck come sezioni da disegnare: una sezione per zona (Main / Extra /
// Side, con intestazione), e dentro la zona i gruppi con cui si legge una decklist —
// Mostri → Magie → Trappole in Main e Side, Fusion → Synchro → Xyz → Link nell'Extra.
// La suddivisione c'è SEMPRE: prima era solo un effetto collaterale dell'ordine del
// file .ydk, e ordinare per copie la distruggeva.
//   groupRows   → un gruppo per riga (la griglia si chiude a fine gruppo)
//   sortByCopies→ 3x → 2x → 1x DENTRO il gruppo (mai tra gruppi diversi)
// Puro: npx tsx src/domain/deck-sections.check.ts
import { CARD_TYPES, ZONES, type Zone } from './types';
import { cardType, EXTRA_TYPES, extraType } from './zone';

/** Un gruppo per tipo se `groupRows`, altrimenti un gruppo solo (griglia continua). */
export function deckSections<T extends { cardId: number; zone: Zone; count: number }>(
  entries: T[],
  frameTypeOf: (cardId: number) => string | undefined,
  { groupRows, sortByCopies }: { groupRows: boolean; sortByCopies: boolean },
): { label: string; groups: T[][] }[] {
  // sort è stabile → a parità di copie resta l'ordine di inserimento
  const sorted = (arr: T[]) => (sortByCopies ? [...arr].sort((a, b) => b.count - a.count) : arr);

  return ZONES.map(({ zone, label }) => {
    const own = entries.filter((e) => e.zone === zone);
    const extra = zone === 'extra';
    const keys: readonly string[] = extra ? EXTRA_TYPES : CARD_TYPES;
    const keyOf = (e: T): string | undefined => {
      const frame = frameTypeOf(e.cardId) ?? '';
      return extra ? extraType(frame) : cardType(frame);
    };
    // l'ultimo gruppo raccoglie i frame non riconosciuti (es. carta non ancora
    // risolta in un Extra): nessuna entry va persa per strada
    const groups = [...keys.map((k) => own.filter((e) => keyOf(e) === k)), own.filter((e) => keyOf(e) == null)]
      .filter((g) => g.length)
      .map(sorted);
    return { label, groups: groupRows ? groups : [groups.flat()] };
  }).filter((s) => s.groups.length);
}
