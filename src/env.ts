// Env tipizzato e validato all'import (t3-env). Client-only, nessun server tier:
// hostiamo tutto dal client → questi sono tutti valori public, e RLS nel DB è
// l'unico muro tra utenti. Non aggiungere segreti server-side: non c'è un posto
// dove tenerli, e finirebbero nel bundle.
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_NEON_AUTH_URL: z.url(),
    // Ora obbligatoria: il NeonRepository interroga la Data API.
    EXPO_PUBLIC_NEON_DATA_API_URL: z.url(),
    // Dev-only auto-login (mai in prod: usato solo dietro `__DEV__`, vedi src/data/auth.ts).
    EXPO_PUBLIC_DEV_AUTOLOGIN: z
      .string()
      .optional()
      .transform((v) => v === 'true'),
    EXPO_PUBLIC_DEV_AUTOLOGIN_EMAIL: z.string().optional(),
    EXPO_PUBLIC_DEV_AUTOLOGIN_PASSWORD: z.string().optional(),
    EXPO_PUBLIC_ADMIN_EMAILS: z.string().optional(),
  },
  // Expo inlina SOLO i `process.env.EXPO_PUBLIC_X` referenziati staticamente in
  // dot-notation: mappo ogni var a mano (il bulk `process.env` non verrebbe inlined).
  runtimeEnv: {
    EXPO_PUBLIC_NEON_AUTH_URL: process.env.EXPO_PUBLIC_NEON_AUTH_URL,
    EXPO_PUBLIC_NEON_DATA_API_URL: process.env.EXPO_PUBLIC_NEON_DATA_API_URL,
    EXPO_PUBLIC_DEV_AUTOLOGIN: process.env.EXPO_PUBLIC_DEV_AUTOLOGIN,
    EXPO_PUBLIC_DEV_AUTOLOGIN_EMAIL: process.env.EXPO_PUBLIC_DEV_AUTOLOGIN_EMAIL,
    EXPO_PUBLIC_DEV_AUTOLOGIN_PASSWORD: process.env.EXPO_PUBLIC_DEV_AUTOLOGIN_PASSWORD,
    EXPO_PUBLIC_ADMIN_EMAILS: process.env.EXPO_PUBLIC_ADMIN_EMAILS,
  },
  // Stringa vuota in .env → undefined → fallisce la validazione (fail-fast se non configurato).
  emptyStringAsUndefined: true,
});
