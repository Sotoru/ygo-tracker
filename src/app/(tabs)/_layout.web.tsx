import { Slot, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, IconButton, List, Menu, Portal, SegmentedButtons, Switch, useTheme } from 'react-native-paper';

import { dialogWidth, MaxContentWidth, Spacing } from '@/constants/theme';
import { signOut } from '@/data/auth';
import { CARD_VIEW_OPTIONS, useSettings } from '@/hooks/use-settings';

export default function AppTabs() {
  const router = useRouter();
  const { colors } = useTheme();
  const value = usePathname().startsWith('/deck') ? 'deck' : 'wishlist';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { cardView, setCardView, rarityShort, setRarityShort } = useSettings();
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewLabel = CARD_VIEW_OPTIONS.find((o) => o.value === cardView)?.label ?? cardView;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra in flusso (non assoluta): il suo marginBottom è lo spazio verso la
          search bar della schermata. Lo "spazio tab" vive qui, non nello screen. */}
      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <SegmentedButtons
            value={value}
            onValueChange={(v) => router.replace(v === 'deck' ? '/deck' : '/')}
            style={styles.segmented}
            buttons={[
              { value: 'wishlist', label: 'Wishlist', icon: 'heart' },
              { value: 'deck', label: 'Deck', icon: 'cards' },
            ]}
          />
          <IconButton
            icon="cog"
            mode="contained-tonal"
            accessibilityLabel="Impostazioni"
            onPress={() => setSettingsOpen(true)}
          />
        </View>
      </View>

      <Slot />

      <Portal>
        <Dialog visible={settingsOpen} onDismiss={() => setSettingsOpen(false)} style={dialogWidth}>
          <Dialog.Title>Impostazioni</Dialog.Title>
          <Dialog.Content>
            {/* Menu con valore corrente a destra: apre le opzioni (estensibili via
                CARD_VIEW_OPTIONS). Persistito nelle Impostazioni (vedi use-settings). */}
            <Menu
              visible={viewMenuOpen}
              onDismiss={() => setViewMenuOpen(false)}
              anchor={
                <List.Item
                  title="Visualizzazione card"
                  description={viewLabel}
                  left={(props) => <List.Icon {...props} icon="view-grid-outline" />}
                  onPress={() => setViewMenuOpen(true)}
                />
              }>
              {CARD_VIEW_OPTIONS.map((o) => (
                <Menu.Item
                  key={o.value}
                  title={o.label}
                  trailingIcon={o.value === cardView ? 'check' : undefined}
                  onPress={() => {
                    setCardView(o.value);
                    setViewMenuOpen(false);
                  }}
                />
              ))}
            </Menu>
            {/* Booleano → Switch (un tap). Abbrevia le rarità nelle righe wishlist. */}
            <List.Item
              title="Rarità abbreviate"
              left={(props) => <List.Icon {...props} icon="format-letter-case" />}
              right={() => <Switch value={rarityShort} onValueChange={setRarityShort} />}
              onPress={() => setRarityShort(!rarityShort)}
            />
            {/* Il dialog stesso fa da conferma: niente step extra. signOut() svuota
                cache e persister e azzera la sessione → il gate reindirizza a /sign-in. */}
            <List.Item
              title="Logout"
              left={(props) => <List.Icon {...props} icon="logout" />}
              onPress={signOut}
            />
          </Dialog.Content>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  barContainer: {
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  segmented: {
    flex: 1,
  },
});
