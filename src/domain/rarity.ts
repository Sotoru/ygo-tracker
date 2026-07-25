// Forma "short" delle rarità per le righe strette. Una sola tabella statica
// (nessun valore letto dal BE a runtime): nome BE (set_rarity) → sigla mostrata.
// Modifica/aggiungi qui; rarità non mappata resta col nome pieno (mai criptico).
const RARITY_SHORT: Record<string, string> = {
  Common: "Common",
  Rare: "Rare",
  "Super Rare": "Super",
  "Ultra Rare": "Ultra",
  "Secret Rare": "Secret",
  "Ultimate Rare": "Ultimate",
  "Ghost Rare": "Ghost",
  "Collector's Rare": "Collector",
  "Starlight Rare": "Starlight",
  "Prismatic Secret Rare": "Prismatic",
  "Platinum Secret Rare": "Platinum",
  "Quarter Century Secret Rare": "Quarter",
};

// nome pieno BE → sigla; sconosciuto → nome pieno invariato.
export const shortRarity = (name: string): string => RARITY_SHORT[name] ?? name;
