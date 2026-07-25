# Yu-Gi-Oh! Deck & Wishlist — Glossario del dominio

Il linguaggio condiviso dell'app: cosa significano i termini quando li usiamo
nel codice, nelle issue e tra di noi. Solo dominio, niente dettagli tecnici
(quelli stanno nel `README.md` e in `docs/adr/`).

I termini canonici sono in **inglese** (saranno quelli del codice); le
definizioni in italiano.

## Language

### User

**User**:
La persona autenticata (login Google) che possiede la propria `Wishlist` e i
propri `Deck`. Col passaggio cloud ogni dato è **per-`User`**: utenti diversi non
vedono i dati l'uno dell'altro. Quando il glossario dice `Wishlist`/`Deck` intende
sempre *quelli dell'`User` corrente*.
_Avoid_: Account (record tecnico), profilo, giocatore.

### Carte

**Card**:
La carta astratta di gioco: nome, effetto, ATK/DEF, tipo. Una sola, indipendente
da dove e come è stampata. Un `Deck` è fatto di `Card`.
_Avoid_: Carta stampata (quella è una `Print`).

**Card Type** (Monster / Spell / Trap):
La categoria di gioco di una `Card`, derivata dal `frameType` della fonte
(YGOPRODeck): **Monster** comprende tutti i frame mostro (Normal/Effect/
Ritual/Fusion/Synchro/Xyz/Link, incluse le varianti Pendulum), **Spell** e
**Trap** sono gli altri due. È un attributo della `Card`, indipendente dalla
`Zone`: una `Card` di tipo Monster può stare in Main o Extra secondo il suo
sotto-tipo, mentre Spell/Trap stanno sempre in Main o Side (vedi `Extra Deck`).
Usato per raggruppare visivamente le `Card` all'interno di una `Zone`
(impostazione utente "raggruppa per tipologia" nel dettaglio `Deck`); non
determina mai l'appartenenza a una `Zone`.
_Avoid_: Categoria (già usato per l'archetipo/sottocategoria YGOPRODeck nel
dettaglio carta), tipologia (termine italiano informale — il canonico è Card
Type).

**Print**:
Una pubblicazione concreta di una `Card`, identificata da `Card` + `Set` +
`Rarity` (chiave naturale: `set_code` + rarità). Della stessa `Card` esistono
molte `Print`: sono il dato sorgente (le `card_sets` di YGOPRODeck). La
`Wishlist` **non** è fatta di `Print` — seleziona per `Rarity` collassando i
`Set` (vedi `Wishlist`).
_Avoid_: Copia, versione, edizione.

**Set**:
L'espansione in cui una `Card` è pubblicata (es. *Legend of Blue Eyes*, codice
`LOB`). Attributo di una `Print`.
_Avoid_: Espansione, Expansion.

**Rarity**:
La rarità di una `Print` (Common, Rare, Super/Ultra/Secret Rare, …). La stessa
`Card` può uscire in rarità diverse anche nello stesso `Set`: è quindi un
attributo della `Print`, mai della `Card`. È anche la dimensione su cui vive la
`Wishlist`.

### Wishlist

**Wishlist**:
L'insieme delle coppie (`Card`, `Rarity`) che l'utente desidera. Identità
naturale: (`cardId`, `rarity`). Il `Set` è **deliberatamente ignorato**: al
collezionista interessa *quella rarità* di *quella carta*, non da quale
espansione arriva. Ogni voce porta un numero di **copie desiderate** (`count`,
0–9; `0` = non desiderata): quante ne *vuoi*, non quante ne *possiedi* — il
posseduto resta la `Collezione` (fuori scope).
_Avoid_: Lista desideri, carrello. La Wishlist non distingue per `Set`.

