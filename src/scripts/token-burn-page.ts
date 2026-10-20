// /tokens hydration: fetch view=full after first paint, fill the static skeleton.
import {
  formatApproxUsd,
  formatTokens,
  INLINE_MODEL_ICONS,
  modelBrandIcon,
  modelColor,
  shortModelName,
} from '@/lib/runtime/llm-format';
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

function costLabel(cost: number): string {
  return cost > 0 ? formatApproxUsd(cost) : '—';
}

function windowMeta(window: TokenBurnWindow): string {
  return `${window.sessions.toLocaleString()} sess · ${costLabel(window.cost)}`;
}

function updateHero(root: HTMLElement, tb: TokenBurnFullPayload) {
  text('[data-tok-hero-tokens]', tb.allTime.tokens.toLocaleString(), root);
  text('[data-tok-stat="spend"]', `${formatApproxUsd(tb.allTime.cost)} est`, root);
  text('[data-tok-stat="sessions"]', tb.allTime.sessions.toLocaleString(), root);
  text('[data-tok-stat="machines"]', String(tb.machines.length || '—'), root);
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

function buildChartBar(day: TokenBurnFullPayload['daily'][number], maxTokens: number, isPeak: boolean, delayMs: number) {
  const group = document.createElement('div');
  group.className = 'tok-bar-group relative flex h-full flex-1 items-end justify-end';

  // Stacked per-model segments (Leo has none — this is the house diff).
  const stack = document.createElement('div');
  stack.className = `tok-stack w-full ${isPeak ? 'is-peak' : ''}`;
  stack.style.animationDelay = `${delayMs}ms`;

  const segments = Object.entries(day.byModel ?? {})
    .sort((a, b) => b[1].tokens - a[1].tokens);
  if (segments.length === 0) {
    const seg = document.createElement('span');
    seg.className = 'tok-seg';
    seg.style.height = `${Math.max(1.5, (day.tokens / maxTokens) * 100)}%`;
    seg.style.background = 'var(--fg)';
    stack.append(seg);
  } else {
    for (const [model, slice] of segments) {
      const seg = document.createElement('span');
      seg.className = 'tok-seg';
      seg.style.height = `${(slice.tokens / maxTokens) * 100}%`;
      seg.style.background = modelColor(model);
      seg.setAttribute('title', `${shortModelName(model)} · ${formatTokens(slice.tokens)}`);
      stack.append(seg);
    }
  }

  const tooltip = document.createElement('span');
  tooltip.className = 'tok-tooltip';
  tooltip.textContent = `${day.date} · ${formatTokens(day.tokens)} · ${costLabel(day.cost)}`;

  group.append(stack, tooltip);
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
      buildChartBar(day, maxTokens, index === peakIndex, 200 + index * 9),
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
  row.className = 'tok-model-row flex items-center gap-3 px-4 py-2.5';

  const rankEl = document.createElement('span');
  rankEl.className = 'w-5 shrink-0 font-mono text-[11px] text-(--fg-faint)';
  rankEl.textContent = String(rank).padStart(2, '0');

  const dot = document.createElement('span');
  dot.className = 'h-2 w-2 shrink-0 rounded-full';
  dot.style.background = modelColor(model.model);

  const brand = modelBrandIcon(model.model);
  const icon = document.createElement(brand.type === 'cdn' ? 'img' : 'span');
  if (brand.type === 'cdn') {
    icon.setAttribute('src', `https://cdn.simpleicons.org/${brand.slug}`);
    icon.setAttribute('alt', '');
    icon.setAttribute('loading', 'lazy');
    icon.className = 'h-4 w-4 shrink-0';
  } else {
    icon.className = 'inline-flex h-4 w-4 shrink-0 items-center justify-center text-(--fg)';
    icon.innerHTML = INLINE_MODEL_ICONS[brand.key] ?? '';
  }

  const name = document.createElement('span');
  name.className = 'min-w-0 flex-1 truncate text-sm sm:flex-none sm:w-60';
  name.textContent = shortModelName(model.model);
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
  cost.textContent = model.cost > 0 ? formatApproxUsd(model.cost) : '—';

  row.append(rankEl, dot, icon, name, barWrap, tokens, share, cost);
  return row;
}

function buildMoreRows(models: TokenBurnModelSlice[], startRank: number, maxTokens: number, totalTokens: number) {
  const details = document.createElement('details');
  details.className = 'group/tokmore';

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
      show('[data-tok-error]', false, root);
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

// astro:page-load fires on first paint and SPA navigations alike.
document.addEventListener('astro:page-load', hydrateTokenBurn);
