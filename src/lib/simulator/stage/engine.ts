/**
 * StageEngine — the interactive isometric stage.
 *
 * Owns the SVG, the entities and links currently on stage, and the camera.
 * `goTo(scene)` diffs the new scene against what is on stage and animates the
 * transition in three overlapping phases: exits → moves → enters, then draws
 * new links and finally starts the scene's packet flows.
 */
import {
  buildDefs,
  buildPill,
  entityFootprint,
  entitySortKey,
  isoProject,
  round,
  roundedPolygonPath,
  smoothPath,
  trimPathEnd,
  trimPathStart,
} from '../draw';
import { themeMarkup } from './color';
import { SVG_NS, svgEl } from './dom';
import { StageCamera } from './camera';
import { attachGestures } from './gestures';
import { placeLabel } from './labels';
import { dockRect, planScene, resolvePoint, scaledCardSize, type ScenePlan, type Viewport } from './layout';
import {
  EASE,
  ENTER_FROM,
  ENTER_FROM_DEFAULT,
  EXIT_TO,
  EXIT_TO_DEFAULT,
  TIMING,
  clamp01,
  lerp,
  sameJson,
  tweenSwaps,
  type EntityTween,
} from './motion';
import { PacketTraffic } from './packets';
import { centerOf, renderEntityMarkup, renderPanel, withDefaults } from './renderers';
import { LABEL_FONT_SIZE, labelBoxSize } from './text';
import type { Cam, Corner, EntityProps, FlowSpec, LinkSpec, Point, Rect, StageLink, StageScene } from './types';

/** Upper bound of the HUD card scale. */
const MAX_HUD_SCALE = 1.16;
/** Below this host width (px) HUD cards are hidden. */
const MIN_CARD_HOST_WIDTH = 520;
/** Entity id under which the (single) HUD panel lives on stage. */
const CARD_ID = '__card';
/** Entities drawn on the floor layer, below everything else. */
const FLOOR_TYPES = new Set(['zone', 'ring']);
/** Entities that never get a settle spotlight. */
const NO_SPOTLIGHT = ['panel', 'queue', 'zone', 'ring'];

interface StageEntity {
  id: string;
  cur: EntityProps;
  /** Body group (floor or depth-sorted entity layer). */
  el: SVGGElement;
  /** Overlay group (labels / pills, or the HUD for panels). */
  overEl: SVGGElement;
  poly: Point[] | null;
  bounds?: Rect | null;
  tween: EntityTween | null;
}

interface StepAnimation {
  cam: { from: Cam; to: Cam; delay: number; dur: number };
  start: number;
  end: number;
  flows: FlowSpec[];
  /** Entities to spotlight once the transition settles. */
  spot: string[];
}

interface Layers {
  floor: SVGGElement;
  links: SVGGElement;
  packets: SVGGElement;
  ents: SVGGElement;
  over: SVGGElement;
  hud: SVGGElement;
}

export class StageEngine {
  host: HTMLElement;
  svg: SVGSVGElement;
  paused = false;
  destroyed = false;
  rafId = 0;
  resizeObserver: ResizeObserver | null = null;
  onVisibilityChange: (() => void) | null = null;
  onCards: ((visible: boolean) => void) | null = null;
  onSwipe: ((dir: number) => void) | null = null;
  onSettle: (() => void) | null = null;
  hudScale = MAX_HUD_SCALE;
  showCards = true;
  scenes: StageScene[] = [];
  scene: StageScene | undefined;
  anim: StepAnimation | null = null;
  last = 0;
  size = '';

  private readonly layers: Layers;
  readonly camera: StageCamera;
  private readonly defs: SVGDefsElement;
  private readonly ents = new Map<string, StageEntity>();
  private readonly links = new Map<string, StageLink>();
  private plans = new Map<StageScene, ScenePlan>();
  private readonly traffic: PacketTraffic;

