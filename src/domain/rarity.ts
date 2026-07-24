// Forma "short" delle rarità per le righe strette. Una sola tabella statica
// (nessun valore letto dal BE a runtime): nome BE (set_rarity) → sigla mostrata.
// Modifica/aggiungi qui; rarità non mappata resta col nome pieno (mai criptico).
const RARITY_SHORT: Record<string, string> = {
  Common: "Comm",
  Rare: "Rare",
  "Super Rare": "SR",
  "Ultra Rare": "UR",
  "Secret Rare": "SR",
  "Ultimate Rare": "Ulti",
  "Ghost Rare": "GR",
  "Collector's Rare": "CR",
  "Starlight Rare": "SLight",
  "Prismatic Secret Rare": "Prism SR",
  "Platinum Secret Rare": "Plat SR",
  "Quarter Century Secret Rare": "QCR",
};

// nome pieno BE → sigla; sconosciuto → nome pieno invariato.
export const shortRarity = (name: string): string => RARITY_SHORT[name] ?? name;
