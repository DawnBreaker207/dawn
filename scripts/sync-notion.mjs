import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import fs from 'node:fs';
import path from 'node:path';

// Syncs posts from the Notion database into data/blog/ as .mdx. The `layout:`
// frontmatter field is dropped because @astrojs/mdx would treat it as a
// component import. Run from the repo root after sourcing .env.local:
// `node scripts/sync-notion.mjs`.

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
const databaseId = process.env.BLOGS_DATABASE_ID;
if (!databaseId) {
  console.error('Missing BLOGS_DATABASE_ID');
  process.exit(1);
}

const sanitizeTitle = (title) =>
  title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

const outputDir = path.join(process.cwd(), 'data/blog');
const imagesRoot = path.join(process.cwd(), 'public/static/images/blog');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });
fs.rmSync(imagesRoot, { recursive: true, force: true });
fs.mkdirSync(imagesRoot, { recursive: true });

const res = await notion.databases.query({ database_id: databaseId });

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

console.log(`Done: ${res.results.length} pages processed`);