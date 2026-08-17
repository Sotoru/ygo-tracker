// Client Neon unificato (auth + Data API) via neon-js, solo Google. Un solo
// `createClient`: `client.from(...)` inietta automaticamente il JWT di sessione
// per RLS, e `client.auth` espone gli stessi metodi di prima. È il seam
// cross-platform: il giorno del native, l'OAuth specifica si innesta qui.
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
  // null da sloggato: il gate Stack.Protected regge.
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
  // altro login sullo stesso device non vede la wishlist del precedente.
  queryClient.clear();
  await persister.removeClient();
}

/** Credenziali dell'utente dev seed, solo se `EXPO_PUBLIC_DEV_AUTOLOGIN` è configurato per intero.
 *  `null` altrove (env assente, o build prod dove `__DEV__` è false): niente signIn/signUp dev possibile. */
export const DEV_AUTOLOGIN =
  __DEV__ && env.EXPO_PUBLIC_DEV_AUTOLOGIN && env.EXPO_PUBLIC_DEV_AUTOLOGIN_EMAIL && env.EXPO_PUBLIC_DEV_AUTOLOGIN_PASSWORD
    ? { email: env.EXPO_PUBLIC_DEV_AUTOLOGIN_EMAIL, password: env.EXPO_PUBLIC_DEV_AUTOLOGIN_PASSWORD }
    : null;

/** Login automatico con l'utente dev seed (chiamato dal root layout in dev). */
export function signInDev() {
  return client.auth.signIn.email(DEV_AUTOLOGIN!);
}

const ADMIN_EMAILS = new Set(
  (env.EXPO_PUBLIC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);

export function isAdminSession(session: { user?: { email?: string | null } } | null | undefined) {
  const email = session?.user?.email?.toLowerCase();
  return !!email && ADMIN_EMAILS.has(email);
}
