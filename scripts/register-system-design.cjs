const fs = require('fs');

const BUNDLE_PATH = 'public/dts/assets/index-BeXJu_A0.js';
let code = fs.readFileSync(BUNDLE_PATH, 'utf-8');

// 1. Ensure Lm metric fmt for ttfb is Y
code = code.replace('ttfb:{label:D(`TTFB`),icon:`timer`,fmt:Nm}', 'ttfb:{label:D(`TTFB`),icon:`timer`,fmt:Y}');

// 2. Locate region
let start = code.indexOf('sys_d = (x, y, opts = {}) =>');
if (start === -1) {
  start = code.indexOf('systemDesignLesson = {');
}
const end = code.indexOf('awsCloudLesson={id:`aws-cloud`');

if (end === -1) {
  console.error('Could not find awsCloudLesson');
  process.exit(1);
}

if (start === -1) {
  start = end;
}

const cleanLesson = `sys_d = (x, y, opts = {}) => ({ type: 'block', x, y, color: 'blue', glyph: 'server', ...opts }),
sys_f = (x, y, opts = {}) => ({ type: 'block', x, y, color: 'orange', glyph: 'balancer', label: ['Load', 'Balancer'], pills: 'below', ...opts }),
sys_b = (x, y, opts = {}) => ({ type: 'db', x, y, ...opts }),
sys_y = (x, y, opts = {}) => ({ type: 'device', x, y, ...opts }),
sys_h = (from, to, pts, opts = {}) => ({ from, to, pts, heads: 'end', ...opts }),

systemDesignLesson = {
  id: 'system-design',
  title: 'Dawn Blog System Architecture',
  summary: 'Progressive Edge-First Architecture — from Author Publishing on 1 Laptop to Global Edge Serving & Database Mutations.',
  minutes: 10,
  level: 'intermediate',
  metrics: ['latency', 'hitRate', 'deploys', 'conns', 'total_uptime'],
  legend: ['req', 'res', ['ping', 'handshake'], 'fail'],
  goals: [
    { text: 'Authoring & Publishing from Workstation', step: 1 },
    { text: 'Headless Ingestion & Astro 5 SSG Bundle Compilation', step: 2 },
    { text: 'Global Edge CDN Deployment & Instant Cache Invalidation', step: 3 },
    { text: 'Reader Ingress & Sub-30ms Global Edge Cache HIT', step: 4 },
    { text: 'Serverless SSR Mutations with PostgreSQL Prisma Connection Pool', step: 5 },
    { text: 'Unified Edge-First Architecture & Dual Ingestion Pipeline', step: 6 }
  ],
  steps: [
    // Step 1: Exactly 1 computer (Author Workstation)
    {
      short: 'Publish',
      chapter: 'technique',
      title: 'Author Workstation: Hit Publish',
      body: [
        'Everything starts on the <b>Author Workstation</b>. The author drafts technical deep-dives, CS lab specifications, and book chapters directly in a private workspace.',
        'Editorial drafting is completely isolated from production. Pressing "Publish" commits the post and prepares the automated ingestion pipeline.'
      ],
      callout: {
        kind: 'insight',
        text: 'Decoupled CMS: Writing and staging content consumes zero production server bandwidth.'
      },
      changes: ['+ Author Workstation', '+ Markdown article drafted', '+ Click "Publish"'],
      metrics: { latency: '—', hitRate: 'Drafting', deploys: '—', conns: 'Idle', total_uptime: '99.99%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'author', tags: [{ text: 'Drafting in Notion / Markdown', icon: 'globe' }] })
        },
        links: {},
        flows: []
      }
    },

    // Step 2: Headless CMS & CI/CD Ingestion Appears (Spacious Top Lane)
    {
      short: 'SSG Build',
      chapter: 'technique',
      title: 'Headless Ingestion & Astro 5 SSG Compilation',
      body: [
        'The publishing webhook triggers the <b>GitHub Actions CI Runner</b>.',
        'The runner executes <code>sync-notion.mjs</code>, fetches updated blocks from <b>Notion Headless CMS</b>, validates frontmatter schemas, and compiles 140+ static routes with Astro 5 in under 2 seconds.'
      ],
      callout: {
        kind: 'tip',
        text: 'Static Site Generation (SSG) compiles HTML ahead of time, eliminating origin compute costs for all readers.'
      },
      changes: ['+ Notion Headless API connected', '+ GitHub Actions CI Runner', '+ Astro 5 compiles 140+ SSG pages in 1.8s'],
      metrics: { latency: '—', hitRate: 'Staging', deploys: '1.8 s', conns: 'Idle', total_uptime: '99.99%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'author', tags: [{ text: 'Published ✓', tone: 'green' }] }),
          notion: sys_d(-10, 10, { color: 'purple', glyph: 'globe', label: ['Notion CMS', 'Headless Store'], sub: 'Markdown API' }),
          ci: sys_d(0, 12, { color: 'yellow', glyph: 'zap', label: ['GitHub Actions', 'Astro Compiler'], cpu: 0.85, tags: [{ text: '142 SSG pgs <2s', tone: 'green' }] })
        },
        links: {
          c_notion: sys_h('client', 'notion', ['client', 'notion'], { label: 'POST /publish', heads: 'end' }),
          notion_ci: sys_h('notion', 'ci', ['notion', 'ci'], { label: 'Sync & SSG Build', heads: 'end' })
        },
        flows: [{ route: ['c_notion'], bounce: false, rate: 1.2 }, { route: ['notion_ci'], bounce: false, rate: 1.2 }]
      }
    },

    // Step 3: Global Edge Deployment & Cache Purge
    {
      short: 'Edge Deploy',
      chapter: 'solution',
      title: 'Global Edge Deployment & Instant Cache Invalidation',
      body: [
        'The compiled immutable HTML/JS artifact is deployed to <b>Vercel Edge</b> across 300+ Point-of-Presence (PoP) locations worldwide.',
        'Simultaneously, a <b>Cache Invalidation</b> signal purges stale pages, priming the edge cache so readers immediately receive updated content.'
      ],
      callout: {
        kind: 'warn',
        text: 'Atomic cache invalidation guarantees readers never experience mismatched styling or outdated scripts.'
      },
      changes: ['+ Vercel Edge CDN (300+ PoPs)', '+ Global cache purge triggered', '+ Immutable static assets synced'],
      metrics: { latency: '—', hitRate: 'Purged', deploys: 'Done (2s)', conns: 'Idle', total_uptime: '99.99%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'author' }),
          notion: sys_d(-10, 10, { color: 'purple', glyph: 'globe', label: ['Notion CMS', 'Headless Store'], sub: 'Markdown API' }),
          ci: sys_d(0, 12, { color: 'yellow', glyph: 'zap', label: ['GitHub Actions', 'Astro Compiler'], tags: [{ text: 'Deploy Success', tone: 'green' }] }),
          edge: sys_f(-4, 0, { color: 'blue', glyph: 'balancer', label: ['Vercel Edge', 'Global Anycast'], sub: '300+ PoPs', tags: [{ text: 'Cache Purged & Primed', tone: 'amber' }] })
        },
        links: {
          c_notion: sys_h('client', 'notion', ['client', 'notion'], { style: 'off' }),
          notion_ci: sys_h('notion', 'ci', ['notion', 'ci'], { style: 'off' }),
          ci_edge: sys_h('ci', 'edge', ['ci', 'edge'], { label: 'Deploy & Purge', heads: 'end' })
        },
        flows: [{ route: ['ci_edge'], bounce: false, rate: 1.4 }]
      }
    },

    // Step 4: Reader Ingress & Sub-30ms Global Cache HIT
    {
      short: 'Cache HIT',
      chapter: 'technique',
      title: 'Reader Ingress & Sub-30ms Global Cache HIT',
      body: [
        'Now shifting perspective to the reader: A user navigates to <code>https://dawn.dev/blog</code>. The browser initiates TLS 1.3 negotiation routed via Anycast to the closest edge server.',
        'Edge memory detects the primed cache and serves pre-rendered HTML in <b>sub-30ms TTFB</b> without touching origin compute or databases.'
      ],
      callout: {
        kind: 'tip',
        text: 'Edge memory serving eliminates origin compute overhead and delivers instant page transitions worldwide.'
      },
      changes: ['+ Reader HTTPS / TLS 1.3 handshake', '+ Sub-30ms TTFB Edge Memory Cache HIT', '+ Zero origin server load'],
      metrics: { latency: '28 ms', hitRate: '98.4%', deploys: '—', conns: '0 conn', total_uptime: '99.999%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'readers', tags: [{ text: 'https://dawn.dev', icon: 'globe' }] }),
          edge: sys_f(-4, 0, { color: 'blue', glyph: 'balancer', label: ['Vercel Edge', 'Global Anycast'], sub: '300+ PoPs', tags: [{ text: 'Cache HIT · 28ms', tone: 'green' }] }),
          notion: sys_d(-10, 10, { color: 'purple', glyph: 'globe', label: ['Notion CMS', 'Headless Store'], sub: 'Markdown API' }),
          ci: sys_d(0, 12, { color: 'yellow', glyph: 'zap', label: ['GitHub Actions', 'Astro Compiler'] })
        },
        links: {
          c_notion: sys_h('client', 'notion', ['client', 'notion'], { style: 'off' }),
          notion_ci: sys_h('notion', 'ci', ['notion', 'ci'], { style: 'off' }),
          ci_edge: sys_h('ci', 'edge', ['ci', 'edge'], { style: 'off' }),
          c_edge: sys_h('client', 'edge', ['client', 'edge'], { label: 'GET /blog', heads: 'both' })
        },
        flows: [{ route: ['c_edge'], bounce: true, rate: 1.5 }]
      }
    },

    // Step 5: Serverless SSR & PostgreSQL Database (Spacious & Arrow preserved from client!)
    {
      short: 'SSR & DB',
      chapter: 'technique',
      title: 'Serverless SSR & PostgreSQL Prisma Connection Pool',
      body: [
        'When a reader submits a reaction, checks real-time view counts, or runs a CS Lab simulation, Vercel Edge proxies the mutation to the <b>Astro Serverless Lambda</b>.',
        'Astro utilizes a persistent <b>Prisma Connection Pool</b> to execute atomic upserts in <b>PostgreSQL 16</b> in 1.2ms without exhausting database connection limits.'
      ],
      callout: {
        kind: 'insight',
        text: 'Connection pooling prevents database exhaustion during traffic spikes that spawn hundreds of concurrent serverless lambdas.'
      },
      changes: ['+ Arrow preserved: reader -> edge -> astro -> db', '+ PostgreSQL 16 Database connected', '+ Prisma connection pool manages active sockets', '+ Atomic reaction & view counter upsert in 1.2ms'],
      metrics: { latency: '48 ms', hitRate: 'BYPASS', deploys: '—', conns: '1 / 10', total_uptime: '99.99%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'readers', tags: [{ text: 'Reaction / Like', tone: 'violet' }] }),
          edge: sys_f(-4, 0, { color: 'blue', glyph: 'balancer', label: ['Vercel Edge', 'Global Anycast'], sub: '300+ PoPs', tags: [{ text: 'Proxy SSR API', tone: 'amber' }] }),
          astro: sys_d(6, 0, { color: 'violet', glyph: 'server', label: ['Astro Core', 'CS Labs Engine'], cpu: 0.65, pills: 'below', tags: [{ text: 'Prisma Query · 48ms', tone: 'violet' }] }),
          db: sys_b(16, 0, { label: 'PostgreSQL 16', cpu: 0.45, tags: [{ text: 'Pool: 1/10 conn · 1.2ms', tone: 'green' }] }),
          notion: sys_d(-10, 10, { color: 'purple', glyph: 'globe', label: ['Notion CMS', 'Headless Store'], sub: 'Markdown API' }),
          ci: sys_d(0, 12, { color: 'yellow', glyph: 'zap', label: ['GitHub Actions', 'Astro Compiler'] })
        },
        links: {
          c_notion: sys_h('client', 'notion', ['client', 'notion'], { style: 'off' }),
          notion_ci: sys_h('notion', 'ci', ['notion', 'ci'], { style: 'off' }),
          ci_edge: sys_h('ci', 'edge', ['ci', 'edge'], { style: 'off' }),
          c_edge: sys_h('client', 'edge', ['client', 'edge'], { label: 'POST /api/react', heads: 'end' }),
          edge_astro: sys_h('edge', 'astro', ['edge', 'astro'], { label: 'SSR Proxy', heads: 'end' }),
          astro_db: sys_h('astro', 'db', ['astro', 'db'], { label: 'Prisma Pool', heads: 'both' })
        },
        flows: [
          { route: ['c_edge'], bounce: false, rate: 1.2 },
          { route: ['edge_astro'], bounce: false, rate: 1.2 },
          { route: ['astro_db'], bounce: true, rate: 1.2 }
        ]
      }
    },

    // Step 6: Unified Dual-Pipeline Architecture Recap (Clean, Minimalist, No Tag Clutter)
    {
      short: 'Recap',
      chapter: 'recap',
      title: 'Unified Architecture: Dual Ingestion & Edge Serving Pipeline',
      body: [
        'The complete architecture bridges two autonomous pipelines: The <b>Author Ingestion Pipeline</b> (Top) compiles immutable content ahead of time with zero production friction.',
        'The <b>Reader Edge Pipeline</b> (Bottom) delivers static posts in sub-30ms from Vercel Edge memory while seamlessly routing dynamic CS labs to pooled PostgreSQL 16 serverless compute.'
      ],
      callout: {
        kind: 'next',
        text: 'Production Philosophy: Static by default, Edge cached globally, Serverless SSR only when state mutation is strictly necessary.'
      },
      changes: ['✓ Complete 2-Way Pipeline', '✓ Authoring decoupled from serving', '✓ Sub-30ms TTFB worldwide', '✓ 0ms backend load on static hits'],
      metrics: { latency: '28 ms', hitRate: '98.4%', deploys: '1.8 s', conns: 'Optimal', total_uptime: '99.999%' },
      scene: {
        entities: {
          client: sys_y(-16, 0, { label: 'readers / author' }),
          edge: sys_f(-4, 0, { color: 'blue', glyph: 'balancer', label: ['Vercel Edge', 'Global Anycast'], sub: '300+ PoPs' }),
          astro: sys_d(6, 0, { color: 'violet', glyph: 'server', label: ['Astro Core', 'CS Labs Engine'] }),
          db: sys_b(16, 0, { label: 'PostgreSQL 16' }),
          notion: sys_d(-10, 10, { color: 'purple', glyph: 'globe', label: ['Notion CMS', 'Headless Store'], sub: 'Markdown API' }),
          ci: sys_d(0, 12, { color: 'yellow', glyph: 'zap', label: ['GitHub Actions', 'Astro Compiler'] })
        },
        links: {
          c_edge: sys_h('client', 'edge', ['client', 'edge'], { label: 'Static Hit · 28ms', heads: 'both' }),
          edge_astro: sys_h('edge', 'astro', ['edge', 'astro'], { label: 'SSR Proxy', heads: 'end' }),
          astro_db: sys_h('astro', 'db', ['astro', 'db'], { label: 'Prisma Pool', heads: 'both' }),
          c_notion: sys_h('client', 'notion', ['client', 'notion'], { style: 'off' }),
          notion_ci: sys_h('notion', 'ci', ['notion', 'ci'], { style: 'off' }),
          ci_edge: sys_h('ci', 'edge', ['ci', 'edge'], { style: 'off' })
        },
        flows: [
          { route: ['c_edge'], bounce: true, rate: 1.2 },
          { route: ['edge_astro'], bounce: false, rate: 1.2 },
          { route: ['astro_db'], bounce: true, rate: 1.2 }
        ]
      }
    }
  ]
},\n`;

code = code.substring(0, start) + cleanLesson + code.substring(end);

if (!code.includes('[systemDesignLesson.id]:systemDesignLesson')) {
  code = code.replace(',nf={[awsCloudLesson.id]:awsCloudLesson', ',nf={[systemDesignLesson.id]:systemDesignLesson,[awsCloudLesson.id]:awsCloudLesson');
}

if (!code.includes('id:`system-design`')) {
  code = code.replace('{id:`aws-cloud`,title:`AWS Multi-AZ Resilience`,ready:!0}', '{id:`system-design`,title:`Dawn Blog System Architecture`,ready:!0},{id:`aws-cloud`,title:`AWS Multi-AZ Resilience`,ready:!0}');
}

fs.writeFileSync(BUNDLE_PATH, code, 'utf-8');
console.log('Successfully applied Spacious & Clean Step 6 Architecture! Total length:', code.length);
