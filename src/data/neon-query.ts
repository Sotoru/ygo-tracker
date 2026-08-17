// Un solo punto dove l'errore PostgREST diventa throw: prima ogni query si portava
// dietro il suo `const { data, error } = await …; if (error) throw error`, tre righe
// per round-trip su tre repository. `unknown` in ingresso perché al chiamante
// interessa la forma della riga, non il tipo del builder di neon-js.
type Query = PromiseLike<{ data?: unknown; error: unknown }>;

/** Lista di righe: `data` null → `[]`. */
export async function rows<T>(q: Query): Promise<T[]> {
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

/** Prima riga di una `.eq('id', …)`, o `undefined` se non esiste. */
export async function firstRow<T>(q: Query): Promise<T | undefined> {
  return (await rows<T>(q))[0];
}

/** Riga di una `.single()`: PostgREST garantisce l'unicità, o è errore. */
export async function row<T>(q: Query): Promise<T> {
  const { data, error } = await q;
  if (error) throw error;
  return data as T;
}

/** Mutazione di cui non serve il risultato (update/delete/insert senza select). */
export async function run(q: PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await q;
  if (error) throw error;
}
