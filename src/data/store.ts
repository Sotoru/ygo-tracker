// Cablaggio dell'app: Wishlist e Deck vivono su Neon (Data API + RLS), client-only,
// cross-platform. Le interfacce del seam stanno in repository.ts.
export { neonWishlist as wishlist } from './neon-repository';
export { neonDecks as decks } from './neon-decks';
export { neonTournaments as tournaments } from './neon-tournaments';
