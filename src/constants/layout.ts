// Larghezze e spaziature: sorgente unica, zero dipendenze (nemmeno react-native)
// così la matematica gira anche con `npx tsx`. Gli hook che la usano stanno in
// @/hooks/use-layout. Spacing e MaxContentWidth sono ri-esportati da
// @/constants/theme: i call site esistenti non cambiano import.

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 960; // knob unico: cambia qui per allargare/stringere il container globale

// Soglie di layout, in px di finestra. Fasce: phone < 600 <= tablet < 900 <= desktop.
export const Breakpoint = { tablet: 600, desktop: 900 } as const;
export type BreakpointName = 'phone' | 'tablet' | 'desktop';

// Sotto questa larghezza le celle delle griglie diventano illeggibili. Non
// decide le colonne (le dichiara ogni schermata): è solo il floor che le clampa
// in fondo alla fascia, dove il numero dichiarato non ci starebbe più.
export const MinCellWidth = 105;

// Cappa e centra, senza padding: per Appbar.Header e per la tab bar web, che
// hanno già un padding interno loro.
export const cappedWidth = {
  width: '100%',
  maxWidth: MaxContentWidth,
  alignSelf: 'center',
} as const;

// Contenuto scrollabile. Come cappedWidth, ma il gutter sta FUORI dal cap: sopra
// i 960 il contenuto resta 960 pieno (il respiro lo dà già il cap), sotto i 960
// non tocca il bordo. Così i due container restano allineati a ogni larghezza —
// col padding DENTRO al cap il gutter si conterebbe due volte e il contenuto
// rientrerebbe di 16px rispetto alle barre. Il padding sta qui e non sullo
// screen perché sullo screen impaginerebbe anche appbar e figli absolute.
export const contentContainer = {
  width: '100%',
  maxWidth: MaxContentWidth + Spacing.three * 2,
  alignSelf: 'center',
  paddingHorizontal: Spacing.three,
} as const;

// Le liste dense di carte (zone di un deck): stesso intento in più schermate, un
// valore solo così non divergono. Corrisponde a quanto rendeva il vecchio
// riempimento automatico a MinCellWidth.
export const DenseGridColumns = { phone: 3, tablet: 6, desktop: 8 } as const;

// Tutti i dialog/modali: mai più larghi del content, centrati, con un gutter su
// schermi stretti. La % (non width:'100%') lascia il gutter anche su mobile,
// dove marginHorizontal:'auto' da solo lo azzererebbe. Cross-platform, no Platform.OS.
export const dialogWidth = {
  width: '90%',
  maxWidth: MaxContentWidth,
  marginHorizontal: 'auto',
} as const;

export function breakpointOf(width: number): BreakpointName {
  if (width >= Breakpoint.desktop) return 'desktop';
  if (width >= Breakpoint.tablet) return 'tablet';
  return 'phone';
}

/**
 * Larghezza utile e cella per una griglia flexWrap dentro il container globale.
 *
 * `cols` = numero fisso, oppure colonne dichiarate per fascia. Il numero
 * dichiarato è un massimo, non una promessa: viene clampato a quante celle da
 * MinCellWidth ci stanno davvero, così in fondo a una fascia larga le celle non
 * scendono sotto la soglia di leggibilità. Mai meno di 1 colonna.
 */
export function gridMetrics(width: number, cols: number | Record<BreakpointName, number>) {
  // stessa geometria di contentContainer: il gutter si sottrae PRIMA del cap, così
  // sopra i 960 la griglia usa i 960 pieni e sotto lascia il respiro sui bordi.
  const available = Math.min(width - Spacing.three * 2, MaxContentWidth);
  const fits = Math.floor((available + Spacing.two) / (MinCellWidth + Spacing.two));
  const wanted = typeof cols === 'number' ? cols : cols[breakpointOf(width)];
  const columns = Math.max(1, Math.min(wanted, fits));
  const cellWidth = Math.floor((available - Spacing.two * (columns - 1)) / columns);
  return { available, columns, cellWidth };
}