  constructor(host: HTMLElement) {
    this.host = host;
    this.svg = svgEl('svg', {
      class: `stage-svg`,
      xmlns: SVG_NS,
      preserveAspectRatio: `xMidYMid meet`,
      role: `img`,
    });
    this.svg.innerHTML = `
      <defs class="defs-theme">${themeMarkup(buildDefs())}</defs>
      <defs>
        <radialGradient id="grid-fade" gradientUnits="userSpaceOnUse">
          <stop offset="0" stop-color="#fff"/>
          <stop offset=".42" stop-color="#fff" stop-opacity=".92"/>
          <stop offset=".78" stop-color="#fff" stop-opacity=".35"/>
          <stop offset="1" stop-color="#fff" stop-opacity="0"/>
        </radialGradient>
        <mask id="grid-mask" maskUnits="userSpaceOnUse" x="-1500" y="-1500" width="3000" height="3000">
          <rect x="-1500" y="-1500" width="3000" height="3000" fill="url(#grid-fade)"/>
        </mask>
      </defs>
      <rect class="stage-grid" x="-1500" y="-1500" width="3000" height="3000" fill="url(#iso-grid)" mask="url(#grid-mask)"/>
      <g class="layer-floor"></g>
      <g class="layer-links"></g>
      <g class="layer-packets"></g>
      <g class="layer-ents"></g>
      <g class="layer-over"></g>
      <g class="layer-hud"></g>`;
    host.appendChild(this.svg);

    // The markup above guarantees these elements exist.
    const layer = (name: string) => this.svg.querySelector(`.layer-${name}`) as SVGGElement;
    this.layers = {
      floor: layer('floor'),
      links: layer('links'),
      packets: layer('packets'),
      ents: layer('ents'),
      over: layer('over'),
      hud: layer('hud'),
    };
    this.camera = new StageCamera(host, this.svg, this.layers.hud, this.svg.querySelector('#grid-fade') as SVGRadialGradientElement);
    this.defs = this.svg.querySelector('.defs-theme') as SVGDefsElement;
    this.traffic = new PacketTraffic(this.layers.packets, this.links);
    this.last = performance.now();

    attachGestures(host, this.camera, (dir) => this.onSwipe?.(dir));

    this.resizeObserver = new ResizeObserver(() => {
      const size = `${host.clientWidth}x${host.clientHeight}`;
      if (size !== this.size) {
        this.size = size;
        this.refit();
      }
    });
    this.resizeObserver.observe(host);

    const loop = (now: number) => {
      if (this.destroyed) return;
      this.tick(now);
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);

    // Pause the render loop while the tab is hidden.
    this.onVisibilityChange = () => {
      if (document.hidden) {
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = 0;
        }
      } else if (!this.destroyed && !this.rafId) {
        this.last = performance.now();
        this.rafId = requestAnimationFrame(loop);
      }
    };
    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  // ── Planning & camera ────────────────────────────────────────────────────

  private viewport(): Viewport {
    return {
      width: this.host.clientWidth,
      height: this.host.clientHeight,
      hudScale: this.hudScale,
      showCards: this.showCards,
    };
  }

  private planFor(scene: StageScene, prev: ScenePlan | null): ScenePlan {
    return planScene(scene, prev, this.viewport());
  }

  /** Screen position of a HUD card of size w×h docked at `corner`. */
  private dockAt(corner: Corner, w: number, h: number): { sx: number; sy: number } {
    const r = dockRect(corner, scaledCardSize({ w, h }, this.hudScale), this.viewport());
    return { sx: r[0], sy: r[1] };
  }

  /** Updates HUD scale / card visibility from the host width; true if visibility changed. */
  private measure(): boolean {
    const width = this.host.clientWidth;
    if (!width) return false;
    this.hudScale = Math.min(MAX_HUD_SCALE, Math.max(0.86, width / 780));
    const show = width >= MIN_CARD_HOST_WIDTH;
    if (show === this.showCards) return false;
    this.showCards = show;
    this.onCards?.(show);
    return true;
  }

  /** Plans all steps up front (so the card corner stays stable) and frames the first. */
  frame(scenes: StageScene[]): void {
    this.measure();
    this.scenes = scenes;
    this.plans = new Map();
    let prev: ScenePlan | null = null;
    for (const scene of scenes) {
      prev = this.planFor(scene, prev);
      this.plans.set(scene, prev);
    }
    this.scene = scenes[0];
    this.camera.set(this.plan(scenes[0]).cam);
  }

