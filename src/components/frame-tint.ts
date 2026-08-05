// Colore di sfondo di una CardCell per frame YGO. `frameType` (campo nativo
// YGOPRODeck) è già la "categoria colore" della carta. Tinta = hue autentica
// applicata come overlay TRASLUCIDO (hue + alpha) sopra lo sfondo del tema: la
// lightness la porta lo sfondo (chiaro/scuro), la tinta sposta solo la tonalità
// → un'unica mappa resta leggibile in entrambi i temi. Frame acromatici
// (synchro=bianco, xyz=nero, link=blu scuro) hanno un sostituto cromatico così
// da restare distinguibili anche a bassa opacità.

// Hue opache per frame; l'alpha la aggiunge il chiamante. Chiave = frameType
// base (i suffissi _pendulum vengono strippati prima del lookup).
const FRAME_HUE: Record<string, string> = {
  normal: '#C9A227', // giallo (Normal Monster)
  effect: '#B85C1E', // arancio/marrone (Effect Monster)
  ritual: '#3B5BA9', // blu (Ritual)
  fusion: '#7A3FA0', // viola (Fusion)
  synchro: '#8FA3B8', // bianco → argento/blu-grigio
  xyz: '#3A4250', // nero → ardesia
  link: '#0E8C99', // blu scuro → teal (distinto dal ritual)
  spell: '#1E8E5A', // verde (Spell)
  trap: '#C2185B', // magenta (Trap)
};

// ~20% di opacità: tinta soft, testo del tema resta leggibile.
export const TINT_ALPHA = '33';

/**
 * Sfondo per il frame dato, già pronto (hue + alpha), oppure `undefined` se il
 * frame è sconosiuto/assente → il chiamante ripiega sul neutro del tema.
 */
export function frameTint(frameType?: string): string | undefined {
  const hue = frameHue(frameType);
  return hue ? hue + TINT_ALPHA : undefined;
}

/** Hue opaca del frame, senza alpha: stessa tinta dello sfondo cella ma piena
 * (→ più scura), per gli elementi che devono staccare sopra di essa. */
export function frameHue(frameType?: string): string | undefined {
  if (!frameType) return undefined;
  return FRAME_HUE[frameType.replace(/_pendulum$/, '')]; // pendulum → mostro base
}
