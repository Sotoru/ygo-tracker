// Client Neon unificato (auth + Data API) via neon-js, solo Google. Un solo
// `createClient`: `client.from(...)` inietta automaticamente il JWT di sessione
// per RLS, e `client.auth` espone gli stessi metodi di prima. È il seam
// cross-platform: il giorno del native, l'OAuth specifica si innesta qui. Vedi docs/adr/0005.
import { createClient } from '@neondatabase/neon-js';
// Da `/auth/react/adapters`, non `/auth/react`: quest'ultimo è il barrel dei
// componenti UI (web DOM/CSS) e sballerebbe il bundle Metro. Vedi Critical Rule #2.
import { BetterAuthReactAdapter } from '@neondatabase/neon-js/auth/react/adapters';

import { persister, queryClient } from '@/data/query-client';
import type { Database } from '@/database.types';
import { env } from '@/env';

export const client = createClient<Database>({
  // allowAnonymous: senza sessione la Data API usa un token anonimo → l'RLS espone
  // i soli deck pubblici (deck detail pubblico). NON tocca `useSession`, che resta
  // null da sloggato: il gate Stack.Protected regge. Vedi docs/adr/0005.
  auth: { adapter: BetterAuthReactAdapter(), url: env.EXPO_PUBLIC_NEON_AUTH_URL, allowAnonymous: true },
  dataApi: { url: env.EXPO_PUBLIC_NEON_DATA_API_URL },
});

/** Hook di sessione (Better Auth): `{ data, isPending, error }`. `data` = { session, user } | null. */
export const useSession = client.auth.useSession;

/** Login Google. A login fatto torna alla index (il gate mostra l'app); su annullo/errore
 *  OAuth torna a /sign-in invece della pagina JSON di errore di Neon Auth. */
export function signInWithGoogle() {
  return client.auth.signIn.social({ provider: 'google', callbackURL: '/', errorCallbackURL: '/sign-in' });
}

export async function signOut() {
  await client.auth.signOut();
  // Cloud multi-utente: butta via la cache in memoria E il persistito, così un
  // altro login sullo stesso device non vede la wishlist del precedente. Vedi docs/adr/0005.
  queryClient.clear();
  await persister.removeClient();
}