  private plan(scene: StageScene): ScenePlan {
    let plan = this.plans.get(scene);
    if (!plan) {
      plan = this.planFor(scene, null);
      this.plans.set(scene, plan);
    }
    return plan;
  }

  /** Re-plans after a host resize. */
  private refit(): void {
    if (!this.scene) return;
    this.camera.clearView();
    const cardsToggled = this.measure();
    const current = this.scene;
    const scenes = this.scenes.length ? this.scenes : [current];
    this.plans = new Map();
    let prev: ScenePlan | null = null;
    for (const scene of scenes) {
      prev = this.planFor(scene, prev);
      this.plans.set(scene, prev);
    }
    const plan = this.plan(current);
    if (cardsToggled) {
      this.goTo(current, { instant: true });
      return;
    }
    if (this.anim) this.anim.cam.to = plan.cam;
    else this.camera.set(plan.cam);
    for (const ent of this.ents.values()) {
      if (ent.cur.type !== 'panel' || !plan.dock) continue;
      const dock = { sx: plan.dock.x, sy: plan.dock.y, corner: plan.dock.corner };
      ent.cur = { ...ent.cur, ...dock };
      if (ent.tween && !ent.tween.remove) ent.tween.to = { ...ent.tween.to, ...dock };
      this.renderEntity(ent);
    }
  }

  // ── Camera ───────────────────────────────────────────────────────────────

  /** Current user zoom (null when showing the planned camera). */
  get view() {
    return this.camera.view;
  }

  /** Called when the user zooms in (true) or back out (false). */
  get onView() {
    return this.camera.onView;
  }
  set onView(fn: ((zoomed: boolean) => void) | null) {
    this.camera.onView = fn;
  }

