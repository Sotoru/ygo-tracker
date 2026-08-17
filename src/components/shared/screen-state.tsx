// Gli stati non-contenuto che ogni schermata disegna allo stesso modo: spinner
// centrato e messaggio centrato (caricamento, errore di rete, "non trovato", vuoto).
// Prima erano copiaincollati in 8 schermate, ognuna con la sua copia dello stile `msg`
// e la sua catena di ternari annidati.
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

import { Spacing } from '@/constants/theme';

const NETWORK_ERROR = 'Errore di rete. Riprova.';

export function ScreenLoading() {
  return <ActivityIndicator style={styles.msg} />;
}

export function ScreenMessage({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
      {children}
    </Text>
  );
}

/**
 * Il contenuto di una schermata, o lo stato che ne prende il posto. L'ordine è quello
 * dei controlli: permesso → caricamento → errore → dato assente → dato vuoto → contenuto.
 * `children` è una funzione perché riceve il dato già garantito presente: le schermate
 * di dettaglio lo dereferenziano subito e non devono ricontrollarlo.
 *
 *  - `gate`     messaggio che vince su tutto (es. "Accesso riservato admin.")
 *  - `notFound` messaggio di dettaglio: vale sia per l'errore sia per il dato assente
 *               (una schermata di dettaglio dice "non trovato" in entrambi i casi);
 *               omesso, l'errore mostra il messaggio di rete
 *  - `empty`    messaggio per una lista arrivata vuota
 */
export function ScreenState<T>({
  gate,
  loading,
  error,
  notFound,
  empty,
  data,
  children,
}: {
  gate?: string;
  loading?: boolean;
  error?: boolean;
  notFound?: string;
  empty?: string;
  data: T | null | undefined;
  children: (data: T) => ReactNode;
}) {
  if (gate) return <ScreenMessage>{gate}</ScreenMessage>;
  if (loading) return <ScreenLoading />;
  if (error) return <ScreenMessage>{notFound ?? NETWORK_ERROR}</ScreenMessage>;
  if (data == null) return notFound ? <ScreenMessage>{notFound}</ScreenMessage> : null;
  if (empty && Array.isArray(data) && data.length === 0) return <ScreenMessage>{empty}</ScreenMessage>;
  return <>{children(data)}</>;
}

const styles = StyleSheet.create({
  msg: { textAlign: 'center', paddingVertical: Spacing.six, paddingHorizontal: Spacing.three, width: '100%' },
});
