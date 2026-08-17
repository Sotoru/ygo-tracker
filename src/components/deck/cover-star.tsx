// Stella "carta in evidenza" sull'angolo di una cella del deck.
//  - è la copertina scelta → stella piena, non tappabile (si azzera dal kebab)
//  - nessuna copertina scelta e sei il proprietario → pick-mode, stella vuota tappabile
//  - copertina già scelta altrove, o non sei il proprietario → niente stella
import { Pressable } from 'react-native';
import { Icon, useTheme } from 'react-native-paper';

import { useSetDeckCover } from '@/hooks/deck/use-decks';

export function CoverStar({
  deckId,
  cardId,
  coverCardId,
  canPick,
}: {
  deckId: string;
  cardId: number;
  coverCardId: number | null;
  canPick: boolean; // proprietario loggato
}) {
  const { colors } = useTheme();
  const setCover = useSetDeckCover();

  if (coverCardId === cardId) return <Icon source="star" color={colors.primary} size={24} />;
  if (coverCardId != null || !canPick) return null;
  return (
    <Pressable
      hitSlop={8}
      accessibilityLabel="Usa come copertina"
      onPress={() => setCover.mutate({ deckId, cardId })}>
      <Icon source="star-outline" color={colors.onSurfaceVariant} size={24} />
    </Pressable>
  );
}
