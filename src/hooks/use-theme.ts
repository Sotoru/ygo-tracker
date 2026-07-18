/**
 * Adapter: i vecchi nomi di token colore, ora presi dai ruoli MD3 del tema
 * Paper (sorgente unica). Mantiene invariati i call site esistenti.
 * Vedi docs/adr/0004.
 */
import { useTheme as usePaperTheme } from 'react-native-paper';

import { ColorRole, ThemeColor } from '@/constants/theme';

export function useTheme(): Record<ThemeColor, string> {
  const { colors } = usePaperTheme();
  return Object.fromEntries(
    Object.entries(ColorRole).map(([name, role]) => [name, colors[role as keyof typeof colors]]),
  ) as Record<ThemeColor, string>;
}
