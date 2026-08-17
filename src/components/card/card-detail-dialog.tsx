// Dettaglio di una carta, Dialog globale (montato una volta nel root layout).
// La carta arriva dallo store useCardDetail; qui è tutto presentazionale, niente
// fetch. Toggle in alto tra "Dettagli" (artwork + specifiche + testo effetto) e
// "Carta" (l'immagine intera, leggibile). Il toggle è state locale: la modalità
// riparte da "Dettagli" a ogni apertura, non si persiste.
// In "Dettagli", se la finestra è più larga che alta (`side`), artwork e info
// stanno affiancati invece che impilati: l'altezza scarseggia, la larghezza no.
import { Image } from "expo-image";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
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
import { useCardDetail } from "@/hooks/card/use-card-detail";
import { useDialogScrollBounds } from "@/hooks/shared/use-dialog-scroll-bounds";

type Mode = "details" | "card";

export function CardDetailDialog() {
  const { colors } = useTheme();
  const card = useCardDetail((s) => s.detailCard);
  const close = useCardDetail((s) => s.close);
  const [mode, setMode] = useState<Mode>("details");
  const {
    dialogStyle,
    scrollAreaMaxHeight,
    topChromeStyle,
    titleStyle,
    scrollAreaStyle,
    actionsStyle,
    side,
    onTopLayout,
    onBottomLayout,
  } = useDialogScrollBounds();

  if (!card) return null;

  const onClose = () => {
    setMode("details");
    close();
  };

  return (
    <Portal>
      <Dialog visible onDismiss={onClose} style={[dialogWidth, dialogStyle]}>
        <View onLayout={onTopLayout} style={topChromeStyle}>
          <Dialog.Title numberOfLines={2} style={titleStyle}>
            {card.name}
          </Dialog.Title>

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
        </View>

        <Dialog.ScrollArea
          style={[scrollAreaStyle, { maxHeight: scrollAreaMaxHeight }]}
        >
          <ScrollView contentContainerStyle={styles.content}>
            {mode === "details" ? (
              <View style={side ? styles.row : styles.stack}>
                {card.card_images[0]?.image_url_cropped ? (
                  <Image
                    source={{
                      uri: cardImageUrl(card.card_images[0].image_url_cropped, {
                        width: 400,
                      }),
                    }}
                    style={side ? styles.artworkSide : styles.artwork}
                    contentFit="contain"
                  />
                ) : null}
                <View style={side ? styles.info : styles.stack}>
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
                </View>
              </View>
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

        <Dialog.Actions onLayout={onBottomLayout} style={actionsStyle}>
          <Button onPress={onClose}>Chiudi</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const ARTWORK_WIDTH = 280; // cappa in colonna, larghezza fissa affiancato

const styles = StyleSheet.create({
  // il chrome (topChrome, titolo, ScrollArea, azioni) è stretto e arriva
  // dall'hook: qui solo ciò che è specifico del dettaglio carta.
  toggle: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.two,
  },
  content: {
    paddingVertical: Spacing.two,
    gap: Spacing.three,
  },
  // affiancati: artwork a larghezza fissa, le info si prendono il resto. Lo
  // scroll resta uno solo e scorre tutta la riga.
  stack: {
    gap: Spacing.three,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.three,
  },
  info: {
    flex: 1,
    gap: Spacing.three,
  },
  artwork: {
    width: "100%",
    maxWidth: ARTWORK_WIDTH, // cappata: non riempie il dialog largo
    aspectRatio: 1, // artwork croppato 1:1
    alignSelf: "center",
    borderRadius: Spacing.two,
  },
  artworkSide: {
    width: ARTWORK_WIDTH, // fissa: in riga il 100% sarebbe la riga intera
    aspectRatio: 1,
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
    borderRadius: Spacing.two,
  },
});
