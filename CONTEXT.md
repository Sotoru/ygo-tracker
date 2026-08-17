# Yu-Gi-Oh! Deck & Wishlist — Glossario del dominio

Il linguaggio condiviso dell'app: cosa significano i termini nel codice e tra di
noi. Solo dominio, niente dettagli tecnici (quelli stanno nel `README.md`).
Termini canonici in **inglese** (sono quelli del codice), definizioni in italiano.

## Utente

**User**: la persona autenticata (login Google) che possiede la propria
`Wishlist` e i propri `Deck`. Ogni dato è **per-`User`**: quando il glossario
dice `Wishlist`/`Deck` intende sempre quelli dell'`User` corrente.

## Carte

**Card**: la carta astratta di gioco (nome, effetto, ATK/DEF, tipo), indipendente
da dove è stampata. Un `Deck` è fatto di `Card`.

**Card Type** (Monster / Spell / Trap): la categoria di gioco di una `Card`,
derivata dal `frameType` di YGOPRODeck (Monster = tutti i frame mostro, incluse
le varianti Pendulum). È la suddivisione con cui le `Card` si presentano
**dentro** una `Zone`, e **non determina mai** l'appartenenza a una `Zone`.

**Print**: una pubblicazione concreta di una `Card` (`Card` + `Set` + `Rarity`),
identità naturale `set_code` + rarità. Sono le `card_sets` di YGOPRODeck.

**Set**: l'espansione in cui una `Card` è pubblicata (es. `LOB`). Attributo di
una `Print`.

**Rarity**: la rarità di una `Print` (Common, Rare, Ultra Rare, …). Attributo
della `Print`, mai della `Card`: la stessa `Card` esce in rarità diverse anche
nello stesso `Set`.

## Wishlist

**Wishlist**: l'insieme delle coppie (`Card`, `Rarity`) desiderate, identità
(`cardId`, `rarity`). Il `Set` è **deliberatamente ignorato**: interessa quella
rarità di quella carta, non da quale espansione arriva. Ogni voce porta le
**copie desiderate** (`count` 1–9; `0` rimuove la voce).

**Wanted / Obtained**: il ciclo di vita di una voce. **Wanted** (UI *"Da
prendere"*) è il default, **Obtained** (UI *"Prese"*) significa che ce l'hai,
comprata o no. La voce non lascia la `Wishlist` ed è **reversibile**. Lo stato è
**per-carta**: tutte le rarità di una `Card` lo condividono, mai a metà.

## Deck

**Deck**: un mazzo con un nome, un `Format` obbligatorio e tre `Zone`. Ogni voce
è una coppia (`Card`, copie): un `Deck` referenzia `Card` astratte, non `Print`.

**Zone**: `Main` / `Extra` / `Side`.

**Main Deck**: 40–60 `Card`.

**Extra Deck**: 0–15 `Card`, riservata a Fusion / Synchro / Xyz / Link — la zona
di una `Card` è in parte determinata dal suo tipo, non libera.

**Side Deck**: 0–15 `Card`, per gli scambi tra partite.

**Tournament Deck**: una decklist pubblica e di sola lettura, curata a mano
perché ha ottenuto un `Placement` in un `Tournament`. Catalogo separato dai
`Deck` degli `User`; ha lo stesso `Format` del suo `Tournament`.

**Draft / Published**: il ciclo editoriale di un `Tournament Deck`. Solo
`Published` appare nelle pagine pubbliche.

## Tornei

**Tournament**: un evento competitivo con nome, `Format`, data e location
opzionale. Ogni `Tournament Deck` appartiene a esattamente un `Tournament`.

**Placement**: la fascia di risultato (Winner, Runner-up, Top 4, Top 8, Top 16),
non la posizione esatta.

**Source**: il riferimento opzionale da cui arriva una decklist. Appartiene al
singolo `Tournament Deck`, non al `Tournament`.

## Formati & Banlist

**Format**: il retro format per cui un `Deck` è costruito — **Goat**, **Edison**,
**HAT**, **Tengu**, **REDU**. Elenco estendibile come dato (registro `FORMATS`),
non come codice. Ogni `Deck` ha esattamente un `Format`.

**Banlist**: la Forbidden & Limited List fissa e storica di un `Format`. Dato
**statico impacchettato nell'app, mai recuperato live**: i retro format non
cambiano. Assegna a ogni `Card` un `Ban Status`.

**Ban Status**: **Forbidden** (0 copie), **Limited** (1), **Semi-Limited** (2),
**Unlimited** (3, default).

**Card Pool**: le `Card` legali in un `Format`, limitate all'era del formato e
approssimate per data di uscita (`enddate`). Il cutoff (`poolCutoffDate`) è
dichiarato nel registro ma non ancora popolato né applicato.

## Fuori scope — recinti deliberati, non dimenticanze

- **Collezione** (il posseduto, con quantità e condizione): diversa dalla `Wishlist`, che è ciò che *vuoi*.
- **Edition** (1st / Unlimited / Limited): assente nei dati della fonte, andrebbe inserita a mano.
- **Wishlist per `Set`**: tolta di proposito — la `Wishlist` vive su (`Card`, `Rarity`), ed è per questo che `wishlist_items` non ha una colonna `set`.
