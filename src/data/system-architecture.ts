/**
 * System Architecture Design Configuration
 * Follows Cloudflare Edge-First Architecture & C4 Container Model
 */

export interface SystemZone {
  id: string;
  title: string;
  color: 'blue' | 'purple' | 'teal' | 'orange' | 'gray';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SystemContainer {
  id: string;
  zoneId: string;
  tier: 'data' | 'control' | 'vault';
  type: 'user' | 'edge' | 'safe' | 'agent' | 'infra' | 'sensitive';
  icon: string;
  c4Tag: string;
  title: string;
  desc: string[];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SystemFlow {
  id: string;
  step: number;
  tier: 'data' | 'control' | 'vault';
  stepNumber: string;
  protoTag: string;
  fullLabel: string;
  from: string;
  to: string;
  style: 'solid' | 'dashed';
  color: 'blue' | 'purple' | 'teal' | 'orange' | 'gray';
  d: string;
  mid: { x: number; y: number };
  badgeW: number;
}

export interface SystemArchitecture {
  version: string;
  title: string;
  viewBox: string;
  zones: SystemZone[];
  containers: SystemContainer[];
  flows: SystemFlow[];
}

export const systemArchitecture: SystemArchitecture = {
  version: "2.3.0",
  title: "System Architecture Design",
  viewBox: "0 0 1440 780",
  zones: [
    {
      id: "zone_public",
      title: "PUBLIC INTERNET (CLIENTS)",
      color: "blue",
      x: 35,
      y: 45,
      width: 250,
      height: 690
    },
    {
      id: "zone_edge",
      title: "EDGE CDN & INGESTION (CLOUDFLARE / VERCEL)",
      color: "purple",
      x: 315,
      y: 45,
      width: 570,
      height: 690
    },
    {
      id: "zone_origin",
      title: "PROTECTED ORIGIN & VAULT (ZERO TRUST)",
      color: "teal",
      x: 915,
      y: 45,
      width: 490,
      height: 690
    }
  ],

  containers: [
    // --- TOP ROW: DATA PLANE (READTIME) ---
    {
      id: "reader",
      zoneId: "zone_public",
      tier: "data",
      type: "user",
      icon: "browser",
      c4Tag: "Browser Client",
      title: "Web Browser (Reader)",
      desc: [
        "Read tech posts & CS labs",
        "Command Palette (Ctrl+K)",
        "Live view & reaction events"
      ],
      x: 55,
      y: 110,
      width: 210,
      height: 210
    },
    {
      id: "vercel_edge",
      zoneId: "zone_edge",
      tier: "data",
      type: "edge",
      icon: "vercel",
      c4Tag: "Edge CDN · Cache",
      title: "Vercel Edge & Cache",
      desc: [
        "Global edge asset caching",
        "Sub-30ms TTFB responses",
        "Route dynamic SSR APIs"
      ],
      x: 345,
      y: 110,
      width: 220,
      height: 210
    },
    {
      id: "astro_app",
      zoneId: "zone_origin",
      tier: "data",
      type: "safe",
      icon: "astro",
      c4Tag: "Astro 5 · Engine",
      title: "Astro 5 Core & CS Labs",
      desc: [
        "Compile MDX via Content Collections",
        "Interactive React Islands for CS labs",
        "Serverless API endpoints (/api/stats)"
      ],
      x: 940,
      y: 110,
      width: 440,
      height: 210
    },

    // --- BOTTOM ROW: CONTROL PLANE & PERSISTENCE ---
    {
      id: "author",
      zoneId: "zone_public",
      tier: "control",
      type: "user",
      icon: "author",
      c4Tag: "Notion Client",
      title: "Author (Notion App)",
      desc: [
        "Write technical MDX drafts",
        "Manage roadmap & timeline",
        "Update Now status & bookshelf"
      ],
      x: 55,
      y: 440,
      width: 210,
      height: 210
    },
    {
      id: "notion_cms",
      zoneId: "zone_edge",
      tier: "control",
      type: "agent",
      icon: "notion",
      c4Tag: "Headless CMS",
      title: "Notion API Databases",
      desc: [
        "Headless posts & tags store",
        "Structured roadmap schemas",
        "Bearer token API security"
      ],
      x: 345,
      y: 440,
      width: 220,
      height: 210
    },
    {
      id: "gh_actions",
      zoneId: "zone_edge",
      tier: "control",
      type: "infra",
      icon: "github",
      c4Tag: "CI/CD Runner",
      title: "GitHub Actions CI",
      desc: [
        "Daily cron sync (00:00 UTC+7)",
        "Run sync-notion.mjs parser",
        "Build bundle, commit & push"
      ],
      x: 655,
      y: 440,
      width: 210,
      height: 210
    },
    {
      id: "postgres",
      zoneId: "zone_origin",
      tier: "vault",
      type: "sensitive",
      icon: "postgres",
      c4Tag: "PostgreSQL DB",
      title: "PostgreSQL Database",
      desc: [
        "Persist views & reactions",
        "Prisma connection pool",
        "Thread-safe atomic count"
      ],
      x: 940,
      y: 440,
      width: 205,
      height: 210
    },
    {
      id: "vault",
      zoneId: "zone_origin",
      tier: "vault",
      type: "sensitive",
      icon: "vault",
      c4Tag: "Secret Vault",
      title: "Environment Vault",
      desc: [
        "Encrypted DATABASE_URL",
        "Protected NOTION_TOKEN",
        "LLM token spend tracking"
      ],
      x: 1175,
      y: 440,
      width: 205,
      height: 210
    }
  ],

  flows: [
    // 1. Reader -> Vercel Edge: corridor x=265 to x=345 (80px)
    {
      id: "flow-1",
      step: 1,
      tier: "data",
      stepNumber: "1",
      protoTag: "HTTPS",
      fullLabel: "Reader requests technical articles over secure HTTPS",
      from: "reader",
      to: "vercel_edge",
      style: "solid",
      color: "blue",
      d: "M 265 215 L 345 215",
      mid: { x: 305, y: 215 },
      badgeW: 66
    },
    // 2. Vercel Edge -> Astro Engine: corridor x=565 to x=940 (375px)
    {
      id: "flow-2",
      step: 2,
      tier: "data",
      stepNumber: "2",
      protoTag: "EDGE SSR",
      fullLabel: "Vercel Edge serves cached static HTML or proxies dynamic SSR requests",
      from: "vercel_edge",
      to: "astro_app",
      style: "solid",
      color: "teal",
      d: "M 565 215 L 940 215",
      mid: { x: 752, y: 215 },
      badgeW: 78
    },
    // 3. Astro Engine -> Postgres: vertical gap y=320 to y=440 (120px)
    {
      id: "flow-3",
      step: 3,
      tier: "data",
      stepNumber: "3",
      protoTag: "SQL POOL",
      fullLabel: "Astro serverless API increments views & reactions via Prisma connection pool",
      from: "astro_app",
      to: "postgres",
      style: "solid",
      color: "teal",
      d: "M 1042 320 L 1042 440",
      mid: { x: 1042, y: 380 },
      badgeW: 76
    },

    // 4. Author -> Notion CMS: corridor x=265 to x=345 (80px)
    {
      id: "flow-4",
      step: 4,
      tier: "control",
      stepNumber: "4",
      protoTag: "NOTION",
      fullLabel: "Author creates and edits technical articles within Notion CMS workspace",
      from: "author",
      to: "notion_cms",
      style: "dashed",
      color: "purple",
      d: "M 265 545 L 345 545",
      mid: { x: 305, y: 545 },
      badgeW: 68
    },
    // 5. Notion CMS -> GitHub Actions: corridor x=565 to x=655 (90px)
    {
      id: "flow-5",
      step: 5,
      tier: "control",
      stepNumber: "5",
      protoTag: "CRON",
      fullLabel: "GitHub Actions daily cron (00:00 UTC+7) fetches updated MDX from Notion",
      from: "notion_cms",
      to: "gh_actions",
      style: "dashed",
      color: "purple",
      d: "M 565 545 L 655 545",
      mid: { x: 610, y: 545 },
      badgeW: 60
    },
    // 6. GitHub Actions -> Vercel Edge: smooth upward curve through corridor
    {
      id: "flow-6",
      step: 6,
      tier: "control",
      stepNumber: "6",
      protoTag: "DEPLOY",
      fullLabel: "Automated workflow validates MDX, builds static bundle, and triggers edge deployment",
      from: "gh_actions",
      to: "vercel_edge",
      style: "solid",
      color: "gray",
      d: "M 730 440 C 730 370, 565 350, 565 275",
      mid: { x: 635, y: 355 },
      badgeW: 68
    },

    // 7. Vault -> Astro Engine: vertical wire (staggered high at y=355)
    {
      id: "flow-7",
      step: 7,
      tier: "vault",
      stepNumber: "7",
      protoTag: "VAULT",
      fullLabel: "Secure environment vault injects encrypted runtime secrets & DATABASE_URL into Astro",
      from: "vault",
      to: "astro_app",
      style: "dashed",
      color: "orange",
      d: "M 1235 440 L 1235 320",
      mid: { x: 1235, y: 355 },
      badgeW: 64
    },
    // 8. Astro Engine -> Vault (Token Telemetry): vertical wire (staggered low at y=405)
    {
      id: "flow-8",
      step: 8,
      tier: "vault",
      stepNumber: "8",
      protoTag: "AI TOKEN",
      fullLabel: "Astro queries private telemetry store for LLM token usage and spend tracking",
      from: "astro_app",
      to: "vault",
      style: "dashed",
      color: "orange",
      d: "M 1320 320 L 1320 440",
      mid: { x: 1320, y: 405 },
      badgeW: 72
    }
  ]
};