  /** Animates back to the planned (unzoomed) camera. */
  fit(): void {
    this.camera.fit();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  clear(): void {
    this.finish(true);
    for (const ent of this.ents.values()) {
      ent.el.remove();
      ent.overEl.remove();
    }
    for (const link of this.links.values()) {
      link.el.remove();
      link.label.remove();
    }
    this.ents.clear();
    this.links.clear();
    this.traffic.clear(true);
    this.traffic.stop();
    this.layers.floor.innerHTML = '';
  }

  destroy(): void {
    this.destroyed = true;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = 0;
    }
    if (this.onVisibilityChange) {
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
      this.onVisibilityChange = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.clear();
  }

  /** Removes all packets, fading them out unless `immediate`. */
  clearPackets(immediate = false): void {
    this.traffic.clear(immediate);
  }

  // ── Step transitions ─────────────────────────────────────────────────────

  /** Transitions the stage to `scene` (or jumps there with `instant`). */
  goTo(scene: StageScene, { instant = false }: { instant?: boolean } = {}): void {
    this.finish(true);
    this.traffic.clear();
    this.traffic.stop();
    const now = performance.now();
    const plan = this.plan(scene);

    // Target entity states; the HUD panel is re-keyed and docked by the plan.
    const next: Record<string, EntityProps> = Object.fromEntries(
      Object.entries(scene.entities)
        .filter(([, ent]) => ent.type !== 'panel' || this.showCards)
        .map(([id, ent]) =>
          ent.type === 'panel' && plan.dock
            ? [CARD_ID, { ...withDefaults(ent), sx: plan.dock.x, sy: plan.dock.y, corner: plan.dock.corner }]
            : [id, withDefaults(ent)],
        ),
    );
    const exiting = [...this.ents.keys()].filter((id) => !next[id]);
    const moving = Object.keys(next).filter((id) => this.ents.has(id) && !sameJson(this.entity(id).cur, next[id]));
    const entering = Object.keys(next)
      .filter((id) => !this.ents.has(id))
      .sort((a, b) => entitySortKey(next[a]) - entitySortKey(next[b]));

    const moveDelay = exiting.length ? TIMING.exit * 0.55 : 0;
    const enterDelay = moving.length ? moveDelay + TIMING.move * 0.75 : exiting.length ? TIMING.exit * 0.7 : 0;
    /** When each entity finishes animating (ms after `now`); links draw after both ends settle. */
    const settledAt: Record<string, number> = {};
    let total = 0;

    for (const id of exiting) {
      const ent = this.entity(id);
      const exitTo = EXIT_TO[ent.cur.type] || EXIT_TO_DEFAULT;
      ent.tween = {
        from: { ...ent.cur },
        to: { ...ent.cur, opacity: 0, ...exitTo },
        start: now,
        delay: 0,
        dur: TIMING.exit,
        ease: EASE.inOut,
        remove: true,
      };
      total = Math.max(total, TIMING.exit);
    }

    for (const id of Object.keys(next)) {
      const target = next[id];
      if (!this.ents.has(id)) continue;
      const ent = this.entity(id);
      if (moving.includes(id)) {
        ent.tween = {
          from: { ...ent.cur },
          to: target,
          start: now,
          delay: moveDelay,
          dur: TIMING.move,
          ease: EASE.inOut,
          ...tweenSwaps(ent.cur, target),
        };
        settledAt[id] = moveDelay + TIMING.move;
        total = Math.max(total, settledAt[id]);
      } else settledAt[id] = 0;
    }

    entering.forEach((id, i) => {
      const target = next[id];
      const from = { ...target, opacity: 0, ...(ENTER_FROM[target.type] || ENTER_FROM_DEFAULT) };
      const ent = this.addEntity(id, from);
      const delay = enterDelay + i * TIMING.stagger;
      ent.tween = {
        from,
        to: target,
        start: now,
        delay,
        dur: TIMING.enter,
        ease: EASE.out,
        liftEase: EASE.back,
        countEase: EASE.inOut,
      };
      settledAt[id] = delay + TIMING.enter * 0.8;
      total = Math.max(total, delay + TIMING.enter);
    });

    // Links: fade out removed ones, restyle kept ones, draw new ones in sequence.
    const linkIds = Object.keys(scene.links || {});
    for (const [id, link] of this.links) {
      if (!scene.links?.[id]) {
        link.tween = { from: link.opacity, to: 0, key: 'opacity', start: now, delay: 0, dur: 300, remove: true };
      }
    }
    let drawn = 0;
    for (const id of linkIds) {
      // linkIds come from scene.links, so it exists.
      const spec = (scene.links as Record<string, LinkSpec>)[id];
      const existing = this.links.get(id);
      if (existing) {
        existing.spec = spec;
        this.styleLink(existing);
        continue;
      }
      const link = this.addLink(id, spec);
      const delay =
        Math.max(
          settledAt[spec.from] ?? 0,
          settledAt[String(spec.to)] ?? 0,
          moveDelay + (moving.length ? TIMING.move * 0.6 : 0),
        ) +
        60 +
        drawn * 90;
      drawn += 1;
      link.draw = 0;
      link.tween = { from: 0, to: 1, key: 'draw', start: now, delay, dur: TIMING.draw };
      total = Math.max(total, delay + TIMING.draw);
    }

    this.scene = scene;
    const camTo = plan.cam;
    const camFrom = { ...this.camera.shown() };
    this.camera.clearView();
    const camDelay = exiting.length ? TIMING.exit * 0.4 : 0;
    total = Math.max(total, camDelay + TIMING.move);
    this.anim = {
      cam: { from: camFrom, to: camTo, delay: camDelay, dur: TIMING.move },
      start: now,
      end: now + total,
      flows: scene.flows || [],
      spot: [...entering, ...moving.filter((id) => !next[id].dead || this.entity(id).cur.dead !== next[id].dead)],
    };
    if (instant) this.finish();
  }

  /** Jumps the running transition to its end state; `silent` skips the settle effects. */
  private finish(silent = false): void {
    if (!this.anim) return;
    for (const [id, ent] of [...this.ents]) {
      if (!ent.tween) continue;
      if (ent.tween.remove) this.removeEntity(id);
      else {
        ent.cur = ent.tween.to;
        ent.tween = null;
        this.renderEntity(ent);
      }
    }
    for (const [id, link] of [...this.links]) {
      if (!link.tween) continue;
      if (link.tween.remove) {
        link.el.remove();
        link.label.remove();
        this.links.delete(id);
      } else {
        link[link.tween.key] = link.tween.to;
        link.tween = null;
      }
    }
    this.camera.set(this.anim.cam.to);
    this.sortDepth();
    this.updateLinks(true);
    const anim = this.anim;
    this.anim = null;
    if (!silent) this.settle(anim);
  }

  /** Transition done: start packet traffic and spotlight what changed. */
  private settle(anim: StepAnimation): void {
    this.traffic.start(anim.flows);
    for (const id of anim.spot) this.spotlight(id);
    this.onSettle?.();
  }

  /** Re-renders everything after a light/dark theme switch. */
  retheme(): void {
    this.defs.innerHTML = themeMarkup(buildDefs());
    for (const ent of this.ents.values()) this.renderEntity(ent);
    for (const link of this.links.values()) {
      link.labelKey = null;
      link.labelBorn = 0;
    }
    this.updateLinks(true);
  }

  // ── Entities ─────────────────────────────────────────────────────────────

  /** Entity that is known to be on stage. */
  private entity(id: string): StageEntity {
    return this.ents.get(id) as StageEntity;
  }

  private addEntity(id: string, props: EntityProps): StageEntity {
    const el = svgEl('g', { 'data-id': id, class: `ent ent--${props.type}` });
    const overEl = svgEl('g', { 'data-id': id });
    (FLOOR_TYPES.has(props.type) ? this.layers.floor : this.layers.ents).appendChild(el);
    (props.type === 'panel' ? this.layers.hud : this.layers.over).appendChild(overEl);
    const ent: StageEntity = { id, cur: { ...props }, el, overEl, poly: null, tween: null };
    this.ents.set(id, ent);
    this.renderEntity(ent);
    return ent;
  }

  private removeEntity(id: string): void {
    const ent = this.entity(id);
    ent.el.remove();
    ent.overEl.remove();
    this.ents.delete(id);
  }

  private renderEntity(ent: StageEntity): void {
    if (ent.cur.type === 'panel') {
      const r = renderPanel({ ...ent.cur, x: 0, y: 0, z: 0, dx: 0, dy: 0 });
      ent.overEl.innerHTML = `<g transform="translate(${round(ent.cur.sx || 0)} ${round(ent.cur.sy || 0)}) scale(${round(this.hudScale)})">${themeMarkup(r.over)}</g>`;
      ent.poly = null;
      ent.bounds = null;
      return;
    }
    const r = renderEntityMarkup(ent.cur);
    ent.el.innerHTML = themeMarkup(r.body);
    ent.overEl.innerHTML = themeMarkup(r.over);
    ent.poly = r.poly;
    ent.bounds = r.bounds;
  }

  /** Re-orders entity bodies back-to-front (painter's algorithm) if needed. */
  private sortDepth(): void {
    const sorted = [...this.ents.values()]
      .filter((ent) => !FLOOR_TYPES.has(ent.cur.type))
      .sort((a, b) => entitySortKey(a.cur) - entitySortKey(b.cur));
    const children = [...this.layers.ents.children];
    if (sorted.some((ent, i) => children[i] !== ent.el)) for (const ent of sorted) this.layers.ents.appendChild(ent.el);
  }

  /** Brief floor highlight under an entity that just appeared or changed. */
  private spotlight(id: string): void {
    const ent = this.ents.get(id);
    if (!ent || NO_SPOTLIGHT.includes(ent.cur.type)) return;
    const [x0, x1, y0, y1] = entityFootprint(ent.cur);
    const pad = 0.6;
    const path = svgEl('path', {
      class: `spot`,
      d: roundedPolygonPath(
        [
          isoProject(x0 - pad, y0 - pad),
          isoProject(x0 - pad, y1 + pad),
          isoProject(x1 + pad, y1 + pad),
          isoProject(x1 + pad, y0 - pad),
        ],
        7,
      ),
    });
    this.layers.floor.appendChild(path);
    setTimeout(() => path.remove(), 1600);
  }

  // ── Links ────────────────────────────────────────────────────────────────

  private addLink(id: string, spec: LinkSpec): StageLink {
    const el = svgEl('path', { class: `link` });
    this.layers.links.appendChild(el);
    const label = svgEl('g', { class: `link-label` });
    this.layers.over.appendChild(label);
    const link: StageLink = { id, spec, el, label, draw: 1, opacity: 1, tween: null, len: 0 };
    this.links.set(id, link);
    this.styleLink(link);
    return link;
  }

  private styleLink(link: StageLink): void {
    link.el.setAttribute('class', `link link--${link.spec.style || 'solid'}`);
  }

  /** Re-routes every link to its endpoints' current shapes and updates labels. */
  private updateLinks(force = false): void {
    const center = (id: string) => centerOf(this.entity(id).cur);
    for (const link of this.links.values()) {
      const spec = link.spec;
      if (!this.ents.has(spec.from) || (spec.to && !this.ents.has(spec.to))) continue;
      let pts: Point[] = spec.pts.map((p) => isoProject(...resolvePoint(p, center), 0));
      pts = trimPathStart(pts, this.entity(spec.from).poly, 3);
      if (spec.to) pts = trimPathEnd(pts, this.entity(spec.to).poly, spec.heads === 'none' ? 3 : 4);
      link.pts = pts;
      link.el.setAttribute('d', smoothPath(pts, 9));
      link.len = link.el.getTotalLength();

      const style = spec.style || 'solid';
      const marker = style === 'off' ? 'url(#arrow-muted)' : 'url(#arrow)';
      const showHeads = link.draw > 0.97 && style !== 'beat' && style !== 'cut';
      link.el.setAttribute('marker-end', showHeads && spec.heads !== 'none' ? marker : '');
      link.el.setAttribute('marker-start', showHeads && spec.heads === 'both' ? marker : '');
      if (link.draw < 1 && style === 'solid') {
        // Line-draw: reveal the stroke via dash offset.
        link.el.style.strokeDasharray = `${round(link.len)} ${round(link.len)}`;
        link.el.style.strokeDashoffset = String(round(link.len * (1 - link.draw)));
        link.el.style.opacity = '1';
      } else {
        link.el.style.strokeDasharray = '';
        link.el.style.strokeDashoffset = '';
        link.el.style.opacity = String(round(link.opacity * (style === 'solid' ? 1 : clamp01(link.draw * 1.4))));
      }

      if (spec.label) {
        const text = this.labelText(link);
        const key = `${text}|${spec.labelTone || ''}`;
        if (link.labelKey !== key) {
          if (link.labelKey) link.labelBorn = performance.now();
          link.label.innerHTML = themeMarkup(buildPill(0, 0, text, { tone: spec.labelTone || 'paper', size: LABEL_FONT_SIZE }));
          link.labelKey = key;
        }
        const fadeIn = link.labelBorn ? clamp01((performance.now() - link.labelBorn) / 320) : 1;
        link.label.style.opacity = String(round(clamp01((link.draw - 0.6) / 0.4) * link.opacity * fadeIn));
      } else if (link.labelKey) {
        link.label.innerHTML = '';
        link.labelKey = null;
      }
    }

    // Position labels at the spot chosen during planning (smoothed while animating).
    const picks = (this.scene && this.plans.get(this.scene)?.picks) || {};
    for (const link of this.links.values()) {
      const spec = link.spec;
      if (!spec.label || !link.pts) continue;
      const { w, h } = labelBoxSize(this.labelText(link));
      const spot = placeLabel(link.pts, spec.labelAt ?? 0.5, w, () => 0, picks[link.id]?.side ?? 0, h);
      link.lpos =
        link.lpos && this.anim && !force
          ? [lerp(link.lpos[0], spot.cx, 0.16), lerp(link.lpos[1], spot.cy, 0.16)]
          : [spot.cx, spot.cy];
      link.label.setAttribute('transform', `translate(${round(link.lpos[0])} ${round(link.lpos[1])})`);
    }
  }

  /** Label text as planned (possibly line-broken), if the plan matches the current label. */
  private labelText(link: StageLink): string {
    const pick = this.scene && this.plans.get(this.scene)?.picks?.[link.id];
    return pick && pick.label === link.spec.label ? pick.text : (link.spec.label ?? '');
  }

  // ── Frame loop ───────────────────────────────────────────────────────────

  private tick(now: number): void {
    const dt = Math.min(0.05, (now - this.last) / 1e3);
    this.last = now;

    if (this.anim) {
      const camAnim = this.anim.cam;
      const ck = EASE.inOut(clamp01((now - this.anim.start - camAnim.delay) / camAnim.dur));
      this.camera.set({
        x: lerp(camAnim.from.x, camAnim.to.x, ck),
        y: lerp(camAnim.from.y, camAnim.to.y, ck),
        w: lerp(camAnim.from.w, camAnim.to.w, ck),
        h: lerp(camAnim.from.h, camAnim.to.h, ck),
      });

      let changed = false;
      for (const [id, ent] of [...this.ents]) {
        const tw = ent.tween;
        if (!tw) continue;
        const raw = (now - tw.start - tw.delay) / tw.dur;
        if (raw < 0 && !tw.started) continue;
        tw.started = true;
        const p = clamp01(raw);
        const eased = tw.ease(p);
        // Non-numeric props switch halfway (immediately for exits).
        const state: EntityProps = tw.remove || p >= 0.5 ? { ...tw.to } : { ...tw.from };
        if (!tw.remove && p < 0.5) state.cpu = tw.from.cpu;
        for (const key in tw.to) {
          const a = tw.from[key];
          const b = tw.to[key];
          if (typeof a !== 'number' || typeof b !== 'number' || (key === 'cpu' && (a < 0 || b < 0))) continue;
          state[key] = lerp(
            a,
            b,
            key === 'lift' && tw.liftEase
              ? tw.liftEase(p)
              : (key === 'count' || key === 'n') && tw.countEase
                ? tw.countEase(p)
                : eased,
          );
        }
        const fadeOut = 1 - clamp01(p / 0.42);
        const fadeIn = clamp01((p - 0.55) / 0.4);
        if (tw.tagSwap) state.tagFade = p < 0.5 ? fadeOut : fadeIn;
        if (tw.labelSwap) state.labelFade = p < 0.5 ? fadeOut : fadeIn;
        if (tw.card) {
          const card = tw.card;
          let w = card.w1;
          let h = card.h1;
          if (card.swap) {
            const k = EASE.inOut(clamp01((p - 0.24) / 0.48));
            w = lerp(card.w0, card.w1, k);
            h = lerp(card.h0, card.h1, k);
            state.boxW = w;
            state.boxH = h;
            state.fade = p < 0.5 ? 1 - clamp01(p / 0.24) : clamp01((p - 0.72) / 0.28);
          }
          if (card.keep) Object.assign(state, this.dockAt(card.keep, w, h));
        }
        ent.cur = state;
        this.renderEntity(ent);
        changed = true;
        if (p >= 1) {
          if (tw.remove) this.removeEntity(id);
          else {
            ent.cur = tw.to;
            ent.tween = null;
            this.renderEntity(ent);
          }
        }
      }

      for (const [id, link] of [...this.links]) {
        const tw = link.tween;
        if (!tw) continue;
        const p = clamp01((now - tw.start - tw.delay) / tw.dur);
        link[tw.key] = lerp(tw.from, tw.to, EASE.inOut(p));
        if (p >= 1) {
          if (tw.remove) {
            link.el.remove();
            link.label.remove();
            this.links.delete(id);
          } else link.tween = null;
        }
      }

      if (changed) this.sortDepth();
      this.updateLinks();
      if (now >= this.anim.end) {
        const anim = this.anim;
        this.anim = null;
        this.updateLinks(true);
        this.settle(anim);
      }
    }

    if (this.camera.blend && !this.anim) this.camera.set(this.camera.cam);
    if (!this.paused) this.traffic.step(dt);
  }
}
