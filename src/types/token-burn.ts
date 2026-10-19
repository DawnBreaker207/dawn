// One window of token-burn numbers. `cost` is an estimate (retail pricing),
// never an invoice.
export interface TokenBurnWindow {
  cost: number;
  tokens: number;
  sessions: number;
  messages: number;
}

export interface TokenBurnModelSlice {
  model: string;
  cost: number;
  tokens: number;
}

// A single published day from the private telemetry summary. Dates are the
// local (Hanoi) calendar day the usage happened on.
export interface TokenBurnDailyPoint {
  date: string;
  tokens: number;
  cost: number;
  sessions: number;
}

/**
 * Compact payload for cards. The `today`/`last7Days`/`last30Days` windows are
 * derived server-side from the summary's `daily[]` using the Hanoi calendar —
 * the stored file deliberately holds only time-absolute data.
 */
export interface TokenBurnPayload {
  ok: boolean
  allTime: TokenBurnWindow;
  today: TokenBurnWindow;
  last7Days: TokenBurnWindow;
  last30Days: TokenBurnWindow;
  topModels: TokenBurnModelSlice[];
  machines: string[];
  lastActivity?: string;
  error?: string;
}

/**
 * The `/tokens` page's richer view: same windows plus the all-time per-model
 * breakdown and the full `daily[]` series the compact payload drops.
 */
export interface TokenBurnFullPayload {
  ok: boolean;
  allTime: TokenBurnWindow;
  today: TokenBurnWindow;
  last7Days: TokenBurnWindow;
  last30Days: TokenBurnWindow;
  allTimeModels: TokenBurnModelSlice[];
  todayModels: TokenBurnModelSlice[];
  daily: TokenBurnDailyPoint[];
  machines: string[];
  lastActivity?: string;
  error?: string;
}
