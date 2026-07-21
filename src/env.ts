// Env tipizzato e validato all'import (t3-env). Client-only: niente `server`
// perché hostiamo tutto dal client → sono tutti valori public. Vedi docs/adr/0005.
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  clientPrefix: "EXPO_PUBLIC_",
  client: {
    EXPO_PUBLIC_NEON_AUTH_URL: z.url(),
    // Ora obbligatoria: il NeonRepository interroga la Data API (docs/adr/0005).
    EXPO_PUBLIC_NEON_DATA_API_URL: z.url(),
  },
  // Expo inlina SOLO i `process.env.EXPO_PUBLIC_X` referenziati staticamente in
  // dot-notation: mappo ogni var a mano (il bulk `process.env` non verrebbe inlined).
  runtimeEnv: {
    EXPO_PUBLIC_NEON_AUTH_URL: process.env.EXPO_PUBLIC_NEON_AUTH_URL,
    EXPO_PUBLIC_NEON_DATA_API_URL: process.env.EXPO_PUBLIC_NEON_DATA_API_URL,
  },
  // Stringa vuota in .env → undefined → fallisce la validazione (fail-fast se non configurato).
  emptyStringAsUndefined: true,
});
