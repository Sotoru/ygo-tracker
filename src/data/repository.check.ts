// Self-check del repository. Esegui: npx tsx src/data/repository.check.ts
// Nessun framework: solo assert su un KV in memoria e id/tempo deterministici.
import assert from 'node:assert/strict';

import { createRepository, type KVStore } from './repository';

function memoryKV(): KVStore {
  const m = new Map<string, string>();
  return {
    getItem: async (k) => m.get(k) ?? null,
    setItem: async (k, v) => {
      m.set(k, v);
    },
  };
}

async function main() {
  let n = 0;
  const repo = createRepository(
    memoryKV(),
    () => `id${++n}`,
    () => '2026-01-01T00:00:00.000Z',
  );

  // wishlist: setWishlistEntries riconcilia le rarità di una Card in UNA sola write
  await repo.setWishlistEntries(46986414, [{ rarity: 'Ultra Rare', count: 1 }]);
  await repo.setWishlistEntries(46986414, [{ rarity: 'Ultra Rare', count: 3 }]); // aggiorna, non duplica
  let wl = await repo.getWishlist();
  assert.equal(wl.length, 1, 'stessa (cardId, rarity) non deve creare una seconda riga');
  assert.equal(wl[0].count, 3, 're-set deve aggiornare il count sulla stessa riga');
  const firstId = wl[0].id;

  // REGRESSIONE (il bug segnalato): più rarità in un solo batch si salvano TUTTE
  await repo.setWishlistEntries(46986414, [
    { rarity: 'Ultra Rare', count: 3 },
    { rarity: 'Secret Rare', count: 2 },
    { rarity: 'Rare', count: 1 },
  ]);
  wl = await repo.getWishlist();
  assert.equal(wl.filter((i) => i.cardId === 46986414).length, 3, 'il batch deve salvare tutte le rarità');
  assert.equal(wl.find((i) => i.rarity === 'Ultra Rare')!.id, firstId, 'id stabile sullupsert nel batch');

  // count<=0 rimuove solo la rarità indicata; le altre restano intatte (payload-only)
  await repo.setWishlistEntries(46986414, [{ rarity: 'Rare', count: 0 }]);
  wl = await repo.getWishlist();
  assert.equal(wl.filter((i) => i.cardId === 46986414).length, 2, 'count 0 rimuove solo quella rarità');
  assert.ok(!wl.some((i) => i.rarity === 'Rare'), 'la rarità azzerata sparisce');

  // ciclo di vita Wanted/Obtained: stato per-carta (tutte le righe insieme)
  await repo.setObtained(46986414, true);
  wl = await repo.getWishlist();
  assert.ok(
    wl.filter((i) => i.cardId === 46986414).every((i) => i.obtainedAt),
    'setObtained deve segnare TUTTE le righe della carta',
  );
  // ridesiderare (count>0) riattiva l'intera carta (azzera obtainedAt ovunque)
  await repo.setWishlistEntries(46986414, [{ rarity: 'Ultra Rare', count: 2 }]);
  wl = await repo.getWishlist();
  assert.ok(
    wl.filter((i) => i.cardId === 46986414).every((i) => !i.obtainedAt),
    'ridesiderare deve riportare tutta la carta a Wanted',
  );
  // ma una pura RIMOZIONE (count 0) NON riattiva: la carta resta Presa
  await repo.setObtained(46986414, true);
  await repo.setWishlistEntries(46986414, [{ rarity: 'Secret Rare', count: 0 }]);
  wl = await repo.getWishlist();
  assert.ok(
    wl.filter((i) => i.cardId === 46986414).every((i) => i.obtainedAt),
    'una rimozione non deve riattivare la carta',
  );
  // desegnare rimuove obtainedAt; resta 1 riga per i controlli successivi
  await repo.setObtained(46986414, false);
  wl = await repo.getWishlist();
  assert.ok(wl.every((i) => !i.obtainedAt), 'setObtained(false) deve azzerare');
  assert.equal(wl.length, 1);

  // deck + entries: upsert su (deckId, cardId, zone), id stabile
  const deck = await repo.createDeck('Goat Control', 'goat');
  await repo.setDeckEntry(deck.id, 89631139, 'main', 3);
  await repo.setDeckEntry(deck.id, 89631139, 'main', 2); // aggiorna, non duplica
  let loaded = await repo.getDeck(deck.id);
  assert.equal(loaded!.entries.length, 1);
  assert.equal(loaded!.entries[0].count, 2);

  // count 0 rimuove la voce
  await repo.setDeckEntry(deck.id, 89631139, 'main', 0);
  loaded = await repo.getDeck(deck.id);
  assert.equal(loaded!.entries.length, 0);

  // export = dump relazionale delle tre tabelle
  const snap = await repo.exportAll();
  assert.deepEqual(Object.keys(snap).sort(), ['deckEntries', 'decks', 'wishlistItems']);
  assert.equal(snap.decks.length, 1);
  assert.equal(snap.wishlistItems.length, 1);

  // deleteDeck fa cascade sulle entries
  await repo.setDeckEntry(deck.id, 89631139, 'main', 1);
  await repo.deleteDeck(deck.id);
  assert.equal((await repo.exportAll()).deckEntries.length, 0, 'delete deck deve rimuovere le sue entries');

  console.log('OK repository self-check');
}

main();
