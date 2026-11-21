// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

// ============================================================================
// DAWN BLOG SYSTEM ARCHITECTURE (FULL EDGE & C4 MODEL)
// ============================================================================
const sys_d = (x, y, opts = {}) => ({ type: "block", x, y, color: "blue", glyph: "server", ...opts });

const sys_f = (x, y, opts = {}) => ({
  type: "block",
  x,
  y,
  color: "orange",
  glyph: "balancer",
  label: ["Load", "Balancer"],
  pills: "above",
  ...opts,
});

const sys_b = (x, y, opts = {}) => ({ type: "db", x, y, ...opts });

const sys_y = (x, y, opts = {}) => ({ type: "device", x, y, ...opts });

const sys_h = (from, to, pts, opts = {}) => ({ from, to, pts, heads: "end", ...opts });

export const systemDesignLesson = {
  id: "system-design",
  title: "Dawn Blog System Architecture",
  summary:
    "Progressive Edge-First Architecture — from Author Publishing to Global Edge Serving & Database Mutations.",
  minutes: 10,
  level: "intermediate",
  metrics: ["latency", "hitRate", "deploys", "conns", "total_uptime"],
  legend: ["req", "res", ["ping", "handshake"], "fail"],
  goals: [
    { text: "Content drafting on Author Workstation", step: 1 },
    { text: "Astro 5 SSG build via GitHub Actions", step: 2 },
    { text: "Deploying to 300+ Edge PoPs with cache purge", step: 3 },
    { text: "Sub-20ms TTFB reader cache hits", step: 4 },
    { text: "Serverless SSR & Prisma connection pooling", step: 5 },
    { text: "The complete dual-pipeline architecture", step: 6 },
  ],
  steps: [
    // Step 1: Author Workstation (Drafting in Notion)
    {
      short: "Draft",
      chapter: "technique",
      title: "Author Workstation: Hit Publish",
      body: [
        "Everything starts on the <b>Author Workstation</b>. Technical deep-dives, CS lab specifications, and book notes are drafted in a private workspace.",
        'Writing and staging content is completely decoupled from production, consuming zero production server resources. Hitting "Publish" triggers the automated build pipeline.',
      ],
      callout: {
        kind: "insight",
        text: "Decoupled CMS: Writing and staging content consumes zero production server bandwidth.",
      },
      changes: ["+ Author Workstation", "+ Technical post drafted", '+ Click "Publish"'],
      metrics: {
        latency: "—",
        hitRate: "Drafting",
        deploys: "—",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, {
            label: "Author",
            tags: [{ text: "Drafting in Notion", icon: "file" }],
          }),
        },
        links: {},
        flows: [],
      },
    },

    // Step 2: Headless CMS & CI/CD Ingestion Appears
    {
      short: "SSG Build",
      chapter: "technique",
      title: "Headless Ingestion & Astro 5 SSG Compilation",
      body: [
        "The publishing webhook triggers the <b>GitHub Actions CI Runner</b>.",
        "The runner executes <code>sync-notion.mjs</code>, fetches updated blocks via the <b>Notion API</b>, validates content schemas, and compiles 140+ static routes with Astro 5 in under 2 seconds.",
      ],
      callout: {
        kind: "tip",
        text: "Static Site Generation (SSG) compiles HTML ahead of time, eliminating origin compute costs for all readers.",
      },
      changes: [
        "+ Notion API connected",
        "+ GitHub Actions CI Runner",
        "+ Astro 5 compiles 140+ SSG pages in 1.8s",
      ],
      metrics: {
        latency: "—",
        hitRate: "Staging",
        deploys: "1.8 s",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, {
            label: "Author",
            tags: [{ text: "Published ✓", tone: "green" }],
          }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
            cpu: 0.85,
            tags: [{ text: "1.8s Build", tone: "green" }],
          }),
        },
        links: {
          author_notion: sys_h("author", "notion", ["author", "notion"], {
            label: "POST /publish",
            heads: "end",
          }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], {
            label: "Sync & Build",
            heads: "end",
          }),
        },
        flows: [
          { route: ["author_notion"], bounce: false, rate: 1.2 },
          { route: ["notion_ci"], bounce: false, rate: 1.2 },
        ],
      },
    },

    // Step 3: Global Edge Deployment & Instant Cache Invalidation
    {
      short: "Edge Deploy",
      chapter: "solution",
      title: "Global Edge Deployment & Instant Cache Invalidation",
      body: [
        "The compiled immutable HTML/JS artifact is deployed to <b>Vercel Edge</b> across 300+ Point-of-Presence (PoP) locations worldwide.",
        "Simultaneously, a <b>Cache Invalidation</b> signal purges stale pages, priming the edge cache so readers immediately receive updated content.",
      ],
      callout: {
        kind: "warn",
        text: "Atomic cache invalidation guarantees readers never experience mismatched styling or outdated scripts.",
      },
      changes: [
        "+ Vercel Edge CDN (300+ PoPs)",
        "+ Global cache purge triggered",
        "+ Immutable static assets synced",
      ],
      metrics: {
        latency: "—",
        hitRate: "Purged",
        deploys: "Done (2s)",
        conns: "0",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
            tags: [{ text: "Deploy Success", tone: "green" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Cache Purged", tone: "amber" }],
          }),
        },
        links: {
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { label: "Deploy", heads: "end" }),
        },
        flows: [{ route: ["ci_edge"], bounce: false, rate: 1.4 }],
      },
    },

    // Step 4: Reader Ingress & Sub-20ms Global Cache HIT
    {
      short: "Cache HIT",
      chapter: "technique",
      title: "Reader Ingress & Sub-20ms Global Cache HIT",
      body: [
        "A reader visits <code>https://dawn.dev/blog</code>. Their browser initiates TLS 1.3 routed via Anycast to the closest edge server.",
        "Edge memory detects the primed cache and serves pre-rendered HTML in <b>sub-20ms TTFB</b> without touching origin compute or databases.",
      ],
      callout: {
        kind: "tip",
        text: "Edge memory serving eliminates origin compute overhead and delivers instant page transitions worldwide.",
      },
      changes: [
        "+ Reader HTTPS / TLS 1.3 handshake",
        "+ Sub-20ms TTFB Edge Memory Cache HIT",
        "+ Zero origin server load",
      ],
      metrics: {
        latency: "18 ms",
        hitRate: "98.8%",
        deploys: "—",
        conns: "0 (Zero DB Load)",
        total_uptime: "99.999%",
      },
      scene: {
        entities: {
          readers: sys_y(-14, -8, {
            label: "Readers",
            tags: [{ text: "https://dawn.dev", icon: "globe" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Cache HIT · 18ms", tone: "green" }],
          }),
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "GET /blog",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { style: "off" }),
        },
        flows: [{ route: ["readers_edge"], bounce: true, rate: 1.5 }],
      },
    },

    // Step 5: Serverless SSR & PostgreSQL Prisma Connection Pool
    {
      short: "SSR & DB",
      chapter: "technique",
      title: "Serverless SSR & PostgreSQL Prisma Connection Pool",
      body: [
        "When a reader likes a post or interacts with an interactive CS Lab, Vercel Edge proxies the mutation to the <b>Astro Serverless Lambda</b>.",
        "Astro utilizes a persistent <b>Prisma Connection Pool</b> to execute atomic upserts in <b>PostgreSQL 16</b> in 1.2ms without exhausting database connection limits.",
      ],
      callout: {
        kind: "insight",
        text: "Connection pooling prevents database exhaustion during traffic spikes that spawn hundreds of concurrent serverless lambdas.",
      },
      changes: [
        "+ Dynamic API mutation bypasses cache",
        "+ Astro Serverless Lambda triggered",
        "+ Prisma pool manages active sockets",
        "+ PostgreSQL atomic mutation in 1.2ms",
      ],
      metrics: {
        latency: "45 ms",
        hitRate: "BYPASS",
        deploys: "—",
        conns: "1 / 10 active",
        total_uptime: "99.99%",
      },
      scene: {
        entities: {
          readers: sys_y(-14, -8, {
            label: "Readers",
            tags: [{ text: "POST /like", tone: "violet" }],
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
            tags: [{ text: "Proxy SSR API", tone: "amber" }],
          }),
          astro: sys_d(12, 0, {
            color: "violet",
            glyph: "server",
            label: ["Astro SSR"],
            sub: "Serverless",
            cpu: 0.65,
            pills: "above",
            tags: [{ text: "Prisma · 45ms", tone: "violet" }],
          }),
          db: sys_b(26, 0, {
            label: "PostgreSQL",
            cpu: 0.45,
            tags: [{ text: "Pool: 1/10", tone: "green" }],
          }),
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "POST /like",
            heads: "end",
          }),
          edge_astro: sys_h("edge", "astro", ["edge", "astro"], {
            label: "SSR Proxy",
            heads: "end",
          }),
          astro_db: sys_h("astro", "db", ["astro", "db"], {
            label: "Prisma Query",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], { style: "off" }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], { style: "off" }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], { style: "off" }),
        },
        flows: [
          { route: ["readers_edge"], bounce: false, rate: 1.2 },
          { route: ["edge_astro"], bounce: false, rate: 1.2 },
          { route: ["astro_db"], bounce: true, rate: 1.2 },
        ],
      },
    },

    // Step 6: Unified Dual-Pipeline Architecture Recap
    {
      short: "Recap",
      chapter: "recap",
      title: "Unified Architecture: Dual Ingestion & Edge Serving Pipeline",
      body: [
        "The complete architecture bridges two autonomous pipelines: The <b>Author Ingestion Pipeline</b> (Top) compiles immutable content ahead of time with zero production friction.",
        "The <b>Reader Edge Pipeline</b> (Bottom) delivers static posts in sub-20ms from Vercel Edge memory while seamlessly routing dynamic CS labs to pooled PostgreSQL 16 serverless compute.",
      ],
      callout: {
        kind: "next",
        text: "Production Philosophy: Static by default, Edge cached globally, Serverless SSR only when state mutation is strictly necessary.",
      },
      changes: [
        "✓ 2 Independent Pipelines",
        "✓ Authoring decoupled from serving",
        "✓ Sub-20ms TTFB worldwide",
        "✓ 0ms backend load on static hits",
      ],
      metrics: {
        latency: "18 ms",
        hitRate: "98.8%",
        deploys: "1.8 s",
        conns: "Optimal",
        total_uptime: "99.999%",
      },
      scene: {
        entities: {
          author: sys_y(-18, 6, { label: "Author" }),
          notion: sys_d(-8, 12, {
            color: "purple",
            glyph: "globe",
            label: ["Notion CMS"],
            sub: "Headless",
          }),
          ci: sys_d(4, 14, {
            color: "yellow",
            glyph: "zap",
            label: ["GitHub Actions"],
            sub: "CI/CD",
          }),
          edge: sys_f(-2, 0, {
            color: "blue",
            glyph: "balancer",
            label: ["Vercel Edge"],
            sub: "Anycast CDN",
            pills: "above",
          }),
          readers: sys_y(-14, -8, { label: "Readers" }),
          astro: sys_d(12, 0, {
            color: "violet",
            glyph: "server",
            label: ["Astro SSR"],
            sub: "Serverless",
          }),
          db: sys_b(26, 0, { label: "PostgreSQL" }),
        },
        links: {
          readers_edge: sys_h("readers", "edge", ["readers", "edge"], {
            label: "Static Hit · 18ms",
            heads: "both",
          }),
          edge_astro: sys_h("edge", "astro", ["edge", "astro"], {
            label: "SSR Proxy",
            heads: "end",
          }),
          astro_db: sys_h("astro", "db", ["astro", "db"], {
            label: "Prisma Query",
            heads: "both",
          }),
          author_notion: sys_h("author", "notion", ["author", "notion"], {
            label: "Content Sync",
            heads: "end",
          }),
          notion_ci: sys_h("notion", "ci", ["notion", "ci"], {
            label: "Build Webhook",
            heads: "end",
          }),
          ci_edge: sys_h("ci", "edge", ["ci", "edge"], {
            label: "Deploy SSG",
            heads: "end",
          }),
        },
        flows: [
          { route: ["readers_edge"], bounce: true, rate: 1.2 },
          { route: ["edge_astro"], bounce: false, rate: 1.2 },
          { route: ["astro_db"], bounce: true, rate: 1.2 },
        ],
      },
    },
  ],
};

export default systemDesignLesson;
