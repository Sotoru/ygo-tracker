// Tab Deck: prima implementazione momentanea. Una voce per retro format; toccando
// si apre /banlist/<format>, il pool di quella banlist diviso per status. Il Deck
// vero e proprio arriverà qui sopra.
import { useRouter } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { List } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { FORMATS, type Format } from '@/domain/types';

export default function DeckScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ThemedView
      style={[styles.screen, { paddingTop: Platform.select({ web: 0, default: insets.top + Spacing.three }) }]}>
      <View style={styles.content}>
        {(Object.keys(FORMATS) as Format[]).map((f) => (
          <List.Item
            key={f}
            title={FORMATS[f].label}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push(`/banlist/${f}`)}
          />
        ))}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: Spacing.three },
  content: { width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
});
