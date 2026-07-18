# Immagini carta via proxy di caching, non hotlink diretto

Le immagini delle carte sono servite tramite un proxy/CDN di caching (es.
`images.weserv.nl`) più la disk cache di `expo-image`, invece di puntare
direttamente agli URL di YGOPRODeck.

## Perché

I termini di YGOPRODeck vietano l'hotlinking diretto ("scaricale e ospitale tu,
pena la blacklist dell'IP") e impongono un rate limit (20 req/s). Senza backend
non possiamo ri-ospitare le immagini; proxy + cache riducono i colpi all'origine
ed è il compromesso più vicino ai termini.

## Conseguenze

Resta un **gap di conformità noto**: il primo fetch di ogni immagine passa
comunque dall'origine. Il vero download-e-riospita è rimandato al backend (Neon).
