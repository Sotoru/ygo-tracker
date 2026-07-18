# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Cross-platform first

Riusa lo stesso codice su web e mobile. Evita scelte "solo per questo device": niente file `.web.tsx` o rami `Platform.OS` se non quando una capability differisce davvero — e in quel caso isola la parte specifica dietro un piccolo modulo. Preferisci primitive cross-platform (`View`/`Text`/`Pressable`, `expo-image`) e API che funzionano ovunque (es. AsyncStorage, che gira anche su web).
