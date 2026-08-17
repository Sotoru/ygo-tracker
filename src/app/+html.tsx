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
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        {/* Colora la UI di Safari (barra sotto) invece del bianco di default. Valori
            MD3 background chiaro/scuro (quasi identici tra tema blu e default). */}
        <meta name="theme-color" content="#FFFBFE" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1C1B1F" media="(prefers-color-scheme: dark)" />

        {/* Titolo statico app-wide: nessuna schermata usa più expo-router/head, quindi
            questo vale ovunque e resta invariato alla navigazione client. */}
        <title>YGO Tracker</title>

        {preconnectOrigins.map((origin) => (
          <link key={origin} rel="preconnect" href={origin} crossOrigin="use-credentials" />
        ))}

        <ScrollViewStyleReset />
        {/* ScrollViewStyleReset non azzera il margin di default di <body> (8px):
            senza questo si vede una striscia bianca fissa in alto e in basso,
            tagliata da body{overflow:hidden} invece di essere scrollabile. */}
        {/* height:100dvh sovrascrive il 100% del reset: 100% si misura sulla large
            viewport (barra URL collassata), quindi sui browser mobile il fondo
            dell'app finisce sotto la chrome e — con body{overflow:hidden} — non è
            raggiungibile (FAB e ultime righe tagliate). dvh segue la chrome. */}
        <style
          dangerouslySetInnerHTML={{ __html: `body{margin:0}html,body,#root{height:100dvh}` }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
