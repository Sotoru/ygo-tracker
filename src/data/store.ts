// Cablaggio dell'app: la Wishlist vive su Neon (Data API + RLS), client-only,
// cross-platform. Vedi docs/adr/0005. I Deck non sono ancora cablati (UI stub):
// repository.ts (impl locale su AsyncStorage) resta come base per quando i Deck
// si costruiranno davvero — non è importato da nessuna schermata oggi.
export { neonWishlist as wishlist } from './neon-repository';
