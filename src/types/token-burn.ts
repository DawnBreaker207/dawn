// One usage window; `cost` is a retail estimate, not an invoice.
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

// A single published day; dates are local Hanoi calendar days. `byModel` is
// the per-day per-machine-merged breakdown (used for stacked charts).
export interface TokenBurnDailyPoint {
  date: string;
  tokens: number;
  cost: number;
  sessions: number;
  byModel?: Record<string, { tokens: number; cost: number }>;
}

/** Compact payload; windows are derived server-side (Hanoi calendar). */
export interface TokenBurnPayload {
  ok: boolean
  allTime: TokenBurnWindow;
  today: TokenBurnWindow;
  last7Days: TokenBurnWindow;
  last30Days: TokenBurnWindow;
  topModels: TokenBurnModelSlice[];
  machines: string[];
  daily?: TokenBurnDailyPoint[];
  lastActivity?: string;
  error?: string;
}

/** Richer view for /tokens: full daily[] series + all-time model breakdown. */
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
