// Dettaglio di una carta, Dialog globale (montato una volta nel root layout).
// La carta arriva dallo store useCardDetail; qui è tutto presentazionale, niente
// fetch. Toggle in alto tra "Dettagli" (artwork + specifiche + testo effetto) e
// "Carta" (l'immagine intera, leggibile). Il toggle è state locale: la modalità
// riparte da "Dettagli" a ogni apertura, non si persiste.
import { Image } from "expo-image";
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Button,
  Dialog,
  Portal,
  SegmentedButtons,
  Text,
  useTheme,
} from "react-native-paper";

import { dialogWidth, Spacing } from "@/constants/theme";
import { cardImageUrl } from "@/data/ygoprodeck";
import { cardSpecs } from "@/domain/card-specs";
import { useCardDetail } from "@/hooks/use-card-detail";

type Mode = "details" | "card";

export function CardDetailDialog() {
  const { colors } = useTheme();
  const { height } = useWindowDimensions();
  const card = useCardDetail((s) => s.detailCard);
  const close = useCardDetail((s) => s.close);
  const [mode, setMode] = useState<Mode>("details");

  if (!card) return null;

  // riparte da "Dettagli" a ogni apertura: reset alla chiusura
  const onClose = () => {
    setMode("details");
    close();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onClose} style={dialogWidth}>
        <Dialog.Title numberOfLines={2}>{card.name}</Dialog.Title>

        <View style={styles.toggle}>
          <SegmentedButtons
            value={mode}
            onValueChange={(v) => setMode(v as Mode)}
            buttons={[
              { value: "details", label: "Dettagli", icon: "text-box" },
              { value: "card", label: "Carta", icon: "image" },
            ]}
          />
        </View>

        <Dialog.ScrollArea
          style={[styles.scrollArea, { maxHeight: height * 0.8 }]}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {mode === "details" ? (
              <>
                {card.card_images[0]?.image_url_cropped ? (
                  <Image
                    source={{
                      uri: cardImageUrl(card.card_images[0].image_url_cropped, {
                        width: 400,
                      }),
                    }}
                    style={styles.artwork}
                    contentFit="contain"
                  />
                ) : null}
                {card.desc ? (
                  <Text
                    variant="bodyMedium"
                    selectable
                    style={[
                      styles.desc,
                      {
                        backgroundColor: colors.primaryContainer,
                        color: colors.onPrimaryContainer,
                      },
                    ]}
                  >
                    {card.desc}
                  </Text>
                ) : null}
                <View style={styles.specs}>
                  {cardSpecs(card).map(({ label, value }) => (
                    <View key={label} style={styles.specRow}>
                      <Text
                        variant="labelLarge"
                        style={{ color: colors.onSurfaceVariant }}
                      >
                        {label}
                      </Text>
                      <Text variant="bodyMedium" style={styles.specValue}>
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : card.card_images[0]?.image_url ? (
              <Image
                source={{
                  uri: cardImageUrl(card.card_images[0].image_url, {
                    width: 600,
                  }),
                }}
                style={styles.fullCard}
                contentFit="contain"
              />
            ) : (
              <Text
                variant="bodyMedium"
                style={{ color: colors.onSurfaceVariant }}
              >
                Immagine non disponibile.
              </Text>
            )}
          </ScrollView>
        </Dialog.ScrollArea>

        <Dialog.Actions>
          <Button onPress={onClose}>Chiudi</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  toggle: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  scrollArea: {
    paddingHorizontal: Spacing.four,
  },
  content: {
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  artwork: {
    width: "100%",
    maxWidth: 280, // cappata: non riempie il dialog largo
    aspectRatio: 1, // artwork croppato 1:1
    alignSelf: "center",
    borderRadius: Spacing.two,
  },
  specs: {
    gap: Spacing.one,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: Spacing.three,
  },
  specValue: {
    flexShrink: 1,
    textAlign: "right",
  },
  desc: {
    // testo effetto: pannello tinta seed (primaryContainer), più scuro della surface
    padding: Spacing.three,
    borderRadius: Spacing.two,
  },
  fullCard: {
    width: "100%",
    maxWidth: 380, // come sopra: cappata e centrata, non a piena larghezza
    aspectRatio: 421 / 614, // ratio carta intera YGOPRODeck
    alignSelf: "center",
    borderRadius: Spacing.two, // angoli leggermente arrotondati
  },
});
