// Self-check delle larghezze responsive. Esegui: npx tsx src/constants/layout.check.ts
import assert from 'node:assert/strict';

import {
  breakpointOf,
  cappedWidth,
  contentContainer,
  DenseGridColumns as DENSE,
  gridMetrics,
  MaxContentWidth,
  Spacing,
} from './layout';

// fasce: i bordi appartengono alla fascia superiore
assert.equal(breakpointOf(599), 'phone');
assert.equal(breakpointOf(600), 'tablet', '600 è già tablet');
assert.equal(breakpointOf(899), 'tablet');
assert.equal(breakpointOf(900), 'desktop', '900 è già desktop');

// griglie dense (deck, tournament-decks): rendono quel che rendeva il vecchio
// riempimento automatico a MinCellWidth, alle larghezze di riferimento
assert.deepEqual(gridMetrics(390, DENSE), { available: 358, columns: 3, cellWidth: 114 });
assert.deepEqual(gridMetrics(768, DENSE), { available: 736, columns: 6, cellWidth: 116 });
assert.deepEqual(gridMetrics(1440, DENSE), { available: 960, columns: 8, cellWidth: 113 });

// oltre il cap la larghezza utile non cresce più, e sopra il cap è il cap PIENO:
// il gutter lo dà già il cap, sommarne un altro rientrerebbe di 16px per lato
// rispetto alle barre (Appbar.Header, tab bar web) che cappano a 960 secche.
assert.equal(gridMetrics(1440, DENSE).available, MaxContentWidth);
assert.equal(gridMetrics(3840, DENSE).available, MaxContentWidth);

// sotto il cap invece il gutter c'è, altrimenti le celle toccano il bordo
assert.equal(gridMetrics(390, DENSE).available, 390 - 32);

// contentContainer e cappedWidth devono produrre lo stesso box interno a ogni
// larghezza: è la condizione che tiene contenuto e barre allineati
for (const w of [360, 500, 960, 992, 1013, 1440, 3840]) {
  const content = Math.min(w, contentContainer.maxWidth) - contentContainer.paddingHorizontal * 2;
  const bar = Math.min(w - Spacing.three * 2, cappedWidth.maxWidth);
  assert.equal(content, bar, `a ${w}px: contenuto ${content} ≠ barra ${bar}`);
  assert.equal(content, gridMetrics(w, DENSE).available, `a ${w}px la griglia non segue il container`);
}

// il clamp: a 600px netti le 6 dichiarate non ci stanno, scende a 5 e la cella
// resta sopra MinCellWidth (senza clamp sarebbe 88px)
const low = gridMetrics(600, DENSE);
assert.equal(low.columns, 5, 'clampata a quante ci stanno');
assert.ok(low.cellWidth >= 105, `cella ${low.cellWidth}px sopra il floor`);

// numero scalare (picker banlist): su phone la scelta utente viene clampata
assert.equal(gridMetrics(390, 7).columns, 3, '7 colonne su phone → 3');
assert.equal(gridMetrics(1440, 7).columns, 7, 'su desktop la scelta passa intera');

// mai 0 colonne, nemmeno su una finestra assurda
assert.equal(gridMetrics(100, 3).columns, 1);

console.log('layout ok');
