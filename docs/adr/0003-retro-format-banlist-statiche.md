# Solo retro format, banlist statiche, validazione soft

L'app supporta solo **retro format** (Goat, Edison, HAT, Tengu; elenco
estendibile come dato). Ogni `Deck` ha un `Format` obbligatorio, la cui
**banlist è fissa e impacchettata staticamente** nell'app (JSON), non recuperata
live. La validazione del deck (limiti copie per `Ban Status`, conteggi zona, tipi
Extra, `Card Pool`) è **soft**: warning, mai blocco del salvataggio.

## Perché

I retro format usano F&L list storiche congelate → nessun bisogno di dati live né
manutenzione. La fonte YGOPRODeck espone solo banlist *correnti* per TCG/OCG/Goat
(nessuna storica datata), quindi Edison/HAT/Tengu vanno comunque scritte a mano
una volta. Il cutoff del `Card Pool` è approssimato per data di uscita
(`enddate`): le approssimazioni (es. errata Goat) restano warning, non errori.
