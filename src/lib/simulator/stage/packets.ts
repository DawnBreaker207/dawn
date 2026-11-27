/**
 * Packet traffic: spawns packets from the active scene's flows and moves them
 * along link paths (multi-hop routes, bounce-back replies, holds, failures).
 */
import { round } from '../draw';
import { svgEl } from './dom';
import type { FlowSpec, StageLink } from './types';

/** Base packet speed (px/s). */
const PACKET_SPEED = 155;
/** Speed multipliers per packet kind. */
const KIND_SPEED: Record<string, number> = { heavy: 0.7, ping: 0.85, slow: 0.32 };
/** Distance kept from a link end when it has an arrow head (px). */
const ARROW_INSET = 16;
/** Pause between hops (s). */
const HOP_DWELL = 0.16;

const PACKET_SHAPES: Record<string, string> = {
  ping: `<circle r="3.6"/>`,
  kill: `<circle r="3.6"/>`,
  heavy: `<rect x="-6" y="-6" width="12" height="12" rx="3.5"/>`,
  write: `<rect x="-4.2" y="-4.2" width="8.4" height="8.4" rx="2"/>`,
  msg: `<rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="2.4"/>`,
  poison: `<rect x="-4.8" y="-4.8" width="9.6" height="9.6" rx="2.4"/>`,
};
const DEFAULT_SHAPE = `<circle r="4.3"/>`;

interface ActiveFlow extends FlowSpec {
  /** Fractional packets accumulated toward the next spawn. */
  acc: number;
  /** Packets spawned so far. */
  n: number;
  /** Round-robin cursor. */
  rr: number;
}

interface Packet {
  route: string[];
  /** Index of the current link in `route`. */
  seg: number;
  /** Distance travelled on the current link (px). */
  d: number;
  kind: string;
  el: SVGGElement;
  /** Travelling back toward the origin. */
  back: boolean;
  bounce: boolean;
  /** Remaining pause (s). */
  dwell: number;
  speed: number;
  hold: number;
}

export class PacketTraffic {
  private flows: ActiveFlow[] = [];
  private packets: Packet[] = [];

  constructor(
    private readonly layer: SVGGElement,
    private readonly links: Map<string, StageLink>,
  ) {}

  /** Starts spawning from a scene's flows (first packet comes quickly). */
  start(flows: FlowSpec[]): void {
    this.flows = flows.map((f) => ({ ...f, acc: 0.6, n: 0, rr: 0 }));
  }

  /** Stops spawning; in-flight packets are untouched. */
  stop(): void {
    this.flows = [];
  }

  /** Removes all packets, fading them out unless `immediate`. */
  clear(immediate = false): void {
    for (const p of this.packets) {
      if (immediate) p.el.remove();
      else {
        p.el.classList.add('pkt--leave');
        setTimeout(() => p.el.remove(), 260);
      }
    }
    this.packets = [];
  }

  /** Advances spawning and movement by `dt` seconds. */
  step(dt: number): void {
    for (const flow of this.flows) for (flow.acc += dt * flow.rate; flow.acc >= 1; ) {
      --flow.acc;
      this.spawn(flow);
    }
    const alive: Packet[] = [];
    for (const p of this.packets) {
      if (p.dwell > 0) {
        p.dwell -= dt;
        if (p.dwell > 0) {
          alive.push(p);
          continue;
        }
        p.el.style.opacity = '1';
        if (p.back) {
          p.el.classList.remove('pkt--held');
          p.el.classList.add('pkt--back');
        }
      }
      const link = this.links.get(p.route[p.seg]);
      if (!link) {
        p.el.remove();
        continue;
      }
      const speed = PACKET_SPEED * p.speed * (KIND_SPEED[p.kind] || 1);
      p.d += speed * dt;
      const len = link.len || link.el.getTotalLength();
      const style = link.spec.style || 'solid';
      const heads = style === 'beat' || style === 'cut' ? 'none' : link.spec.heads;
      let start = heads === 'both' ? ARROW_INSET : 0;
      let end = len - (heads === 'none' ? 0 : ARROW_INSET);
      if (end - start < 10) {
        start = 0;
        end = len;
      }
      const travel = end - start;

      if (p.d >= travel) {
        const at = link.el.getPointAtLength(p.back ? start : end);
        if (!p.back && Math.random() < (link.spec.fail || 0)) {
          this.burst(at.x, at.y, 'fail');
          p.el.remove();
          continue;
        }
        if (!p.back && p.seg < p.route.length - 1) {
          // Next hop.
          p.seg += 1;
          p.d = 0;
          p.dwell = HOP_DWELL;
          p.el.style.opacity = '0';
          alive.push(p);
          continue;
        }
        if (p.bounce && !p.back) {
          // Arrived: turn around (optionally holding first).
          p.back = true;
          p.d = 0;
          if (p.hold) {
            p.dwell = p.hold;
            p.el.classList.add('pkt--held');
          } else p.el.classList.add('pkt--back');
          alive.push(p);
          continue;
        }
        if (p.back && p.seg > 0) {
          // Previous hop on the way back.
          --p.seg;
          p.d = 0;
          p.dwell = HOP_DWELL;
          p.el.style.opacity = '0';
          alive.push(p);
          continue;
        }
        this.burst(at.x, at.y, 'ok');
        p.el.remove();
        continue;
      }
      const pos = link.el.getPointAtLength(p.back ? end - p.d : start + p.d);
      p.el.setAttribute('transform', `translate(${round(pos.x)} ${round(pos.y)})`);
      alive.push(p);
    }
    this.packets = alive;
  }

