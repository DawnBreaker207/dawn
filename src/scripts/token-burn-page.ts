// Client hydration for /tokens: fetch the full payload after first paint and
// fill the static skeleton. The compact rail/card variant of Leo's widget is
// out of scope here — this page always loads the `view=full` payload.
import type { TokenBurnFullPayload, TokenBurnModelSlice, TokenBurnWindow } from '@/types/token-burn';

const CHART_DAYS = 90;
const VISIBLE_MODELS = 8;

function text(selector: string, value: string, root: ParentNode = document) {
  const element = root.querySelector<HTMLElement>(selector);
  if (element) element.textContent = value;
}

function show(selector: string, visible: boolean, root: ParentNode = document) {
  const element = root.querySelector<HTMLElement>(selector);
  if (element) element.hidden = !visible;
}

export function formatTokens(value: number | null | undefined): string {
  const tokens = value ?? 0;
  if (tokens >= 1e9) return `${(tokens / 1e9).toFixed(2)}B`;
  if (tokens >= 1e6) return `${(tokens / 1e6).toFixed(1)}M`;
  if (tokens >= 1e3) return `${(tokens / 1e3).toFixed(1)}K`;
  return tokens.toLocaleString();
}

// Cost is an estimated retail figure, so round to whole dollars.
function formatUsd(value: number | null | undefined): string {
  const cost = value ?? 0;
  if (cost > 0 && cost < 1) return '~<$1';
  return `~$${Math.round(cost).toLocaleString()}`;
}

function costLabel(cost: number): string {
  return cost > 0 ? formatUsd(cost) : '—';
}

function windowMeta(window: TokenBurnWindow): string {
  return `${window.sessions.toLocaleString()} sess · ${costLabel(window.cost)}`;
}

function updateHero(root: HTMLElement, tb: TokenBurnFullPayload) {
  text('[data-tok-hero-tokens]', tb.allTime.tokens.toLocaleString(), root);
  text('[data-tok-meta="spend"]', formatUsd(tb.allTime.cost), root);
  text('[data-tok-meta="sessions"]', tb.allTime.sessions.toLocaleString(), root);
  text('[data-tok-meta="messages"]', tb.allTime.messages.toLocaleString(), root);
}

function updateWindows(root: HTMLElement, tb: TokenBurnFullPayload) {
  const windows = [
    ['today', tb.today],
    ['last7Days', tb.last7Days],
    ['last30Days', tb.last30Days],
  ] as const;
  for (const [key, window] of windows) {
    text(`[data-tok-window="${key}"]`, formatTokens(window.tokens), root);
    text(`[data-tok-window-meta="${key}"]`, windowMeta(window), root);
  }
}

function buildChartBar(tokens: number, maxTokens: number, isPeak: boolean, delayMs: number, tooltip: string) {
  const group = document.createElement('div');
  group.className = 'tok-bar-group relative flex h-full flex-1 items-end';
  const bar = document.createElement('div');
  const height = Math.max(1.5, (tokens / maxTokens) * 100);
  bar.className = `tok-bar w-full rounded-t-xs ${isPeak ? 'is-peak' : ''}`;
  bar.style.height = `${height}%`;
  bar.style.animationDelay = `${delayMs}ms`;
  bar.setAttribute('title', tooltip);
  group.append(bar);
  return group;
}

function updateChart(root: HTMLElement, tb: TokenBurnFullPayload) {
  const series = tb.daily.slice(-CHART_DAYS);
  show('[data-tok-chart-section]', series.length > 0, root);
  if (series.length === 0) return;

  const maxTokens = Math.max(1, ...series.map((day) => day.tokens));
  const peakIndex = series.reduce(
    (best, day, index) => (day.tokens > series[best].tokens ? index : best),
    0,
  );
  const bars = root.querySelector<HTMLElement>('[data-tok-chart-bars]');
  if (!bars) return;

  bars.replaceChildren(
    ...series.map((day, index) =>
      buildChartBar(
        day.tokens,
        maxTokens,
        index === peakIndex,
        200 + index * 9,
        `${day.date} · ${formatTokens(day.tokens)} · ${costLabel(day.cost)}`,
      ),
    ),
  );

  text('[data-tok-chart-count]', `${series.length}d`, root);
  text('[data-tok-chart-peak]', `peak ${formatTokens(maxTokens)}`, root);
  text('[data-tok-chart-first]', series[0]?.date ?? '—', root);
  text('[data-tok-chart-last]', series.at(-1)?.date ?? '—', root);
  text('[data-tok-chart-max]', formatTokens(maxTokens), root);
  text('[data-tok-chart-mid]', formatTokens(maxTokens * 0.5), root);
}

