// AI coding token spend, read from a private, pre-aggregated summary JSON in
// the `token-burn` repo via the GitHub Contents API. The source URL and PAT
// both live in env and are only used server-side, so neither the endpoint nor
// the credential reaches the client. The summary holds only time-absolute
// data — `today`/`last7Days`/`last30Days` are derived here from `daily[]`
// using the Hanoi calendar (`hanoi-date`).
import { hanoiStartDateOffset, todayInHanoi } from '@/lib/runtime/hanoi-date';
import { env } from '@/lib/env';
import type {
  TokenBurnDailyPoint,
  TokenBurnFullPayload,
  TokenBurnModelSlice,
  TokenBurnPayload,
  TokenBurnWindow,
} from '@/types/token-burn';

type TokenBurnTotals = {
  tokens?: number
  cost?: number;
  sessions?: number;
  messages?: number;
};

type TokenBurnDailyRow = TokenBurnTotals & {
  date: string;
  byModel?: Record<string, TokenBurnTotals>;
};

type TokenBurnSummary = {
  lastActivity?: string | null;
  machines?: string[];
  allTime?: TokenBurnTotals;
  byModel?: Record<string, TokenBurnTotals>;
  daily?: TokenBurnDailyRow[];
};

const EMPTY_WINDOW: TokenBurnWindow = {
  cost: 0,
  tokens: 0,
  sessions: 0,
  messages: 0,
};

function unavailablePayload<T extends TokenBurnPayload | TokenBurnFullPayload>(error: string, full: boolean): T {
  const base = {
    ok: false as const,
    allTime: EMPTY_WINDOW,
    today: EMPTY_WINDOW,
    last7Days: EMPTY_WINDOW,
    last30Days: EMPTY_WINDOW,
    machines: [],
    error,
  };
  return (full
    ? { ...base, allTimeModels: [], todayModels: [], daily: [] }
    : { ...base, topModels: [] }) as unknown as T;
}

function windowOf(rows: TokenBurnTotals[]): TokenBurnWindow {
  return rows.reduce<TokenBurnWindow>(
    (acc, row) => ({
      cost: acc.cost + (row.cost ?? 0),
      tokens: acc.tokens + (row.tokens ?? 0),
      sessions: acc.sessions + (row.sessions ?? 0),
      messages: acc.messages + (row.messages ?? 0),
    }),
    { ...EMPTY_WINDOW },
  );
}

// Token-sorted `byModel` map (tokens lead, cost is secondary).
function modelSlices(byModel: Record<string, TokenBurnTotals> | undefined, limit?: number): TokenBurnModelSlice[] {
  const slices = Object.entries(byModel ?? {})
    .map(([model, totals]) => ({
      model,
      cost: totals.cost ?? 0,
      tokens: totals.tokens ?? 0,
    }))
    .sort((a, b) => b.tokens - a.tokens);
  return limit ? slices.slice(0, limit) : slices;
}

function baseWindows(summary: TokenBurnSummary, daily: TokenBurnDailyRow[]) {
  const today = todayInHanoi();
  const from7 = hanoiStartDateOffset(today.startMs, -6);
  const from30 = hanoiStartDateOffset(today.startMs, -29);
  const todayRow = daily.find((row) => row.date === today.date);
  return {
    allTime: windowOf([summary.allTime ?? {}]),
    today: windowOf(todayRow ? [todayRow] : []),
    last7Days: windowOf(daily.filter((row) => row.date >= from7)),
    last30Days: windowOf(daily.filter((row) => row.date >= from30)),
    todayRow,
    machines: summary.machines ?? [],
  };
}

function buildTokenBurnPayload(summary: TokenBurnSummary): TokenBurnPayload {
  const daily = summary.daily ?? [];
  const { allTime, today, last7Days, last30Days, todayRow, machines } = baseWindows(summary, daily);
  return {
    ok: true,
    allTime,
    today,
    last7Days,
    last30Days,
    topModels: modelSlices(todayRow?.byModel, 10),
    machines,
    lastActivity: summary.lastActivity ?? undefined,
  };
}

function toDailyPoints(daily: TokenBurnDailyRow[]): TokenBurnDailyPoint[] {
  return [...daily]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((row) => ({
      date: row.date,
      tokens: row.tokens ?? 0,
      cost: row.cost ?? 0,
      sessions: row.sessions ?? 0,
    }));
}

function buildTokenBurnFullPayload(summary: TokenBurnSummary): TokenBurnFullPayload {
  const daily = summary.daily ?? [];
  const { allTime, today, last7Days, last30Days, todayRow, machines } = baseWindows(summary, daily);
  return {
    ok: true,
    allTime,
    today,
    last7Days,
    last30Days,
    // All-time breakdown lives on the summary; today's is the matching daily row.
    allTimeModels: modelSlices(summary.byModel),
    todayModels: modelSlices(todayRow?.byModel),
    daily: toDailyPoints(daily),
    machines,
    lastActivity: summary.lastActivity ?? undefined,
  };
}

// Fetch the pre-aggregated summary. The endpoint URL and the credential live in
// env only. `TOKEN_BURN_GH_TOKEN` (dedicated token with read access to the
// private repo) wins so heatmap-style read tokens can coexist; fallback is the
// generic `GITHUB_API_TOKEN`.
async function fetchTokenBurnSummary(): Promise<{ summary: TokenBurnSummary } | { error: string }> {
  const endpoint = env('TOKEN_BURN_SUMMARY_URL');
  if (!endpoint) return { error: 'TOKEN_BURN_SUMMARY_URL is not configured.' };
  const token = env('TOKEN_BURN_GH_TOKEN') ?? env('GITHUB_API_TOKEN');
  if (!token) return { error: 'TOKEN_BURN_GH_TOKEN / GITHUB_API_TOKEN is not configured.' };

  try {
    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.raw+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { error: `summary fetch failed with HTTP ${response.status}.` };
    return { summary: (await response.json()) as TokenBurnSummary };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'summary request failed.' };
  }
}

export async function fetchTokenBurn(): Promise<TokenBurnPayload> {
  const result = await fetchTokenBurnSummary();
  if ('error' in result) return unavailablePayload<TokenBurnPayload>(result.error, false);
  return buildTokenBurnPayload(result.summary);
}

export async function fetchTokenBurnFull(): Promise<TokenBurnFullPayload> {
  const result = await fetchTokenBurnSummary();
  if ('error' in result) return unavailablePayload<TokenBurnFullPayload>(result.error, true);
  return buildTokenBurnFullPayload(result.summary);
}
