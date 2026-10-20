import type { APIRoute } from 'astro';

// Token-burn telemetry lives outside the repo (private summary pushed by the
// desktop CLI). Its location arrives via env; with none configured the API
// answers 200 + ok:false so rails render their offline state — no 404 noise.
export const GET: APIRoute = async ({ url }) => {
  const origin = process.env.TOKEN_BURN_SUMMARY_URL;
  let raw: string | null = null;
  try {
    if (origin) raw = await (await fetch(origin)).text();
  } catch {
    raw = null;
  }
  if (!raw) {
    const empty = {
      ok: false,
      error: 'telemetry offline — TOKEN_BURN_SUMMARY_URL not configured',
      allTime: { cost: 0, tokens: 0, sessions: 0, messages: 0 },
      today: { cost: 0, tokens: 0, sessions: 0, messages: 0 },
      last7Days: { cost: 0, tokens: 0, sessions: 0, messages: 0 },
      last30Days: { cost: 0, tokens: 0, sessions: 0, messages: 0 },
      topModels: [],
      machines: [],
      daily: [],
      allTimeModels: [],
      todayModels: [],
    };
    return new Response(JSON.stringify(empty), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(raw, { status: 200, headers: { 'Content-Type': 'application/json' } });
};
