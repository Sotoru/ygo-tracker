import { Slot, usePathname, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { SegmentedButtons } from 'react-native-paper';

import { MaxContentWidth, Spacing } from '@/constants/theme';

export default function AppTabs() {
  const router = useRouter();
  const value = usePathname().startsWith('/deck') ? 'deck' : 'wishlist';

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      <View style={styles.barContainer} pointerEvents="box-none">
        <SegmentedButtons
          value={value}
          onValueChange={(v) => router.replace(v === 'deck' ? '/deck' : '/')}
          style={styles.bar}
          buttons={[
            { value: 'wishlist', label: 'Wishlist', icon: 'heart' },
            { value: 'deck', label: 'Deck', icon: 'cards' },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    position: 'absolute',
    top: Spacing.three,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
  },
  bar: {
    width: '100%',
    maxWidth: MaxContentWidth,
  },
});
