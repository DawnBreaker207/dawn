// Token spend from the private pre-aggregated summary in the token-burn repo
// (env-held URL + token, server-side only — nothing reaches the client).
// `.daily[]` is time-absolute; windows are derived with the Hanoi calendar.
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
    // Rail sparkline only shows the last 14 days; slice server-side to keep the payload lean.
    daily: toDailyPoints(daily).slice(-14),
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
      byModel: Object.fromEntries(
        Object.entries(row.byModel ?? {}).map(([model, slice]) => [
          model,
          { tokens: slice.tokens ?? 0, cost: slice.cost ?? 0 },
        ]),
      ),
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

// TOKEN_BURN_GH_TOKEN wins so the heatmap token can stay a separate credential.
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
