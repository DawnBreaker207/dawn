import { Client } from '@notionhq/client';
import fs from 'node:fs';
import path from 'node:path';

// Syncs the "Now" Notion database -> src/data/now.json (run from repo root):
//   Building rows (Stage != Done) -> building cards
//   Studying rows                 -> studying items (body lines)
//   "Current Games" / "Music & Soundtracks" Hobbies rows -> entertainment
// Skipped when NOW_DATABASE_ID is missing. `node scripts/sync-now.mjs --preview` prints JSON only.

const loadEnv = () => {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};
loadEnv();

const databaseId = process.env.NOW_DATABASE_ID;
if (!databaseId) {
  console.warn('[sync-now] Missing NOW_DATABASE_ID — skipping now sync.');
  process.exit(0);
}

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const preview = process.argv.includes('--preview');

const fmtMonth = (d) => d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
const lines = (blocks) => {
  const out = [];
  for (const b of blocks.results) {
    if (b.type !== 'paragraph' && b.type !== 'bulleted_list_item' && b.type !== 'numbered_list_item') continue;
    for (const seg of b[b.type].rich_text.map((r) => r.plain_text).join('').split('\n')) {
      const t = seg.replace(/^[-•*]\s*/, '').trim();
      if (t) out.push(t);
    }
  }
  return out;
};

// Hero status lives in the database description; fall back to the existing value.
const previous = fs.existsSync('src/data/now.json')
  ? JSON.parse(fs.readFileSync('src/data/now.json', 'utf8'))
  : {};

const db = await notion.databases.retrieve({ database_id: databaseId });
const sourceId = db.data_sources?.[0]?.id;
if (!sourceId) {
  console.warn('[sync-now] No data source found for Now — skipping sync.');
  process.exit(0);
}
const desc = (db.description ?? []).map((t) => t.plain_text).join('');

const res = await notion.dataSources.query({ data_source_id: sourceId, page_size: 200 });

const out = {
  updatedAt: fmtMonth(new Date()),
  location: previous.location ?? 'Hanoi, Vietnam',
  status: desc || previous.status || '',
  building: [],
  studying: [],
  entertainment: { games: [], music: previous.entertainment?.music ?? '' },
};

for (const page of res.results) {
  const props = page.properties ?? {};
  const name = (props['Name']?.title ?? []).map((t) => t.plain_text).join('').trim();
  const type = props['Type']?.select?.name ?? '';
  const stage = props['Stage']?.select?.name ?? '';
  const status = props['Status']?.status?.name ?? props['Status']?.select?.name ?? '';
  if (status !== 'Public') continue; // publishing gate

  if (type === 'Building' && stage !== 'Done') {
    const body = lines(await notion.blocks.children.list({ block_id: page.id, page_size: 100 }));
    out.building.push({
      title: name,
      tag: (props['Tags']?.multi_select ?? []).map((o) => o.name).join(' '),
      desc: body[0] ?? '',
    });
  } else if (type === 'Studying' || (type === '' && name === '')) {
    // Typeless rows still carry content in the body — treat as studying, real blanks die here.
    out.studying.push(...lines(await notion.blocks.children.list({ block_id: page.id, page_size: 100 })));
  } else if (type === 'Hobbies') {
    const key = name.toLowerCase();
    const rawBlocks = await notion.blocks.children.list({ block_id: page.id, page_size: 100 });
    const body = lines(rawBlocks);
    if (key.includes('game')) {
      for (const line of body) {
        const i = line.indexOf(':');
        if (i < 0) continue; // games contract is "Name: detail" — freeform junk lines drop
        out.entertainment.games.push({ name: line.slice(0, i).trim(), detail: line.slice(i + 1).trim() });
      }
    } else if (key.includes('music')) {
      const musicItems = [];
      for (const b of rawBlocks.results) {
        if (b.type !== 'bulleted_list_item' && b.type !== 'paragraph') continue;
        const text = b[b.type].rich_text.map((r) => r.plain_text).join('').trim();
        if (!text) continue;
        if (b.has_children) {
          const childBlocks = await notion.blocks.children.list({ block_id: b.id, page_size: 100 });
          const children = childBlocks.results
            .filter((c) => c.type === 'bulleted_list_item' || c.type === 'paragraph')
            .map((c) => c[c.type].rich_text.map((r) => r.plain_text).join('').trim())
            .filter(Boolean);
          musicItems.push({ label: text, items: children });
        } else {
          musicItems.push(text);
        }
      }
      out.entertainment.music = musicItems;
    }
  } else if (type === 'Downtime') {
    out.entertainment.games.push({ name, detail: (props['Desc']?.rich_text ?? []).map((r) => r.plain_text).join('') });
  }
}

if (preview) {
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
fs.writeFileSync(path.join(process.cwd(), 'src/data/now.json'), JSON.stringify(out, null, 2) + '\n');
console.log(
  `[sync-now] now.json -> ${out.building.length} building · ${out.studying.length} studying · ` +
    `${out.entertainment.games.length} games · music ${out.entertainment.music ? 'ok' : 'empty'}`,
);
