/**
 * Panel: a floating HUD card with a title, text lines (`= ` ok, `! ` alert,
 * `# ` comment, `**bold**`) and an optional chart (`hockey` latency curve or
 * `bars` timeline).
 */
import { iconMarkup } from '../icon';
import { isoProject as iso, round, type Rect } from '../iso';
import { INK, PILL_SHADOW } from '../palette';
import { escapeText, richText, textWidth } from '../text';

export interface PanelBar {
  label: string;
  from?: number;
  to?: number;
  tone?: string;
  note?: string;
  bold?: boolean;
}

export interface PanelProps {
  type: string;
  x: number;
  y: number;
  z: number;
  /** Screen offset from the anchor (px). */
  dx: number;
  dy: number;
  /** Minimum width (px). */
  w: number;
  title: string;
  icon: string;
  lines: string[];
  chart: string | null;
  bars: PanelBar[];
  /** Hockey-chart utilization marker 0..1. */
  marker: number;
  opacity: number;
  lift: number;
  /** Animated box size override during content swaps. */
  boxW?: number;
  boxH?: number;
  /** Content fade during swaps. */
  fade?: number;
}

export interface PanelRender {
  body: string;
  over: string;
  poly: null;
  size: { w: number; h: number };
  bounds: Rect;
}

export const PANEL_DEFAULTS = {
  z: 0,
  dx: 0,
  dy: 0,
  w: 0,
  title: ``,
  icon: `sparkles`,
  lines: [],
  chart: null,
  bars: [],
  marker: 0,
  opacity: 1,
  lift: 0,
};

const BAR_TONES: Record<string, string> = {
  green: `#9FD28F`,
  amber: `#EFB041`,
  red: `#E5534B`,
  gray: `#B5AB9E`,
  violet: `#CBBAE6`,
  blue: `#A9C5E8`,
};

/** Latency-vs-utilization "hockey stick" chart with a marker at `marker`. */
function hockeyChart(x: number, y: number, w: number, h: number, marker: number): string {
  const latency = (u: number) => Math.min(1, 0.06 / Math.max(0.02, 1 - u));
  const px = (u: number) => x + u * w;
  const py = (v: number) => y + h - v * h;
  let curve = ``;
  for (let i = 0; i <= 60; i++) {
    const u = (i / 60) * 0.985;
    curve += `${i ? `L` : `M`}${round(px(u))},${round(py(latency(u)))} `;
  }
  const mu = Math.min(0.985, marker);
  const mx = px(mu);
  const my = py(latency(mu));
  const color = marker >= 0.85 ? `#e5534b` : marker >= 0.6 ? `#efb041` : `#7fc278`;
  return `
    <path d="M${round(x)},${round(y)} V${round(y + h)} H${round(x + w)}" fill="none" stroke="#a59c90" stroke-width="1.2"/>
    <rect x="${round(px(0.8))}" y="${round(y)}" width="${round(px(1) - px(0.8))}" height="${round(h)}" fill="#e5534b" opacity=".08"/>
    <path d="${curve}" fill="none" stroke="${INK}" stroke-width="2"/>
    <path d="M${round(mx)},${round(y + h)} V${round(my)}" stroke="${color}" stroke-width="1.4" stroke-dasharray="3 3"/>
    <circle cx="${round(mx)}" cy="${round(my)}" r="5.2" fill="${color}" stroke="${INK}" stroke-width="1.6"/>
    <text x="${round(x + w)}" y="${round(y + h + 14)}" text-anchor="end" font-size="9.5" font-weight="700" fill="#6f6961">utilization →</text>
    <text x="${round(x + 4)}" y="${round(y + 9)}" font-size="9.5" font-weight="700" fill="#6f6961">latency</text>
    <text x="${round(Math.min(mx, x + w - 30))}" y="${round(Math.max(my - 10, y + 22))}" text-anchor="middle" font-size="10.5" font-weight="800" fill="${INK}">${Math.round(marker * 100)}%</text>`;
}

/** Horizontal bar timeline: label column, track, bar from `from` to `to` (0..1), note after the bar. */
function barsChart(x: number, y: number, w: number, labelW: number, bars: PanelBar[], noteW = 46): string {
  const trackX = x + labelW;
  const trackW = w - labelW - noteW;
  return bars
    .map((bar, i) => {
      const rowY = y + i * 19;
      const barX = trackX + (bar.from || 0) * trackW;
      const barW = Math.max(3, ((bar.to ?? 1) - (bar.from || 0)) * trackW);
      return `
        <text y="${round(rowY + 12)}" font-size="10.5" font-weight="${bar.bold ? 800 : 500}" fill="#34302b" x="${round(x)}">${bar.label}</text>
        <rect x="${round(trackX)}" y="${round(rowY + 3)}" width="${round(trackW)}" height="11" rx="3" fill="#f1e8db"/>
        <rect x="${round(barX)}" y="${round(rowY + 3)}" width="${round(barW)}" height="11" rx="3" fill="${BAR_TONES[bar.tone || `gray`]}" stroke="${INK}" stroke-opacity=".55" stroke-width="1"/>
        <text y="${round(rowY + 12)}" font-size="10" font-weight="800" fill="${INK}" x="${round(barX + barW + 6)}">${bar.note || ``}</text>`;
    })
    .join(``);
}

