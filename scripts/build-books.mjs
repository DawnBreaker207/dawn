// Fetches the user's Goodreads bookshelf via RSS for two shelves
// (currently-reading, read) and writes a static JSON snapshot to
// src/data/books.json. Run as part of the Astro build pipeline.
//
// - If GOODREADS_USER_ID is not set, keeps the existing JSON (if any)
//   and exits gracefully — the build never fails because of this script.
// - If fetching a shelf fails, the existing data for that shelf is kept.
// - RSS feeds are not real-time: shelf changes may take a few hours to
//   appear in the feed.
import Parser from 'rss-parser';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const OUT = join(root, 'src', 'data', 'books.json');

// ── env ─────────────────────────────────────────────────────────────────────
const loadEnv = () => {
  const file = join(process.cwd(), '.env.local');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
};
loadEnv();

const userId = process.env.GOODREADS_USER_ID;

// ── rss-parser setup ────────────────────────────────────────────────────────
const parser = new Parser({
  customFields: {
    item: [
      'guid',
      'title',
      'link',
      'pubDate',
      ['book_id', 'bookId'],
      ['book_image_url', 'bookImageUrl'],
      ['book_small_image_url', 'bookSmallImageUrl'],
      ['book_medium_image_url', 'bookMediumImageUrl'],
      ['book_large_image_url', 'bookLargeImageUrl'],
      ['book_description', 'bookDescription'],
      ['author_name', 'authorName'],
      'isbn',
      ['user_name', 'userName'],
      ['user_rating', 'userRating'],
      ['user_read_at', 'userReadAt'],
      ['user_date_added', 'userDateAdded'],
      ['user_date_created', 'userDateCreated'],
      ['user_shelves', 'userShelves'],
      ['user_review', 'userReview'],
      ['average_rating', 'averageRating'],
      ['book_published', 'bookPublished'],
    ],
  },
});

const SHELVES = ['currently-reading', 'read'];

const feedUrl = (shelf) =>
  `https://www.goodreads.com/review/list_rss/${userId}?shelf=${shelf}`;

const clean = (s) =>
  (typeof s === 'string' ? s : '')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

// ── fetch one shelf ──────────────────────────────────────────────────────────
async function fetchShelf(shelf) {
  const feed = await parser.parseURL(feedUrl(shelf));
  return feed.items.map((item) => ({
    guid: String(item.guid ?? ''),
    pubDate: String(item.pubDate ?? ''),
    title: clean(item.title ?? ''),
    link: String(item.link ?? ''),
    bookId: String(item.bookId ?? ''),
    bookImageUrl: String(item.bookImageUrl ?? ''),
    bookSmallImageUrl: String(item.bookSmallImageUrl ?? ''),
    bookMediumImageUrl: String(item.bookMediumImageUrl ?? ''),
    bookLargeImageUrl: String(item.bookLargeImageUrl ?? ''),
    bookDescription: clean(item.bookDescription ?? ''),
    authorName: clean(item.authorName ?? ''),
    isbn: String(item.isbn ?? ''),
    userRating: String(item.userRating ?? ''),
    userReadAt: String(item.userReadAt ?? ''),
    userDateAdded: String(item.userDateAdded ?? ''),
    userDateCreated: String(item.userDateCreated ?? ''),
    userShelves: String(item.userShelves ?? ''),
    userReview: String(item.userReview ?? ''),
    averageRating: String(item.averageRating ?? ''),
    bookPublished: String(item.bookPublished ?? ''),
  }));
}

// ── load existing data (for fallback) ────────────────────────────────────────
let existing = { currentlyReading: [], read: [], syncedAt: null };
if (existsSync(OUT)) {
  try {
    existing = JSON.parse(readFileSync(OUT, 'utf8'));
  } catch {
    /* corrupt file — ignore */
  }
}

// ── main ─────────────────────────────────────────────────────────────────────
if (!userId) {
  console.warn('⚠️  GOODREADS_USER_ID not set — keeping existing books data (if any).');
  process.exit(0);
}

const result = { ...existing };

for (const shelf of SHELVES) {
  try {
    const books = await fetchShelf(shelf);
    if (shelf === 'currently-reading') result.currentlyReading = books;
    else result.read = books;
    console.log(`  📚 ${shelf}: ${books.length} book(s)`);
  } catch (err) {
    console.error(`  ❌ Failed to fetch "${shelf}" — keeping previous data: ${err.message}`);
  }
}

result.syncedAt = new Date().toISOString();

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(result, null, 2) + '\n');

const n = result.currentlyReading.length;
const m = result.read.length;
console.log(`✅ Synced ${n} currently-reading, ${m} read books`);
process.exit(0);