// Appbar delle schermate fuori dalle tab. `fallback` è la rotta dove tornare quando
// non c'è history: deep link o reload su web arrivano senza stack, e senza fallback
// il back non farebbe niente. Le azioni a destra passano come children.
import { useRouter, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { Appbar } from 'react-native-paper';

import { cappedWidth } from '@/constants/theme';

export function ScreenHeader({
  title,
  subtitle,
  fallback,
  children,
}: {
  title: string;
  subtitle?: string;
  fallback: Href;
  children?: ReactNode;
}) {
  const router = useRouter();
  return (
    <Appbar.Header style={styles.appbar}>
      <Appbar.BackAction onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))} />
      <Appbar.Content title={title} subtitle={subtitle} />
      {children}
    </Appbar.Header>
  );
}

// barra cappata come il resto dell'app e centrata, sfondo trasparente
export const appbarStyle = { ...cappedWidth, backgroundColor: 'transparent' as const };

const styles = StyleSheet.create({ appbar: appbarStyle });