  private pickRoute(flow: ActiveFlow): { route: string[]; kind: string } {
    const kind = flow.pattern ? flow.pattern[flow.n % flow.pattern.length] : flow.kind || 'req';
    if (flow.routes) {
      let i: number;
      if (flow.pick === 'weights') {
        const weights = flow.routes.map((r) => r.weight ?? 1);
        let x = Math.random() * weights.reduce((a, b) => a + b, 0);
        i = weights.findIndex((w) => (x -= w) <= 0);
        if (i < 0) i = weights.length - 1;
      } else {
        i = flow.rr % flow.routes.length;
        flow.rr += 1;
      }
      flow.n += 1;
      return { route: flow.routes[i].path, kind: flow.routes[i].kind || kind };
    }
    // A flow without `routes` always has `route`.
    const route = (flow.route as (string | string[])[]).map((step) => {
      if (typeof step === 'string') return step;
      if (flow.pick === 'weights') {
        // Weighted choices always come with `weights`.
        const weights = flow.weights as number[];
        let x = Math.random() * weights.reduce((a, b) => a + b, 0);
        for (let k = 0; k < step.length; k++) if (((x -= weights[k]), x <= 0)) return step[k];
        return step[step.length - 1];
      }
      const choice = step[flow.rr % step.length];
      flow.rr += 1;
      return choice;
    });
    flow.n += 1;
    return { route, kind };
  }

  private spawn(flow: ActiveFlow): void {
    if (flow.fanout) {
      flow.n += 1;
      // Fan-out flows always define `routes`.
      for (const r of flow.routes as NonNullable<FlowSpec['routes']>) this.launch(r.path, r.kind || flow.kind || 'req', flow);
      return;
    }
    const { route, kind } = this.pickRoute(flow);
    this.launch(route, kind, flow);
  }

  private launch(route: string[], kind: string, flow: ActiveFlow): void {
    if (!route.every((id) => this.links.has(id))) return;
    const el = svgEl('g', { class: `pkt pkt--${kind}` });
    el.innerHTML = Object.hasOwn(PACKET_SHAPES, kind) ? PACKET_SHAPES[kind] : DEFAULT_SHAPE;
    this.layer.appendChild(el);
    this.packets.push({
      route,
      seg: 0,
      d: 0,
      kind,
      el,
      back: false,
      bounce: !!flow.bounce,
      dwell: 0,
      speed: flow.speed || 1,
      hold: flow.hold || 0,
    });
  }

  /** Short-lived success / failure ring at a packet's arrival point. */
  private burst(x: number, y: number, kind: 'ok' | 'fail'): void {
    const el = svgEl('g', { class: `fx fx--${kind}`, transform: `translate(${round(x)} ${round(y)})` });
    el.innerHTML =
      kind === 'fail'
        ? `<circle r="5" class="fx-ring"/><path d="M-3.6,-3.6 L3.6,3.6 M3.6,-3.6 L-3.6,3.6" class="fx-x"/>`
        : `<circle r="4.3" class="fx-ring"/>`;
    this.layer.appendChild(el);
    setTimeout(() => el.remove(), 700);
  }
}
