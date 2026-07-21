// Client YGOPRODeck (sola lettura). Rate limit 20 req/s: TanStack Query fa cache
// e dedup; la ricerca va debounced lato UI. Vedi docs/adr/0002 per le immagini.

const BASE = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export interface YgoCardImage {
  id: number;
  image_url: string;
  image_url_small: string;
  image_url_cropped: string;
}

export interface YgoCardSet {
  set_name: string;
  set_code: string; // es. "LOB-EN005" — identifica la Print
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
}

export interface YgoBanlistInfo {
  ban_tcg?: string;
  ban_ocg?: string;
  ban_goat?: string;
}

/** Sottoinsieme dei campi carta che consumiamo (l'API ne restituisce di più). */
export interface YgoCard {
  id: number;
  name: string;
  type: string;
  frameType: string;
  desc: string;
  race: string;
  archetype?: string;
  atk?: number;
  def?: number;
  level?: number;
  attribute?: string;
  card_images: YgoCardImage[];
  card_sets?: YgoCardSet[];
  banlist_info?: YgoBanlistInfo;
}

async function fetchCards(params: Record<string, string>): Promise<YgoCard[]> {
  const res = await fetch(`${BASE}?${new URLSearchParams(params)}`);
  // 400 = nessuna carta corrispondente → lista vuota, non un errore.
  if (res.status === 400) return [];
  if (!res.ok) throw new Error(`YGOPRODeck ${res.status}`);
  const json = (await res.json()) as { data?: YgoCard[] };
  return json.data ?? [];
}

/**
 * Ricerca fuzzy per nome. L'API matcha i separatori alla lettera ("blue eyes" → 0,
 * "blue-eyes" → 20): se il risultato è vuoto ritento una volta con spazi→trattini.
 * ponytail: niente paginazione in v1, si aggiunge (num/offset) se serve.
 */
export async function searchCardsByName(fname: string): Promise<YgoCard[]> {
  const primary = await fetchCards({ fname });
  if (primary.length) return primary;
  const hyphenated = fname.replace(/\s+/g, '-');
  return hyphenated !== fname ? fetchCards({ fname: hyphenated }) : primary;
}

export const getCardById = async (id: number): Promise<YgoCard | null> =>
  (await fetchCards({ id: String(id) }))[0] ?? null;

/** Più Card in una sola richiesta (id separati da virgola). ponytail: ordine non garantito, riordina il chiamante. */
export const getCardsByIds = (ids: number[]): Promise<YgoCard[]> =>
  ids.length ? fetchCards({ id: ids.join(',') }) : Promise.resolve([]);

/**
 * Più Card per NOME esatto in una sola richiesta (nomi separati da `|`). Usato
 * dalle banlist statiche (chiave = nome). ~160 nomi ≈ URL 4KB: testato OK.
 * ponytail: ordine non garantito, riordina il chiamante (per status via banlists).
 */
export const getCardsByNames = (names: string[]): Promise<YgoCard[]> =>
  names.length ? fetchCards({ name: names.join('|') }) : Promise.resolve([]);

/**
 * URL immagine via proxy di caching (weserv), non hotlink diretto a YGOPRODeck.
 * Vedi docs/adr/0002. `expo-image` ci aggiunge la disk cache lato device.
 */
export function cardImageUrl(imageUrl: string, opts?: { width?: number }): string {
  const src = imageUrl.replace(/^https?:\/\//, ''); // weserv vuole l'host senza schema
  const q = new URLSearchParams({ url: src });
  if (opts?.width) q.set('w', String(opts.width));
  return `https://images.weserv.nl/?${q}`;
}
