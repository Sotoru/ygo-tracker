#!/usr/bin/env node
// Genera SQL di seed da Format Library, senza scrivere sul DB.
// Uso: npx tsx scripts/import-format-library-events.mjs --formats goat,edison --limit 20 --out tmp/format-library-import.sql
// Gira con tsx (non node) perché riusa il parser .ydk dell'app: un solo parser, non due che divergono.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { parseYdk } from '../src/domain/ydk.ts';

const API = 'https://formatlibrary.com/api';
const SOURCE = 'https://formatlibrary.com';
const FORMAT_MAP = new Map([
  ['Goat', 'goat'],
  ['Edison', 'edison'],
  ['HAT', 'hat'],
  ['Tengu', 'tengu'],
  ['REDU', 'redu'],
]);
const DEFAULT_FORMATS = ['goat', 'edison', 'hat', 'tengu', 'redu'];

function arg(name, fallback) {
  const prefix = `--${name}=`;
  const value = process.argv.find((a) => a.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const requestedFormats = new Set(arg('formats', DEFAULT_FORMATS.join(',')).split(',').map((f) => f.trim()).filter(Boolean));
const limit = Number(arg('limit', '25'));
const out = arg('out', 'tmp/format-library-import.sql');

function sql(value) {
  if (value == null || value === '') return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'unknown';
}

function deterministicUuid(namespace, value) {
  const input = `${namespace}:${value}`;
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = `${(h2 >>> 0).toString(16).padStart(8, '0')}${(h1 >>> 0).toString(16).padStart(8, '0')}`.repeat(2).slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-8${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

async function getJson(path) {
  const response = await fetch(`${API}${path}`, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${path}`);
  return response.json();
}

async function getEvents(formatName) {
  const rows = [];
  for (let page = 1; rows.length < limit; page++) {
    const batch = await getJson(`/events?page=${page}&limit=${Math.min(50, limit - rows.length)}&sort=startedAt:desc&filter=format:eq:${encodeURIComponent(formatName)}`);
    if (!batch.length) break;
    rows.push(...batch.filter((event) => event.display !== false));
  }
  return rows.slice(0, limit);
}

async function getDeckSummaries(eventAbbreviation) {
  return getJson(`/decks?page=1&limit=100&sort=placement:asc&filter=eventAbbreviation:eq:${encodeURIComponent(eventAbbreviation)}`);
}

function placement(value) {
  if (value === 1) return 'winner';
  if (value === 2) return 'runnerUp';
  if (value <= 4) return 'top4';
  if (value <= 8) return 'top8';
  if (value <= 16) return 'top16';
  if (value <= 32) return 'top32';
  return 'top64';
}

const formats = await getJson('/formats');
const formatNames = formats
  .filter((format) => FORMAT_MAP.has(format.name) && requestedFormats.has(FORMAT_MAP.get(format.name)))
  .map((format) => format.name);

const tournamentRows = [];
const deckRows = [];
const entryRows = [];
const warnings = [];

for (const formatName of formatNames) {
  const appFormat = FORMAT_MAP.get(formatName);
  const events = await getEvents(formatName);
  for (const event of events) {
    const decks = await getDeckSummaries(event.abbreviation);
    if (!decks.length) continue;
    const tournamentId = deterministicUuid('format-library-event', event.id);
    tournamentRows.push({
      id: tournamentId,
      name: event.name,
      format: appFormat,
      date: event.startedAt?.slice(0, 10),
      location: event.communityName,
      source: `${SOURCE}/events/${event.abbreviation}`,
    });

    for (const summary of decks) {
      const full = await getJson(`/decks/${summary.id}`);
      const entries = parseYdk(String(full.ydk ?? ''));
      if (!entries.length) {
        warnings.push(`Deck ${summary.id} (${event.abbreviation}) has no parseable .ydk`);
        continue;
      }
      const deckId = deterministicUuid('format-library-deck', summary.id);
      deckRows.push({
        id: deckId,
        tournamentId,
        name: summary.deckTypeName || summary.name || `${event.name} deck`,
        playerName: summary.builder?.name || summary.builderName || null,
        placement: placement(Number(summary.placement ?? 999)),
        format: appFormat,
        coverCardId: entries[0]?.cardId ?? null,
        sourceUrl: `${SOURCE}/decks/${summary.id}`,
      });
      for (const entry of entries) {
        entryRows.push({ id: deterministicUuid('format-library-entry', `${summary.id}:${entry.zone}:${entry.cardId}`), deckId, ...entry });
      }
    }
  }
}

const lines = [
  '-- Generated by scripts/import-format-library-events.mjs',
  '-- Review before running. Tournament decks are inserted as draft by default.',
  `-- Formats: ${formatNames.join(', ')}`,
  `-- Tournaments: ${tournamentRows.length}; Decks: ${deckRows.length}; Entries: ${entryRows.length}`,
  '',
  'begin;',
  '',
];

for (const row of tournamentRows) {
  lines.push(`insert into public.tournaments (id, name, format, date, location) values (${sql(row.id)}::uuid, ${sql(row.name)}, ${sql(row.format)}, ${sql(row.date)}::date, ${sql(row.location)}) on conflict (id) do update set name = excluded.name, format = excluded.format, date = excluded.date, location = excluded.location, updated_at = now(); -- ${row.source}`);
}
lines.push('');
for (const row of deckRows) {
  lines.push(`insert into public.tournament_decks (id, tournament_id, name, player_name, placement, format, cover_card_id, source_url, status) values (${sql(row.id)}::uuid, ${sql(row.tournamentId)}::uuid, ${sql(row.name)}, ${sql(row.playerName)}, ${sql(row.placement)}, ${sql(row.format)}, ${row.coverCardId ?? 'null'}, ${sql(row.sourceUrl)}, 'draft') on conflict (id) do update set name = excluded.name, player_name = excluded.player_name, placement = excluded.placement, format = excluded.format, cover_card_id = excluded.cover_card_id, source_url = excluded.source_url, updated_at = now();`);
}
lines.push('');
for (const row of entryRows) {
  lines.push(`insert into public.tournament_deck_entries (id, tournament_deck_id, card_id, zone, count) values (${sql(row.id)}::uuid, ${sql(row.deckId)}::uuid, ${row.cardId}, ${sql(row.zone)}, ${row.count}) on conflict (tournament_deck_id, card_id, zone) do update set count = excluded.count;`);
}
lines.push('', 'commit;', '');

if (warnings.length) lines.push('-- Warnings:', ...warnings.map((w) => `-- ${w}`), '');

await mkdir(dirname(out), { recursive: true });
await writeFile(out, lines.join('\n'));

console.log(`Wrote ${out}`);
console.log(`Tournaments: ${tournamentRows.length}; Decks: ${deckRows.length}; Entries: ${entryRows.length}`);
if (warnings.length) console.log(`Warnings: ${warnings.length}`);
