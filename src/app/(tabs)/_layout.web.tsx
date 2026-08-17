import { Slot, usePathname, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  Dialog,
  IconButton,
  List,
  Menu,
  Portal,
  SegmentedButtons,
  Switch,
  useTheme,
} from "react-native-paper";

import { cappedWidth, dialogWidth, Spacing } from "@/constants/theme";
import { signOut } from "@/data/auth";
import { CARD_VIEW_OPTIONS, useSettings } from "@/hooks/shared/use-settings";

export default function AppTabs() {
  const router = useRouter();
  const { colors } = useTheme();
  const value = usePathname().startsWith("/deck") ? "deck" : "wishlist";
  const [settingsOpen, setSettingsOpen] = useState(false);
  const {
    cardView,
    setCardView,
    rarityShort,
    setRarityShort,
    groupRows,
    setGroupRows,
    sortByCopies,
    setSortByCopies,
    groupByFormat,
    setGroupByFormat,
    frameTint,
    setFrameTint,
  } = useSettings();
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const viewLabel =
    CARD_VIEW_OPTIONS.find((o) => o.value === cardView)?.label ?? cardView;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Barra in flusso (non assoluta): il suo marginBottom è lo spazio verso la
          search bar della schermata. Lo "spazio tab" vive qui, non nello screen. */}
      <View style={styles.barContainer}>
        <View style={styles.bar}>
          <SegmentedButtons
            value={value}
            onValueChange={(v) => router.replace(v === "deck" ? "/deck" : "/")}
            style={styles.segmented}
            buttons={[
              { value: "wishlist", label: "Wishlist", icon: "heart" },
              { value: "deck", label: "Deck", icon: "cards" },
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
        <Dialog
          visible={settingsOpen}
          onDismiss={() => setSettingsOpen(false)}
          style={dialogWidth}
        >
          <Dialog.Title>Impostazioni</Dialog.Title>
          <Dialog.Content>
            {/* Una sezione per area dell'app: le preferenze crescono, il dialog resta
                leggibile. Logout in fondo, fuori dalle sezioni. */}
            <List.Subheader>Wishlist</List.Subheader>
            {/* Menu con valore corrente a destra: apre le opzioni (estensibili via
                CARD_VIEW_OPTIONS). Persistito nelle Impostazioni (vedi use-settings). */}
            <Menu
              visible={viewMenuOpen}
              onDismiss={() => setViewMenuOpen(false)}
              anchor={
                <List.Item
                  title="Visualizzazione card"
                  description={viewLabel}
                  left={(props) => (
                    <List.Icon {...props} icon="view-grid-outline" />
                  )}
                  onPress={() => setViewMenuOpen(true)}
                />
              }
            >
              {CARD_VIEW_OPTIONS.map((o) => (
                <Menu.Item
                  key={o.value}
                  title={o.label}
                  trailingIcon={o.value === cardView ? "check" : undefined}
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
              left={(props) => (
                <List.Icon {...props} icon="format-letter-case" />
              )}
              right={() => (
                <Switch value={rarityShort} onValueChange={setRarityShort} />
              )}
              onPress={() => setRarityShort(!rarityShort)}
            />
            {/* Stessa tinta per frame dei deck, applicata alle carte in wishlist (righe e
                celle): il tipo si legge dal colore. Spenta = sfondo neutro del tema. */}
            <List.Item
              title="Colore per tipo di carta"
              description="Sfondo tinto come il frame: verde magie, rosa trappole…"
              left={(props) => <List.Icon {...props} icon="palette" />}
              right={() => <Switch value={frameTint} onValueChange={setFrameTint} />}
              onPress={() => setFrameTint(!frameTint)}
            />

            <List.Subheader>Deck</List.Subheader>
            {/* Lista deck: una sezione per banlist (titolo = nome della banlist), e il
                nome esce dal sottotitolo delle card, dove sarebbe ripetuto. */}
            <List.Item
              title="Dividi per banlist"
              description="Una sezione per banlist invece della lista piatta"
              left={(props) => <List.Icon {...props} icon="format-list-group" />}
              right={() => (
                <Switch value={groupByFormat} onValueChange={setGroupByFormat} />
              )}
              onPress={() => setGroupByFormat(!groupByFormat)}
            />
            {/* Nel dettaglio deck, dentro ogni zona: ogni gruppo su righe sue (la griglia
                si chiude a fine gruppo). Spenta = griglia continua, l'ordine dei gruppi
                resta comunque. */}
            <List.Item
              title="Gruppi a capo"
              description="Mostri / Magie / Trappole, e per tipo nell'Extra"
              left={(props) => <List.Icon {...props} icon="format-list-text" />}
              right={() => <Switch value={groupRows} onValueChange={setGroupRows} />}
              onPress={() => setGroupRows(!groupRows)}
            />
            {/* 3x → 2x → 1x DENTRO il gruppo: non mischia mai mostri, magie e trappole. */}
            <List.Item
              title="Ordina per copie"
              description="Prima le 3x, poi 2x, poi 1x"
              left={(props) => <List.Icon {...props} icon="sort-numeric-descending" />}
              right={() => <Switch value={sortByCopies} onValueChange={setSortByCopies} />}
              onPress={() => setSortByCopies(!sortByCopies)}
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
    alignItems: "center",
  },
  bar: {
    ...cappedWidth,
    flexDirection: "row",
    alignItems: "center",
  },
  segmented: {
    flex: 1,
  },
});
