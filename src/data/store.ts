// Cablaggio dell'app: Wishlist e Deck vivono su Neon (Data API + RLS), client-only,
// cross-platform. Vedi docs/adr/0005. repository.ts (impl locale su AsyncStorage)
// resta come base testabile e per un eventuale mode offline.
export { neonWishlist as wishlist } from './neon-repository';
export { neonDecks as decks } from './neon-decks';
export { neonTournaments as tournaments } from './neon-tournaments';
