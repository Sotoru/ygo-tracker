// Pianificazione PURA (niente rete, niente import del client) di cosa fare su
// PostgREST quando il PrintPicker conferma delle rarità. Isolata qui così il
// self-check (neon-repository.check.ts) gira in node senza bootare il client.
//
// A differenza del repo locale non c'è da riscrivere un array: le rarità NON
// toccate dal payload semplicemente non si toccano. Resta solo da decidere, per
// le rarità nel payload: upsert (count>0) vs delete (count<=0), e se la carta
// torna "Da prendere" — azzerare obtained_at su TUTTE le sue righe (invariante
// "stato per-carta", CONTEXT.md) succede solo se resta desiderata una rarità.
export function planEntries(entries: { rarity: string; count: number }[]) {
  const toUpsert = entries.filter((e) => e.count > 0);
  const toDelete = entries.filter((e) => e.count <= 0).map((e) => e.rarity);
  return { toUpsert, toDelete, resetObtained: toUpsert.length > 0 };
}
