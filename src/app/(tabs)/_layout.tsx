import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { VectorIcon } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const colors = useTheme();

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Wishlist</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<VectorIcon family={MaterialIcons} name="favorite" />} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deck">
        <NativeTabs.Trigger.Label>Deck</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={<VectorIcon family={MaterialIcons} name="style" />} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
