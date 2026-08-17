// Dettaglio di una carta, Dialog globale (montato una volta nel root layout).
// La carta arriva dallo store useCardDetail; qui è tutto presentazionale, niente
// fetch. Artwork croppato + testo effetto + specifiche; toccando l'artwork la
// carta INTERA (quella con il testo stampato) si apre a tutto schermo in un
// secondo Portal. Non serve z-index: PortalManager accoda i portal in ordine di
// mount, quindi quello dello zoom dipinge sopra il Dialog, che resta montato
// sotto — chiudi lo zoom e sei dove eri.
// In dettaglio, se la finestra è più larga che alta (`side`), artwork e info
// stanno affiancati invece che impilati: l'altezza scarseggia, la larghezza no.
// ponytail: niente pinch/pan nello zoom — il motivo per cui uno pizzicherebbe è
// leggere l'effetto, e l'effetto è già qui in chiaro e selezionabile. Se serve,
// il Pressable diventa un GestureDetector senza toccare il resto.
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
  Button,
  Dialog,
  Icon,
  IconButton,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { dialogWidth, Spacing } from "@/constants/theme";
import { cardImageUrl } from "@/data/ygoprodeck";
import { cardSpecs } from "@/domain/card-specs";
import { useCardDetail } from "@/hooks/card/use-card-detail";
import { useDialogScrollBounds } from "@/hooks/shared/use-dialog-scroll-bounds";

export function CardDetailDialog() {
  const { colors } = useTheme();
  const card = useCardDetail((s) => s.detailCard);
  const close = useCardDetail((s) => s.close);
  const [zoomed, setZoomed] = useState(false);
  const insets = useSafeAreaInsets(); // la X è ancorata in alto: senza inset finisce sotto il notch
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
    setZoomed(false);
    close();
  };

  // ponytail: solo il primo artwork, come tutto il resto del repo (card-cell,
  // card-row, cover dei deck). Gli artwork alternativi vorrebbero una galleria.
  const image = card.card_images[0];

  return (
    <>
      <Portal>
        <Dialog visible onDismiss={onClose} style={[dialogWidth, dialogStyle]}>
          <View onLayout={onTopLayout} style={topChromeStyle}>
            <Dialog.Title numberOfLines={2} style={titleStyle}>
              {card.name}
            </Dialog.Title>
          </View>

          <Dialog.ScrollArea
            style={[scrollAreaStyle, { maxHeight: scrollAreaMaxHeight }]}
          >
            <ScrollView contentContainerStyle={styles.content}>
              <View style={side ? styles.row : styles.stack}>
                {image?.image_url_cropped ? (
                  // il box del Pressable è esattamente quello dell'artwork: in riga
                  // un tap sul vuoto accanto non deve aprire lo zoom.
                  <Pressable
                    style={side ? styles.artworkSide : styles.artwork}
                    onPress={() => setZoomed(true)}
                    disabled={!image.image_url}
                    accessibilityRole="button"
                    accessibilityLabel="Mostra la carta intera"
                  >
                    <Image
                      source={{
                        uri: cardImageUrl(image.image_url_cropped, {
                          width: 400,
                        }),
                      }}
                      style={styles.artworkImage}
                      contentFit="contain"
                    />
                    {/* togliendo il vecchio toggle sparirebbe l'unico cartello che
                        dichiara l'esistenza della carta intera: questo lo rimpiazza */}
                    {image.image_url ? (
                      <View
                        style={[
                          styles.zoomHint,
                          { backgroundColor: colors.secondaryContainer },
                        ]}
                      >
                        <Icon
                          source="magnify-plus-outline"
                          size={18}
                          color={colors.onSecondaryContainer}
                        />
                      </View>
                    ) : null}
                  </Pressable>
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
            </ScrollView>
          </Dialog.ScrollArea>

          <Dialog.Actions onLayout={onBottomLayout} style={actionsStyle}>
            <Button onPress={onClose}>Chiudi</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Portal fratello, montato dopo quello del Dialog → sopra. Scrim opaco e
          non backdrop: il backdrop di Paper è translucido (0.4) e lascerebbe
          trasparire la surface del Dialog dietro l'immagine. */}
      {zoomed && image?.image_url ? (
        <Portal>
          <Animated.View
            entering={FadeIn.duration(150)}
            style={[styles.zoom, { backgroundColor: colors.scrim }]}
          >
            {/* accessible={false}: il tap-ovunque è una comodità per chi vede, il
                controllo etichettato è la X — altrimenti due bottoni identici */}
            <Pressable
              accessible={false}
              style={styles.zoomPress}
              onPress={() => setZoomed(false)}
            >
              <Image
                // senza width: l'originale (813×1185) è il massimo disponibile e
                // l'URL è identico per tutti → miglior cache, sul proxy e sul device.
                source={{ uri: cardImageUrl(image.image_url) }}
                style={styles.zoomImage}
                contentFit="contain"
                transition={150}
              />
            </Pressable>

            {/* dopo il Pressable → sopra, quindi riceve il tap. Stessa coppia di
                ruoli della pastiglia lente: leggibile su qualunque artwork. */}
            <IconButton
              icon="close"
              mode="contained"
              containerColor={colors.secondaryContainer}
              iconColor={colors.onSecondaryContainer}
              accessibilityLabel="Chiudi l'immagine"
              onPress={() => setZoomed(false)}
              style={[styles.zoomClose, { top: insets.top + Spacing.three }]}
            />
          </Animated.View>
        </Portal>
      ) : null}
    </>
  );
}

const ARTWORK_WIDTH = 280; // cappa in colonna, larghezza fissa affiancato

const styles = StyleSheet.create({
  // il chrome (topChrome, titolo, ScrollArea, azioni) è stretto e arriva
  // dall'hook: qui solo ciò che è specifico del dettaglio carta.
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
  // la geometria sta sul Pressable, non sull'immagine: è lui l'area toccabile.
  artwork: {
    width: "100%",
    maxWidth: ARTWORK_WIDTH, // cappata: non riempie il dialog largo
    aspectRatio: 1, // artwork croppato 1:1
    alignSelf: "center",
  },
  artworkSide: {
    width: ARTWORK_WIDTH, // fissa: in riga il 100% sarebbe la riga intera
    aspectRatio: 1,
  },
  artworkImage: {
    width: "100%",
    height: "100%",
    borderRadius: Spacing.two,
  },
  zoomHint: {
    position: "absolute",
    right: Spacing.one,
    bottom: Spacing.one,
    padding: Spacing.one,
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
  zoom: {
    position: "absolute",
    inset: 0,
    padding: Spacing.three, // l'immagine non tocca i bordi né finisce sotto il notch
  },
  zoomPress: {
    flex: 1, // tap in qualunque punto → chiude
  },
  zoomClose: {
    position: "absolute",
    // stesso valore del padding dell'overlay: la X si allinea al bordo del
    // contenuto invece di appiccicarsi allo schermo. `top` arriva dal
    // componente, perché ci somma gli inset.
    right: Spacing.three,
    margin: 0, // IconButton ha un margine di default che sfalserebbe l'angolo
  },
  zoomImage: {
    flex: 1, // `contain` fa il letterboxing: nessun aspectRatio da tenere allineato
    width: "100%",
  },
});