function buildModelRow(model: TokenBurnModelSlice, rank: number, maxTokens: number, totalTokens: number) {
  const row = document.createElement('div');
  row.className = 'tok-model-row flex items-center gap-3 sm:gap-4 px-4 py-2.5';

  const rankEl = document.createElement('span');
  rankEl.className = 'w-5 shrink-0 font-mono text-[11px] text-(--fg-faint)';
  rankEl.textContent = String(rank).padStart(2, '0');

  const name = document.createElement('span');
  name.className = 'min-w-0 flex-1 truncate text-sm sm:flex-none sm:w-64';
  name.textContent = model.model;
  name.setAttribute('title', model.model);

  const barWrap = document.createElement('span');
  barWrap.className = 'hidden h-1.5 flex-1 overflow-hidden rounded-full bg-(--border) sm:block';
  const bar = document.createElement('span');
  bar.className = 'tok-model-bar block h-full rounded-full';
  bar.style.width = `${Math.max(2, (model.tokens / maxTokens) * 100)}%`;
  barWrap.append(bar);

  const tokens = document.createElement('span');
  tokens.className = 'w-20 shrink-0 text-right font-mono text-xs tabular-nums';
  tokens.textContent = formatTokens(model.tokens);

  const share = document.createElement('span');
  share.className = 'w-10 shrink-0 text-right font-mono text-xs text-(--fg-faint)';
  const pct = (model.tokens / totalTokens) * 100;
  share.textContent = pct >= 1 ? `${Math.round(pct)}%` : '<1%';

  const cost = document.createElement('span');
  cost.className = 'w-20 shrink-0 text-right font-mono text-xs text-(--fg-faint)';
  cost.textContent = model.cost > 0 ? formatUsd(model.cost) : '—';

  row.append(rankEl, name, barWrap, tokens, share, cost);
  return row;
}

function buildMoreRows(models: TokenBurnModelSlice[], startRank: number, maxTokens: number, totalTokens: number) {
  const details = document.createElement('details');
  details.className = 'tok-more group';

  const summary = document.createElement('summary');
  summary.className =
    'flex cursor-pointer list-none items-center gap-2 border-t border-(--border) px-4 py-2.5 font-mono text-[11px] tracking-widest text-(--fg-faint) uppercase transition-colors hover:text-(--fg)';
  summary.innerHTML =
    '<span class="transition-transform group-open:rotate-90">▸</span>' +
    `<span class="group-open:hidden">show ${models.length} more</span>` +
    '<span class="hidden group-open:inline">show less</span>';

  details.append(summary);
  for (const [index, model] of models.entries()) {
    details.append(buildModelRow(model, startRank + index, maxTokens, totalTokens));
  }
  return details;
}

function updateModels(root: HTMLElement, tb: TokenBurnFullPayload) {
  const models = tb.allTimeModels;
  show('[data-tok-models-section]', models.length > 0, root);
  if (models.length === 0) return;

  const container = root.querySelector<HTMLElement>('[data-tok-models]');
  if (!container) return;

  const maxTokens = Math.max(1, ...models.map((model) => model.tokens));
  const totalTokens = models.reduce((sum, model) => sum + model.tokens, 0) || 1;
  const top = models.slice(0, VISIBLE_MODELS);
  const rest = models.slice(VISIBLE_MODELS);
  const rows: HTMLElement[] = top.map((model, index) => buildModelRow(model, index + 1, maxTokens, totalTokens));
  if (rest.length > 0) {
    rows.push(buildMoreRows(rest, VISIBLE_MODELS + 1, maxTokens, totalTokens));
  }
  container.replaceChildren(...rows);
  text('[data-tok-model-count]', `${models.length} models`, root);
}

function updateProvenance(root: HTMLElement, tb: TokenBurnFullPayload) {
  text('[data-tok-machines]', tb.machines.length ? tb.machines.join(', ') : '—', root);
  const lastActivity = (tb.lastActivity ?? '').slice(0, 10);
  show('[data-tok-last-wrap]', Boolean(lastActivity), root);
  if (lastActivity) text('[data-tok-last]', lastActivity, root);
}

function renderUnavailable(root: HTMLElement, payloadError?: string) {
  show('[data-tok-error]', true, root);
  text('[data-tok-error]', `telemetry is unavailable right now: ${payloadError ?? 'unknown error'}`, root);
}

async function hydrateTokenBurn() {
  const root = document.querySelector<HTMLElement>('[data-token-burn]');
  if (!root || root.dataset.tokHydrated === 'true') return;
  root.dataset.tokHydrated = 'true';

  try {
    const response = await fetch('/api/token-burn.json?view=full');
    const tb = (await response.json()) as TokenBurnFullPayload;
    if (typeof tb === 'object' && tb !== null && tb.ok === true) {
      updateHero(root, tb);
      updateWindows(root, tb);
      updateChart(root, tb);
      updateModels(root, tb);
      updateProvenance(root, tb);
      return;
    }
    renderUnavailable(root, (tb as { error?: string }).error);
  } catch (error) {
    console.warn('[tokens] failed to hydrate token-burn page', error);
    renderUnavailable(root);
  }
}

// ClientRouter (BaseLayout) fires astro:page-load on first paint and on SPA
// navigations alike — hydrating at most once per page instance.
document.addEventListener('astro:page-load', hydrateTokenBurn);
