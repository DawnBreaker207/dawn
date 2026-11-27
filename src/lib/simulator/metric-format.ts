/**
 * Units and formatting for the lab HUD metric chips.
 *
 * Scene steps store raw numbers (e.g. `p95: 2400`, `hitRate: 80`, `users: 12e3`);
 * the unit depends on what the metric measures. Unknown keys render as plain
 * numbers — never assume milliseconds.
 */

type Unit = 'ms' | '%' | '/s' | '/min' | '$/mo';

const METRIC_UNITS: Record<string, Unit> = {
  // latencies & durations
  p50: 'ms', p95: 'ms', p99: 'ms', dns: 'ms', connect: 'ms', request: 'ms', download: 'ms', total: 'ms',
  lockWait: 'ms', imgLoad: 'ms', respond: 'ms', checkout: 'ms', redirectMs: 'ms', feedMs: 'ms',
  screenMs: 'ms', deliverMs: 'ms', lon: 'ms', syd: 'ms',
  // shares & rates in percent
  errors: '%', dbLoad: '%', hitRate: '%', prodLoad: '%', util: '%', success: '%', hottest: '%',
  maxShare: '%', served: '%', apiCpu: '%', stuffing: '%', unused: '%', wasted: '%', deadCalls: '%',
  // throughput
  rps: '/s', origin: '/s', throughput: '/s', wps: '/s', dbQps: '/s', peak: '/s', avg: '/s',
  perShard: '/s', limited: '/s', abuser: '/s', rpm: '/min',
  // money
  cost: '$/mo',
};

const formatNumber = (n: number) =>
  Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 });

/** Display text for a metric value; `null`/`undefined` show as an em dash, strings as-is. */
export function formatMetric(key: string, value: unknown): string {
  if (value == null) return '—';
  if (typeof value !== 'number') return String(value);
  const unit = METRIC_UNITS[key];
  const n = formatNumber(value);
  switch (unit) {
    case 'ms':
      return `${n} ms`;
    case '%':
      return `${n}%`;
    case '/s':
      return `${n}/s`;
    case '/min':
      return `${n}/min`;
    case '$/mo':
      return `$${n}/mo`;
    default:
      return n;
  }
}
