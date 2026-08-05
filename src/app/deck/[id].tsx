// Dettaglio Deck: le carte divise per zona (Main / Extra / Side), risolte per id
// via YGOPRODeck (stesso pattern di wishlist/banlist). Gli id non risolvibili non
// si disegnano. In edit mode (matita) la griglia diventa editabile: stepper/rimuovi
// sulle carte esistenti + Searchbar per aggiungerne di nuove, che passano da una
// riga "Da assegnare" (zona scelta con le chip) prima di poter salvare.
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Dialog,
  Divider,
  HelperText,
  Icon,
  IconButton,
  List,
  Menu,
  Portal,
  Searchbar,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { CardCell } from '@/components/card-cell';
import { CardRow } from '@/components/card-row';
import { ThemedView } from '@/components/themed-view';
import { cappedWidth, contentContainer, DenseGridColumns, Spacing, dialogWidth } from '@/constants/theme';
import { pickTextFile } from '@/data/pick-file';
import { shareTextFile } from '@/data/share-file';
import type { YgoCard } from '@/data/ygoprodeck';
import { deckSections } from '@/domain/deck-sections';
import { FORMATS, ZONES, type DeckEntryInput, type Format, type Zone } from '@/domain/types';
import { buildYdk, parseYdk } from '@/domain/ydk';
import { suggestedZone } from '@/domain/zone';
import { useSession } from '@/data/auth';
import { useCardDetail } from '@/hooks/use-card-detail';
import { useCardSearch, useCardsByIds } from '@/hooks/use-cards';
import { useGrid } from '@/hooks/use-layout';
import { useSettings } from '@/hooks/use-settings';
import {
  useDeck,
  useDeleteDeck,
  useReplaceDeckEntries,
  useSetDeckCover,
  useSetDeckFormat,
  useSetDeckName,
  useSetDeckPublic,
} from '@/hooks/use-decks';

const FORMAT_LIST = Object.keys(FORMATS) as Format[]; // data-driven: aggiungere un format basta in FORMATS
const MAX_COPIES = 3; // regola copie YGO nello stepper (il DB resta permissivo 1..9)

// Nome file da esportare: slug del nome deck, fallback se resta vuoto dopo lo strip.
const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'deck';