**Wanted / Obtained** (ciclo di vita di una voce di `Wishlist`):
Ogni voce ha uno stato. **Wanted** (UI: *"Da prendere"*) è il default: la vuoi
ancora. **Obtained** (UI: *"Prese"*) significa che ce l'hai — comprata,
scambiata o regalata, indifferente. La voce **non lascia** la `Wishlist`: cambia
stato, ed è **reversibile** (puoi rimetterla tra le *Da prendere*). Lo stato è
**per-carta**: tutte le rarità di una stessa `Card` condividono lo stesso stato
— una carta è interamente *Da prendere* o interamente *Presa*, mai a metà. `Obtained`
**non** è la `Collezione`: non traccia `Set`, condizione né quantità realmente
possedute — è solo il ciclo di vita della voce di `Wishlist`.
_Avoid_: Comprata/Bought (potresti averla ottenuta senza comprarla), Collezione
(è il posseduto, fuori scope — vedi sotto).

### Deck

**Deck**:
Un mazzo con un nome, costruito per un `Format` (obbligatorio), composto da tre
zone (`Main` / `Extra` / `Side`). Ogni voce è una coppia (`Card`, numero di
copie) — un `Deck` referenzia `Card` astratte, non `Print`.
_Avoid_: Decklist.

**Main Deck**:
La zona principale del `Deck`: 40–60 `Card`.

**Extra Deck**:
Zona da 0–15 `Card`, riservata a tipi specifici (Fusion, Synchro, Xyz, Link).
La zona di una `Card` è in parte **determinata dal suo tipo**, non libera.

**Side Deck**:
Zona da 0–15 `Card`, usata per scambi tra partite.

### Formati & Banlist

**Format**:
Il retro format per cui un `Deck` è costruito: **Goat**, **Edison**, **HAT**,
**Tengu** (elenco estendibile, definito come dato, non come codice). Ogni
`Format` porta con sé una `Banlist` fissa e un `Card Pool` con cutoff. Ogni
`Deck` ha esattamente un `Format`.
_Avoid_: Formato corrente/advanced, meta.

**Banlist**:
La Forbidden & Limited List *fissa e storica* di un `Format`. Trattandosi di
retro format non cambia mai: è un dato **statico impacchettato nell'app**, non
recuperato live. Assegna a ogni `Card` un `Ban Status`. Solo per Goat la fonte
la espone nativamente (`ban_goat`); per Edison/HAT/Tengu è scritta a mano.
_Avoid_: F&L list corrente/live.

**Ban Status**:
Lo stato di una `Card` nella `Banlist` di un `Format`: **Forbidden** (0 copie),
**Limited** (1), **Semi-Limited** (2), **Unlimited** (3, default).

**Coherence** (coerenza `Deck` ↔ `Banlist`):
Se il `Deck` rispetta la `Banlist` del suo `Format` (nessuna `Card` oltre le copie
concesse dal suo `Ban Status`). È un **indicatore**, non un vincolo: un `Deck`
incoerente si crea e si salva comunque — la coerenza si *mostra* (una spunta in
cima al `Deck`), non si *impone*. L'import di un `Deck` non è mai bloccato o
respinto dalla `Banlist`.
_Avoid_: Validazione, deck legale/illegale (non c'è un gate).

**Card Pool**:
L'insieme delle `Card` legali in un `Format`, limitato all'era del formato
(carte uscite entro un cutoff). Approssimato per data di uscita (`enddate`).
_Avoid_: Set legali (concetto più fine, non modellato in v1).

## Fuori scope (v1) — volutamente non modellati

- **Collezione (posseduto)** — l'insieme delle `Print` che l'utente *possiede*
  (con quantità/condizione). Diverso dalla `Wishlist` (ciò che *vuole*).
  Abiliterebbe "quante `Card` mi mancano per completare questo `Deck`?".
  Porta lasciata aperta, non aperta.
- **Edition** (1st Edition / Unlimited / Limited) — non presente nei dati della
  fonte; sarebbe da inserire a mano. Estensione futura.
- **Wishlist per `Set`** — desiderare *quella stampa specifica* (set_code) e non
  solo la rarità. Era in scope in v1, ora tolto: la `Wishlist` vive su
  (`Card`, `Rarity`). Riapribile se servisse distinguere le edizioni.
