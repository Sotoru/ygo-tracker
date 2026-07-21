# Solo retro format, banlist statiche, validazione soft

L'app supporta solo **retro format** (Goat, Edison, HAT, Tengu, REDU; elenco
estendibile come dato). Ogni `Deck` ha un `Format` obbligatorio, la cui
**banlist è fissa e impacchettata staticamente** nell'app, non recuperata
live. La validazione del deck (limiti copie per `Ban Status`, conteggi zona, tipi
Extra, `Card Pool`) è **soft**: warning, mai blocco del salvataggio.

## Perché

I retro format usano F&L list storiche congelate → nessun bisogno di dati live né
manutenzione. La fonte YGOPRODeck espone solo banlist *correnti* per TCG/OCG/Goat
(nessuna storica datata), quindi Edison/HAT/Tengu/REDU vanno comunque scritte a mano
una volta. Il cutoff del `Card Pool` è approssimato per data di uscita
(`enddate`): le approssimazioni (es. errata Goat) restano warning, non errori.

## Forma dei dati (deviazione: TS, non JSON)

I dati vivono in `src/domain/banlists.ts` come **modulo TS tipato**
(`Record<Format, {forbidden?, limited?, semiLimited?: string[]}>`), non JSON: il
type-check garantisce a compile-time status e chiavi-formato validi, senza
`resolveJsonModule` né import assertions. Si salvano **solo le eccezioni**,
raggruppate per status (come le liste F&L pubblicate); il resto è implicitamente
`unlimited`. Chiave = **nome carta** (le liste sono pubblicate per nome; il match
col `cardId` di YGOPRODeck avviene a runtime dal payload già in cache). Fonte:
Format Library. Snapshot: goat=April 2005, edison=March 2010, hat=April 2014,
tengu=September 2011, redu=September 2012. Il match nome↔YGOPRODeck sarà validato
quando si cablerà il validatore di deck; oggi `banlists.check.ts` verifica solo
l'integrità statica (nessun nome in due status).