export function renderPanel(e: PanelProps): PanelRender {
  const [ax, ay] = iso(e.x, e.y, e.z);
  const textW = Math.max(
    textWidth(e.title, 10) + e.title.length + 48,
    ...e.lines.map((l) => textWidth(l.replace(/\*\*/g, ``).replace(/^[=#!] /, ``), 11.5) + 30),
  );
  const barLabelW = e.chart === `bars` ? Math.max(...e.bars.map((b) => textWidth(b.label, 10.5))) + 14 : 0;
  const barNoteW = e.chart === `bars` ? Math.max(46, ...e.bars.map((b) => textWidth(b.note || ``, 10) + 12)) : 0;
  const w = Math.max(e.w, textW, e.chart === `bars` ? barLabelW + 184 + barNoteW : e.chart ? 220 : 0);
  const chartH = e.chart === `hockey` ? 96 : e.chart === `bars` ? e.bars.length * 19 : 0;
  const h = 34 + e.lines.length * 18 + (e.chart === `hockey` ? chartH + 22 : e.chart === `bars` ? chartH + 12 : 0) + 6;
  const left = ax + e.dx;
  const top = ay + e.dy - e.lift;
  const boxW = e.boxW ?? w;
  const boxH = e.boxH ?? h;
  const fade = e.fade ?? 1;
  const textX = (offset: number) => `x="${round(left + offset)}"`;

  let lines = ``;
  e.lines.forEach((line, i) => {
    const y = top + 34 + i * 18 + 12;
    if (line.startsWith(`= `)) {
      lines += `<rect x="${round(left + 10)}" y="${round(y - 13)}" width="${round(w - 20)}" height="18" rx="5" fill="#dcefd2"/>`;
      lines += `<text ${textX(16)} y="${round(y)}" font-size="11.5" font-weight="800" fill="#24521c">${richText(line.slice(2))}</text>`;
    } else if (line.startsWith(`! `)) {
      lines += `<rect x="${round(left + 10)}" y="${round(y - 13)}" width="${round(w - 20)}" height="18" rx="5" fill="#f8d5cf"/>`;
      lines += `<text ${textX(16)} y="${round(y)}" font-size="11.5" font-weight="800" fill="#8f2a22">${richText(line.slice(2))}</text>`;
    } else if (line.startsWith(`# `)) {
      lines += `<text ${textX(16)} y="${round(y)}" font-size="10.5" font-weight="500" fill="#8b847a">${richText(line.slice(2))}</text>`;
    } else {
      lines += `<text ${textX(16)} y="${round(y)}" font-size="11.5" font-weight="500" fill="#34302b">${richText(line)}</text>`;
    }
  });
  const chartY = top + 34 + e.lines.length * 18 + 10;
  const chart =
    e.chart === `hockey`
      ? hockeyChart(left + 18, chartY, w - 36, chartH - 14, e.marker)
      : e.chart === `bars`
        ? barsChart(left + 16, chartY - 2, w - 32, barLabelW, e.bars, barNoteW)
        : ``;
  return {
    body: ``,
    over: `
    <g opacity="${round(e.opacity)}">
      <rect x="${round(left)}" y="${round(top + 2.5)}" width="${round(boxW)}" height="${round(boxH)}" rx="10" fill="${PILL_SHADOW}"/>
      <rect x="${round(left)}" y="${round(top)}" width="${round(boxW)}" height="${round(boxH)}" rx="10" fill="#fbf7f1" stroke="${INK}" stroke-width="1.4"/>
      <path d="M${round(left + 12)},${round(top + 30)} H${round(left + boxW - 12)}" stroke="#e6ddd0" stroke-width="1"/>
      <g opacity="${round(fade)}">
        ${iconMarkup(e.icon, left + 20, top + 18, 13, { stroke: 2.1, color: `#6f6961` })}
        <text ${textX(33)} y="${round(top + 21.5)}" font-size="10" font-weight="800" letter-spacing="1" fill="#6f6961">${escapeText(e.title.toLocaleUpperCase(`en`))}</text>
        ${lines}
        ${chart}
      </g>
    </g>`,
    poly: null,
    size: { w, h },
    bounds: [left - 6, top - 6, left + boxW + 6, top + boxH + 10],
  };
}
