// Root HTML per il web statico: gira SOLO in Node durante l'export (mai su
// native, mai sul client). È il seam giusto per gli hint <head> web-only —
// niente ramo Platform.OS, niente .web.tsx. Vedi docs/router/reference/static-rendering.
import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

import { env } from '@/env';

// Preconnect alle origin Neon sul percorso critico: l'auth è colpita a ogni load
// da useSession() (gatea tutta la UI), la Data API subito dopo il login per la
// wishlist. Dedup nel caso condividano host. use-credentials: Better Auth usa
// cookie di sessione, quindi la connessione dev'essere credenziata per essere
// riusata (se Lighthouse la segnala "unused", passa a anonymous).
const preconnectOrigins = [
  ...new Set([
    new URL(env.EXPO_PUBLIC_NEON_AUTH_URL).origin,
    new URL(env.EXPO_PUBLIC_NEON_DATA_API_URL).origin,
  ]),
];

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {preconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="use-credentials" />
        ))}

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
