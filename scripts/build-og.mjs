// Generates monochrome-graphic OG images (1200x630 PNG) for every blog post
// into `public/og/<slug>.png` before `astro build` (public/ is copied to dist).
// Run as `node scripts/build-og.mjs`. Requires `npm i -D satori @resvg/resvg-js`.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createElement as h } from 'react';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const BLOG_DIR = join(process.cwd(), 'data', 'blog');
const OUT_DIR = join(process.cwd(), 'public', 'og');

const W = 1200;
const H = 630;
const HOST = 'dawn.dev';

const FONT_DIR = join(process.cwd(), 'node_modules', '@fontsource', 'outfit', 'files');
const fonts = [
  { name: 'Outfit', weight: 700, data: readFileSync(join(FONT_DIR, 'outfit-latin-ext-700-normal.woff')) },
  { name: 'Outfit', weight: 400, data: readFileSync(join(FONT_DIR, 'outfit-latin-ext-400-normal.woff')) },
];

function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!m) return {};
  const body = m[1];
  const field = (name) => {
    const fm = body.match(new RegExp(`^${name}:\\s*(.+?)\\s*$`, 'm'));
    return fm ? fm[1].replace(/^["']|["']$/g, '') : '';
  };
  const tagsMatch = body.match(/^tags:\s*\[([^\]]*)\]/m);
  const tags = tagsMatch
    ? tagsMatch[1]
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : [];
  const date = field('date') ? new Date(field('date')) : null;
  return {
    title: field('title'),
    summary: field('summary'),
    date,
    tags,
  };
}

function formatDate(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function layout({ title, summary, tags, dateStr }) {
  return h(
    'div',
    {
      style: {
        width: W,
        height: H,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        background: 'linear-gradient(135deg, #12131c 0%, #1a1b26 55%, #24283b 100%)',
        color: '#e0e2ec',
        fontFamily: 'Outfit',
      },
    },
    h('div', {
      style: { fontSize: 22, color: '#9aa1b8', fontFamily: 'Outfit' },
      children: `~/dawn.dev`,
    }),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column' } },
      h('div', {
        style: {
          fontSize: 64,
          fontWeight: 700,
          lineHeight: 1.12,
          letterSpacing: '-0.02em',
          color: '#e0e2ec',
          maxWidth: 1000,
        },
        children: title,
      }),
      summary &&
        h('div', {
          style: {
            marginTop: 28,
            fontSize: 26,
            lineHeight: 1.5,
            color: '#a9b1d6',
            maxWidth: 900,
          },
          children: summary,
        }),
      tags.length > 0 &&
        h(
          'div',
          {
            style: {
              display: 'flex',
              gap: 12,
              marginTop: 34,
              flexWrap: 'wrap',
            },
          },
          tags.slice(0, 5).map((t) =>
            h(
              'div',
              {
                style: {
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: '1px solid rgba(122,162,247,0.35)',
                  color: '#89b4fa',
                  fontSize: 22,
                  lineHeight: 1.2,
                },
                children: `#${t}`,
              }
            )
          )
        )
    ),
    h('div', {
      style: { fontSize: 20, color: '#565f89', fontFamily: 'Outfit' },
      children: dateStr ? `${dateStr}  ·  dawn · personal blog` : 'dawn · personal blog',
    })
  );
}

async function generate() {
  mkdirSync(OUT_DIR, { recursive: true });
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.mdx'));
  let count = 0;
  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    const meta = parseFrontmatter(readFileSync(join(BLOG_DIR, file), 'utf8'));
    if (!meta.title) continue;
    const svg = await satori(layout({ ...meta, dateStr: formatDate(meta.date) }), {
      width: W,
      height: H,
      fonts,
    });
    const png = new Resvg(svg, { fitTo: { mode: 'width', value: W } }).render().asPng();
    writeFileSync(join(OUT_DIR, `${slug}.png`), png);
    count += 1;
  }
  console.log(`[build-og] generated ${count} og image(s) -> public/og/`);
}

generate().catch((err) => {
  console.error('[build-og] failed:', err);
  process.exit(1);
});