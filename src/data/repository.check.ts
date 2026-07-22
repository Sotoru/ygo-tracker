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

  // deleteCard: rimuove TUTTE le rarità del cardId, lascia intatte le altre carte.
  // Uso una carta usa-e-getta con 2 rarità; la wishlist torna a 1 riga (invariante a valle).
  await repo.setWishlistEntries(11111111, [
    { rarity: 'Ultra Rare', count: 2 },
    { rarity: 'Secret Rare', count: 1 },
  ]);
  await repo.deleteCard(11111111);
  wl = await repo.getWishlist();
  assert.ok(!wl.some((i) => i.cardId === 11111111), 'deleteCard deve rimuovere ogni rarità del cardId');
  assert.equal(wl.length, 1, 'deleteCard non deve toccare le altre carte');

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

  // createDeck con entries (import .ydk): inserisce le voci in blocco
  const imported = await repo.createDeck('Import', 'goat', [
    { cardId: 89631139, zone: 'main', count: 3 },
    { cardId: 1861629, zone: 'extra', count: 1 },
  ]);
  assert.equal((await repo.getDeck(imported.id))!.entries.length, 2, 'createDeck deve inserire le entries');

  // getDecks porta il conteggio carte (somma dei count) senza caricare le entries
  const summaries = await repo.getDecks();
  assert.equal(summaries.find((d) => d.id === imported.id)!.cardCount, 4, 'cardCount = somma dei count');

  // copertina: senza scelta esplicita, fallback = Main con card_id minimo (poi extra, poi side)
  const cover = await repo.createDeck('Cover', 'goat', [
    { cardId: 1861629, zone: 'extra', count: 1 },
    { cardId: 89631139, zone: 'main', count: 3 }, // main, ma card_id > del prossimo
    { cardId: 46986414, zone: 'main', count: 1 }, // main con card_id minimo → è la copertina
  ]);
  let cov = (await repo.getDecks()).find((d) => d.id === cover.id)!;
  assert.equal(cov.coverCardId, 46986414, 'fallback: Main con card_id minimo');
  // scelta esplicita: vince sul fallback (se ancora tra le carte)
  await repo.setDeckCover(cover.id, 89631139);
  cov = (await repo.getDecks()).find((d) => d.id === cover.id)!;
  assert.equal(cov.coverCardId, 89631139, 'la copertina esplicita vince sul fallback');
  assert.equal((await repo.getDeck(cover.id))!.deck.coverCardId, 89631139, 'getDeck espone la scelta esplicita');
  // copertina esplicita non più nel deck → torna al fallback
  await repo.setDeckEntry(cover.id, 89631139, 'main', 0);
  cov = (await repo.getDecks()).find((d) => d.id === cover.id)!;
  assert.equal(cov.coverCardId, 46986414, 'copertina esplicita rimossa dal deck → fallback');
  // azzerare la copertina → fallback
  await repo.setDeckCover(cover.id, null);
  assert.equal((await repo.getDeck(cover.id))!.deck.coverCardId, null, 'setDeckCover(null) azzera la scelta');

  // setDeckFormat: cambia il format del deck giusto, lascia intatti gli altri
  await repo.setDeckFormat(cover.id, 'edison');
  assert.equal((await repo.getDeck(cover.id))!.deck.format, 'edison', 'setDeckFormat deve cambiare il format');
  assert.equal((await repo.getDeck(imported.id))!.deck.format, 'goat', 'setDeckFormat non deve toccare gli altri deck');

  // setDeckName: rinomina il deck giusto (clock deterministico: niente check sul bump)
  await repo.setDeckName(cover.id, 'Rinominato');
  assert.equal((await repo.getDeck(cover.id))!.deck.name, 'Rinominato', 'setDeckName deve cambiare il nome');
  assert.equal((await repo.getDeck(imported.id))!.deck.name, 'Import', 'setDeckName non deve toccare gli altri deck');

  // replaceDeckEntries: rimpiazza IN BLOCCO le entries (Salva editor / re-import)
  await repo.replaceDeckEntries(cover.id, [
    { cardId: 55144522, zone: 'main', count: 2 }, // Pot of Greed
    { cardId: 1861629, zone: 'extra', count: 1 },
  ]);
  let after = await repo.getDeck(cover.id);
  assert.equal(after!.entries.length, 2, 'replace deve sostituire tutte le entries');
  assert.equal(after!.entries.find((e) => e.cardId === 55144522)!.count, 2);
  assert.equal(
    (await repo.getDeck(imported.id))!.entries.length,
    2,
    'replace non deve toccare le entries di altri deck',
  );
  // replace con lista vuota = deck svuotato
  await repo.replaceDeckEntries(cover.id, []);
  after = await repo.getDeck(cover.id);
  assert.equal(after!.entries.length, 0, 'replace con [] deve svuotare il deck');

  console.log('OK repository self-check');
}

main();