export default function DeckDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const openDetail = useCardDetail((s) => s.open);
  const { id } = useLocalSearchParams<{ id: string }>();
  // preferenze di vista globali (Impostazioni → Deck), persistite
  const groupRows = useSettings((s) => s.groupRows);
  const sortByCopies = useSettings((s) => s.sortByCopies);

  // Sempre montato (con o senza sessione): loggato = proprietario (RLS → solo righe
  // proprie), quindi controlli di modifica. Anonimo = vista read-only del deck pubblico.
  const { data: session } = useSession();
  const { data, isLoading, isError } = useDeck(id);
  const del = useDeleteDeck();
  const setCover = useSetDeckCover();
  const setFormat = useSetDeckFormat();
  const setName = useSetDeckName();
  const setPublic = useSetDeckPublic();
  const replace = useReplaceDeckEntries(); // sorgente unica: Salva editor + re-import
  const coverCardId = data?.deck.coverCardId ?? null; // scelta ESPLICITA (la stella piena)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [menu, setMenu] = useState<null | 'main' | 'format'>(null); // un solo Menu, contenuto per stato
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [reimportOpen, setReimportOpen] = useState(false);
  const entries = useMemo(() => data?.entries ?? [], [data]);
  const hasCover = coverCardId != null; // con copertina: pick-mode chiuso; il reset vive nel menu
  const ids = useMemo(() => [...new Set(entries.map((e) => e.cardId))], [entries]);
  const { data: cards = [], isLoading: cardsLoading } = useCardsByIds(ids);
  const byId = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  // --- edit mode: bozza locale (stepper istantaneo), scritta in blocco al Salva.
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<DeckEntryInput[]>([]);
  const [staging, setStaging] = useState<number[]>([]); // cardId aggiunte, in attesa di zona
  const [extraCards, setExtraCards] = useState<Map<number, YgoCard>>(new Map()); // carte da ricerca
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350); // debounce: rispetta il rate limit
    return () => clearTimeout(t);
  }, [query]);
  const searching = query.trim().length > 0;
  const { data: results = [], isFetching } = useCardSearch(debounced);

  const resolveCard = (cardId: number): YgoCard | undefined => byId.get(cardId) ?? extraCards.get(cardId);

  const enterEdit = () => {
    setDraft(entries.map((e) => ({ cardId: e.cardId, zone: e.zone, count: e.count })));
    setStaging([]);
    setQuery('');
    setEditing(true);
  };
  const cancelEdit = () => {
    setEditing(false);
    setStaging([]);
    setQuery('');
  };
  const addCard = (card: YgoCard) => {
    setExtraCards((m) => (m.has(card.id) ? m : new Map(m).set(card.id, card)));
    setStaging((s) => (s.includes(card.id) ? s : [...s, card.id]));
    setQuery(''); // torna al deck: la carta appare in «Da assegnare»
  };
  const assign = (cardId: number, zone: Zone) => {
    setDraft((d) => {
      const i = d.findIndex((e) => e.cardId === cardId && e.zone === zone);
      if (i >= 0) {
        const next = [...d];
        next[i] = { ...next[i], count: Math.min(MAX_COPIES, next[i].count + 1) }; // già presente → incrementa
        return next;
      }
      return [...d, { cardId, zone, count: 1 }];
    });
    setStaging((s) => s.filter((c) => c !== cardId));
  };
  const bump = (cardId: number, zone: Zone, delta: number) =>
    setDraft((d) =>
      d.map((e) =>
        e.cardId === cardId && e.zone === zone
          ? { ...e, count: Math.min(MAX_COPIES, Math.max(1, e.count + delta)) } // − ferma a 1, + cappa a 3
          : e,
      ),
    );
  const removeEntry = (cardId: number, zone: Zone) =>
    setDraft((d) => d.filter((e) => !(e.cardId === cardId && e.zone === zone)));
  const canSave = staging.length === 0 && !replace.isPending; // niente Salva finché lo staging non è vuoto
  const save = async () => {
    await replace.mutateAsync({ deckId: id, entries: draft });
    cancelEdit();
  };

  const onRename = () => {
    const name = renameText.trim();
    setRenameOpen(false);
    if (name && name !== data?.deck.name) setName.mutate({ deckId: id, name });
  };
  const onReimport = async () => {
    setReimportOpen(false);
    const picked = await pickTextFile();
    if (!picked) return; // annullato
    replace.mutate({ deckId: id, entries: parseYdk(picked.text) });
  };

  const [exportUnavailable, setExportUnavailable] = useState(false);
  const onExport = async () => {
    setMenu(null);
    if (!data) return;
    const ok = await shareTextFile(`${slugify(data.deck.name)}.ydk`, buildYdk(entries));
    if (!ok) setExportUnavailable(true);
  };

  const { cellWidth } = useGrid(DenseGridColumns);

  // Solo in vista: l'edit mode resta in ordine di inserimento, così le carte non
  // saltano mentre premi +/− sullo stepper.
  const sections = deckSections(entries, (cardId) => byId.get(cardId)?.frameType, { groupRows, sortByCopies });

  const draftSections = ZONES.map(({ zone, label }) => ({
    zone,
    label,
    entries: draft.filter((e) => e.zone === zone),
  })).filter((s) => s.entries.length);

  return (
    <ThemedView style={styles.screen}>
      <Appbar.Header style={styles.appbar}>
        {editing ? (
          <>
            <Appbar.Action icon="close" accessibilityLabel="Annulla modifiche" onPress={cancelEdit} />
            <Appbar.Content title="Modifica" />
            <Button
              mode="contained"
              compact
              disabled={!canSave}
              loading={replace.isPending}
              onPress={save}
              style={styles.saveBtn}>
              Salva
            </Button>
          </>
        ) : (
          <>
            <Appbar.BackAction
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace(session ? '/deck' : '/public-decks')
              }
            />
            <Appbar.Content
              title={data?.deck.name ?? 'Deck'}
              subtitle={data ? FORMATS[data.deck.format]?.label : undefined}
            />
            {data?.deck.isPublic ? (
              <Appbar.Action icon="earth" accessibilityLabel="Deck pubblico" onPress={() => {}} />
            ) : null}
            {data ? (
              <>
                {session ? <Appbar.Action icon="pencil" accessibilityLabel="Modifica carte" onPress={enterEdit} /> : null}
                <Menu
                  visible={menu != null}
                  onDismiss={() => setMenu(null)}
                  anchorPosition="bottom" // scende SOTTO il kebab; essendo in alto a destra si apre verso sinistra
                  anchor={<Appbar.Action icon="dots-vertical" accessibilityLabel="Altre azioni" onPress={() => setMenu('main')} />}>
                  {menu === 'format' ? (
                    FORMAT_LIST.map((f) => (
                      <Menu.Item
                        key={f}
                        title={FORMATS[f].label}
                        leadingIcon={f === data.deck.format ? 'check' : undefined}
                        onPress={() => {
                          setMenu(null);
                          if (f !== data.deck.format) setFormat.mutate({ deckId: id, format: f });
                        }}
                      />
                    ))
                  ) : (
                    <>
                      {session ? (
                        <>
                          <Menu.Item
                            leadingIcon="rename-box"
                            title="Rinomina"
                            onPress={() => {
                              setMenu(null);
                              setRenameText(data.deck.name);
                              setRenameOpen(true);
                            }}
                          />
                          <Menu.Item
                            leadingIcon="star-off"
                            title="Reset carta in evidenza"
                            disabled={!hasCover}
                            onPress={() => {
                              setMenu(null);
                              setCover.mutate({ deckId: id, cardId: null });
                            }}
                          />
                          <Menu.Item leadingIcon="playlist-edit" title="Cambia banlist" onPress={() => setMenu('format')} />
                          <Menu.Item
                            leadingIcon={data.deck.isPublic ? 'lock' : 'earth'}
                            title={data.deck.isPublic ? 'Rendi privato' : 'Rendi pubblico'}
                            onPress={() => {
                              setMenu(null);
                              setPublic.mutate({ deckId: id, isPublic: !data.deck.isPublic });
                            }}
                          />
                          <Menu.Item
                            leadingIcon="file-upload"
                            title="Reimporta .ydk"
                            onPress={() => {
                              setMenu(null);
                              setReimportOpen(true);
                            }}
                          />
                        </>
                      ) : null}
                      <Menu.Item leadingIcon="file-download" title="Esporta .ydk" onPress={onExport} />
                      {session ? (
                        <>
                          <Divider />
                          <Menu.Item
                            leadingIcon="delete"
                            title="Elimina deck"
                            titleStyle={{ color: colors.error }}
                            onPress={() => {
                              setMenu(null);
                              setConfirmOpen(true);
                            }}
                          />
                        </>
                      ) : null}
                    </>
                  )}
                </Menu>
              </>
            ) : null}
          </>
        )}
      </Appbar.Header>

      <Portal>
        <Dialog visible={confirmOpen} onDismiss={() => setConfirmOpen(false)} style={dialogWidth}>
          <Dialog.Title>Eliminare il deck?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">«{data?.deck.name}» verrà eliminato. Non è reversibile.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmOpen(false)}>Annulla</Button>
            <Button
              loading={del.isPending}
              onPress={async () => {
                await del.mutateAsync(id);
                router.replace('/deck');
              }}>
              Elimina
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={renameOpen} onDismiss={() => setRenameOpen(false)} style={dialogWidth}>
          <Dialog.Title>Rinomina deck</Dialog.Title>
          <Dialog.Content>
            <TextInput label="Nome" value={renameText} onChangeText={setRenameText} mode="outlined" autoFocus />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setRenameOpen(false)}>Annulla</Button>
            <Button disabled={!renameText.trim()} onPress={onRename}>
              Salva
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={reimportOpen} onDismiss={() => setReimportOpen(false)} style={dialogWidth}>
          <Dialog.Title>Reimporta .ydk?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">Tutte le carte del deck verranno sostituite con quelle del file scelto.</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setReimportOpen(false)}>Annulla</Button>
            <Button onPress={onReimport}>Scegli file</Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar visible={exportUnavailable} onDismiss={() => setExportUnavailable(false)} style={dialogWidth}>
          Condivisione non disponibile su questo dispositivo.
        </Snackbar>
      </Portal>

      {isLoading || cardsLoading ? (
        <ActivityIndicator style={styles.msg} />
      ) : isError || !data ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Deck non trovato.
        </Text>
      ) : editing ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Searchbar
            placeholder="Aggiungi una carta…"
            value={query}
            onChangeText={setQuery}
            loading={isFetching}
            autoCorrect={false}
            autoCapitalize="none"
            onClearIconPress={() => setQuery('')}
          />

          {searching ? (
            <View style={styles.grid}>
              {results.map((card) => (
                <View key={card.id} style={{ width: cellWidth }}>
                  <CardCell
                    name={card.name}
                    imageUrl={card.card_images[0]?.image_url_cropped}
                    frameType={card.frameType}
                    subtitle={[]}
                    onPress={() => addCard(card)}
                    topRight={<Icon source="plus-circle" color={colors.primary} size={24} />}
                  />
                </View>
              ))}
              {debounced.trim().length >= 2 && !isFetching && results.length === 0 ? (
                <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
                  Nessun risultato.
                </Text>
              ) : null}
            </View>
          ) : (
            <>
              {staging.length ? (
                <View>
                  <List.Subheader>{`Da assegnare (${staging.length})`}</List.Subheader>
                  {staging.map((cardId) => {
                    const card = resolveCard(cardId);
                    if (!card) return null;
                    const sug = suggestedZone(card.frameType);
                    return (
                      <CardRow
                        key={`st-${cardId}`}
                        name={card.name}
                        imageUrl={card.card_images[0]?.image_url_cropped}
                        subtitle={['In quale zona?']}>
                        <View style={styles.zoneChips}>
                          {ZONES.map(({ zone, label }) => (
                            <Chip
                              key={zone}
                              compact
                              selected={zone === sug} // zona inferita dal tipo, pre-evidenziata
                              showSelectedOverlay
                              onPress={() => assign(cardId, zone)}>
                              {label}
                            </Chip>
                          ))}
                        </View>
                      </CardRow>
                    );
                  })}
                  <HelperText type="info" visible>
                    Assegna le carte in «Da assegnare» per poter salvare.
                  </HelperText>
                </View>
              ) : null}

              {draftSections.length === 0 && staging.length === 0 ? (
                <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
                  Deck vuoto — cerca una carta qui sopra per aggiungerla.
                </Text>
              ) : (
                draftSections.map((sec) => (
                  <View key={sec.label}>
                    <List.Subheader>{`${sec.label} (${sec.entries.reduce((n, e) => n + e.count, 0)})`}</List.Subheader>
                    <View style={styles.grid}>
                      {sec.entries.flatMap((e) => {
                        const card = resolveCard(e.cardId);
                        if (!card) return []; // id non risolto → non si disegna
                        return (
                          <View key={`${sec.zone}-${e.cardId}`} style={{ width: cellWidth }}>
                            <CardCell
                              name={card.name}
                              imageUrl={card.card_images[0]?.image_url_cropped}
                              frameType={card.frameType}
                              subtitle={[]}>
                              <View style={styles.stepper}>
                                <View style={styles.stepGroup}>
                                  <IconButton
                                    icon="minus"
                                    size={16}
                                    mode="contained-tonal"
                                    style={styles.stepBtn}
                                    disabled={e.count <= 1}
                                    accessibilityLabel="Una copia in meno"
                                    onPress={() => bump(e.cardId, sec.zone, -1)}
                                  />
                                  <Text variant="titleMedium">{e.count}</Text>
                                  <IconButton
                                    icon="plus"
                                    size={16}
                                    mode="contained-tonal"
                                    style={styles.stepBtn}
                                    disabled={e.count >= MAX_COPIES}
                                    accessibilityLabel="Una copia in più"
                                    onPress={() => bump(e.cardId, sec.zone, 1)}
                                  />
                                </View>
                                <IconButton
                                  icon="delete"
                                  size={16}
                                  style={styles.stepBtn}
                                  accessibilityLabel="Rimuovi carta"
                                  onPress={() => removeEntry(e.cardId, sec.zone)}
                                />
                              </View>
                            </CardCell>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                ))
              )}
            </>
          )}
        </ScrollView>
      ) : sections.length === 0 ? (
        <Text variant="bodyMedium" style={[styles.msg, { color: colors.onSurfaceVariant }]}>
          Deck vuoto.
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          {sections.map((sec) => (
            <View key={sec.label} style={styles.zone}>
              <List.Subheader>
                {`${sec.label} (${sec.groups.flat().reduce((n, e) => n + e.count, 0)})`}
              </List.Subheader>
              {/* un gruppo = una griglia: con «Gruppi a capo» sono Mostri/Magie/Trappole
                  e la riga si chiude a fine gruppo, altrimenti è un gruppo solo */}
              {sec.groups.map((group) => (
                <View key={`${sec.label}-${group[0].cardId}`} style={styles.grid}>
                  {group.flatMap((e) => {
                    const card = byId.get(e.cardId);
                    if (!card) return []; // id non risolto → non si disegna
                    const isCover = coverCardId === e.cardId;
                    return (
                      <View key={`${e.zone}-${e.cardId}`} style={{ width: cellWidth }}>
                        <CardCell
                          name={card.name}
                          imageUrl={card.card_images[0]?.image_url_cropped}
                          frameType={card.frameType}
                          subtitle={[]}
                          count={e.count}
                          badge={e.count >= 2 ? `×${e.count}` : undefined}
                          onPress={() => openDetail(card)}
                          topRight={
                            isCover ? ( // scelta fatta: stella piena, allineata al badge, si azzera dal menu
                              <Icon source="star" color={colors.primary} size={24} />
                            ) : hasCover || !session ? undefined : ( // pick-mode: stella solo al proprietario, finché non sceglie
                              <Pressable
                                hitSlop={8}
                                accessibilityLabel="Usa come copertina"
                                onPress={() => setCover.mutate({ deckId: id, cardId: e.cardId })}>
                                <Icon source="star-outline" color={colors.onSurfaceVariant} size={24} />
                              </Pressable>
                            )
                          }
                        />
                      </View>
                    );
                  })}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appbar: { ...cappedWidth, backgroundColor: 'transparent' },
  saveBtn: { marginRight: Spacing.two },
  content: {
    ...contentContainer,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  zone: { gap: Spacing.two }, // stessa distanza tra le righe di gruppi diversi e dentro la griglia
  stepper:{ flexDirection: 'row', alignItems: 'center', flex: 1 },
  stepGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'space-between' }, // − 2 + riempiono lo spazio; il cestino resta a destra a dimensione fissa
  stepBtn: { margin: 0 }, // azzera il margine 6 di Paper → i 3 controlli entrano nella cella stretta
  zoneChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'flex-end', maxWidth: 200 },
  msg: { textAlign: 'center', paddingVertical: Spacing.six, width: '100%' },
});
