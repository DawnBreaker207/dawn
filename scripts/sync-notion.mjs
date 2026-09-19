import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Syncs from Notion to build data (run from repo root):
//   Posts -> data/blog/*.mdx | Projects -> projectsData.json | Timeline -> src/data/timeline.json
// Skipped when the matching env id is missing.

const root = fileURLToPath(new URL('..', import.meta.url));

const loadEnv = () => {
  const file = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};
loadEnv();

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const n2m = new NotionToMarkdown({ notionClient: notion });

const text = (p) => (p?.rich_text ?? []).map((t) => t.plain_text).join('');

// ---------------------------------------------------------------------------
// Blog posts
// ---------------------------------------------------------------------------

const sanitizeTitle = (title) =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

async function syncBlogs() {
  const databaseId = process.env.BLOGS_DATABASE_ID;
  if (!databaseId) {
    console.warn('[sync-notion] Missing BLOGS_DATABASE_ID — skipping blog sync.');
    return;
  }

  const outputDir = path.join(process.cwd(), 'data/blog');
  const imagesRoot = path.join(process.cwd(), 'public/static/images/blog');

  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
  fs.rmSync(imagesRoot, { recursive: true, force: true });
  fs.mkdirSync(imagesRoot, { recursive: true });

  // .env db id is a view; resolve its data source to query() the real schema.
  const db = await notion.databases.retrieve({ database_id: databaseId });
  const sourceId = db.data_sources?.[0]?.id;
  if (!sourceId) {
    console.warn('[sync-notion] No data source found for blogs — skipping blog sync.');
    return;
  }

  const res = await notion.dataSources.query({ data_source_id: sourceId, page_size: 200 });

  for (const page of res.results) {
    const mdBlocks = await n2m.pageToMarkdown(page.id);
    const mdString = n2m.toMarkdownString(mdBlocks);

    const props = page?.properties ?? {};
    const title = props['Title']?.title?.[0]?.plain_text || page.id;
    const summary = props['Summary']?.rich_text?.[0]?.plain_text || 'Unknown';
    const cover = page?.cover?.type === 'external' ? page?.cover?.external?.url : '';
    const date = props['Published Date']?.created_time ?? new Date().toISOString();
    const status = props['Status']?.status?.name ?? 'Unknown';
    const tags = props['Tags']?.multi_select?.map((tag) => tag.name) ?? [];

    const slug = sanitizeTitle(title);
    const filePath = path.join(outputDir, `${slug}.mdx`);

    if (status === 'Draft' || status === 'Idea') {
      fs.rmSync(filePath, { force: true });
      continue;
    }

    const frontmatter = `---
title: '${title.replace(/'/g, "\\'")}'
date: '${new Date(date).toISOString().split('T')[0]}'
tags: [${tags.map((t) => `'${t}'`).join(', ')}]
draft: false
summary: ${summary}
images: ['${cover}']
---

`;

    const postImagesDir = path.join(imagesRoot, slug);
    fs.mkdirSync(postImagesDir, { recursive: true });

    const usedNames = new Set();
    let markdown = mdString.parent;
    for (const m of [...markdown.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)]) {
      const url = m[1];
      if (!url.includes('prod-files-secure.s3.us-west-2.amazonaws.com')) continue;

      const rawName = decodeURIComponent(url.split('?')[0].split('/').pop() || 'image');
      let name = rawName.toLowerCase().replace(/[^\w.-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      if (!/\.[a-z0-9]+$/i.test(name)) name += '.png';

      let final = name;
      let i = 1;
      while (usedNames.has(final)) {
        final = `${name.replace(/\.[a-z0-9]+$/i, '')}-${i}${name.match(/\.[a-z0-9]+$/i)?.[0] || ''}`;
        i++;
      }
      usedNames.add(final);

      try {
        const resp = await fetch(url);
        if (resp.ok) fs.writeFileSync(path.join(postImagesDir, final), Buffer.from(await resp.arrayBuffer()));
      } catch (e) {
        console.error(`Failed to download image ${url}`, e);
      }

      markdown = markdown.replace(m[0], `![${final}](/static/images/blog/${slug}/${final})`);
    }

    fs.writeFileSync(filePath, frontmatter + markdown, 'utf-8');
    console.log('synced', slug);
  }

  console.log(`Done: ${res.results.length} posts processed`);
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------

async function syncProjects() {
  const dbId = process.env.PROJECTS_DATABASE_ID;
  if (!dbId) {
    console.warn('[sync-notion] Missing PROJECTS_DATABASE_ID — skipping projects sync.');
    return;
  }

  const db = await notion.databases.retrieve({ database_id: dbId });
  const sourceId = db.data_sources?.[0]?.id;
  if (!sourceId) {
    console.warn('[sync-notion] No data source found for projects — skipping.');
    return;
  }

  const res = await notion.dataSources.query({ data_source_id: sourceId, page_size: 200 });

  const items = [];
  for (const page of res.results) {
    const props = page?.properties ?? {};
    const status = props['Status']?.select?.name ?? '';
    if (status === 'Draft' || status === 'Idea') continue;

    const typeValue = props['Type']?.select?.name ?? '';
    items.push({
      type: typeValue.toLowerCase() === 'work' ? 'work' : 'self',
      title: props['Name']?.title?.[0]?.plain_text ?? '',
      description: props['Description']?.rich_text?.[0]?.plain_text ?? '',
      imgSrc:
        page.cover?.type === 'external'
          ? page.cover.external.url
          : page.cover?.type === 'file'
            ? page.cover.file.url
            : '',
      url: props['URL']?.url ?? '',
      repo: props['Link']?.url ?? '',
      builtWith: props['Build With']?.multi_select?.map((t) => t.name) ?? [],
    });
  }

  const out = path.join(process.cwd(), 'projectsData.json');
  fs.writeFileSync(out, JSON.stringify(items, null, 2) + '\n');
  console.log(`✅ Synced ${items.length} projects -> projectsData.json`);
}

// ---------------------------------------------------------------------------
// Resume timeline
// ---------------------------------------------------------------------------

const LOGO_DIR = path.join(root, 'public', 'static', 'images', 'experiences');
const TIMELINE_OUT = path.join(root, 'src', 'data', 'timeline.json');

// "2022-09-01" -> "Sep 2022"
const fmtMonth = (iso) => {
  if (!iso) return '';
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

const dateStart = (p) => (p?.date ? p.date.start : '');
const dateEnd = (p) => (p?.date ? p.date.end : '');

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Notion rich_text array as inline HTML.
const richTextHtml = (p) =>
  (p?.html ?? p?.rich_text ?? [])
    .map((t) => {
      let s = escapeHtml(t.plain_text);
      const { bold, italic, code, strikethrough, underline } = t.annotations ?? {};
      if (code) s = `<code>${s}</code>`;
      if (bold) s = `<strong>${s}</strong>`;
      if (italic) s = `<em>${s}</em>`;
      if (strikethrough) s = `<s>${s}</s>`;
      if (underline) s = `<u>${s}</u>`;
      return t.href ? `<a href="${escapeHtml(t.href)}" target="_blank" rel="noopener">${s}</a>` : s;
    })
    .join('');

// Reuse local logo if the attachment was already downloaded; else fetch once.
async function resolveLogo(logo) {
  if (!logo?.files?.[0]) return '';
  const url =
    logo.files[0].type === 'file'
      ? logo.files[0].file?.url
      : logo.files[0].external?.url;
  if (!url) return '';

  const name = decodeURIComponent(url.split('?')[0].split('/').pop() || '')
    .toLowerCase()
    .replace(/[^\w.-]/g, '_');
  if (!name || !/\.[a-z0-9]+$/i.test(name)) return '';

  const local = path.join(LOGO_DIR, name);
  if (fs.existsSync(local)) return `/static/images/experiences/${name}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) return '';
    fs.writeFileSync(local, Buffer.from(await res.arrayBuffer()));
    return `/static/images/experiences/${name}`;
  } catch (e) {
    console.warn(`[sync-notion] failed to download logo ${name}: ${e.message}`);
    return '';
  }
}

async function syncTimeline() {
  const dbId = process.env.TIMELINE_DATABASE_ID;
  if (!dbId) {
    console.warn('[sync-notion] Missing TIMELINE_DATABASE_ID — skipping timeline sync.');
    return;
  }

  // .env db id is a view; resolve its data source to query() the real schema.
  const db = await notion.databases.retrieve({ database_id: dbId });
  const sourceId = db.data_sources?.[0]?.id;
  if (!sourceId) {
    console.warn('[sync-notion] No data source found for timeline — skipping.');
    return;
  }

  const res = await notion.dataSources.query({ data_source_id: sourceId, page_size: 200 });

  const items = [];
  for (const page of res.results) {
    const props = page.properties ?? {};
    const status = props['Status']?.status?.name ?? props['Status']?.select?.name ?? '';
    if (status === 'Private') continue;

    // Details are bulleted/numbered list blocks in the page body.
    const blocks = await notion.blocks.children.list({ block_id: page.id, page_size: 100 });
    const details = [];
    for (const b of blocks.results) {
      if (b.type !== 'bulleted_list_item' && b.type !== 'numbered_list_item') continue;
      const html = richTextHtml(b[b.type]).trim();
      if (html) details.push(html);
    }

    items.push({
      org: text(props['Org']),
      url: text(props['Url']),
      logo: await resolveLogo(props['Logo']),
      start: fmtMonth(dateStart(props['Time'])),
      end: fmtMonth(dateEnd(props['Time'])) || 'Present',
      title: props['Name']?.title?.[0]?.plain_text ?? '',
      event: text(props['Event']),
      details,
    });
  }

  fs.mkdirSync(path.dirname(TIMELINE_OUT), { recursive: true });
  fs.writeFileSync(TIMELINE_OUT, JSON.stringify({ items, syncedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(`✅ Synced ${items.length} timeline entries -> src/data/timeline.json`);
}

await syncBlogs();
await syncProjects();
await syncTimeline();