/**
 * Factory helpers used by scene definitions (src/data/scenes) to build
 * entities, links and common presets.
 */
import type { EntityProps, LinkSpec, PointRef } from './stage/types';
import type { Lesson } from './types';

/** Extra entity props merged over a factory's defaults. */
type Opts = Partial<EntityProps>;

/** Open bag of entity/link props that a scene helper merges over its defaults. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- same open shape as EntityProps
export type Bag = Record<string, any>;

/** Loose option bag a scene helper spreads into a builder call (values are not inspected). */
export type SceneOpts = Record<string, unknown>;

/** Small state pill shown on a block (`tone`: green / red / amber / violet / gray). */
export interface Tag {
  text: string;
  tone?: string;
  icon?: string;
}

/** Screen position in px → world grid coordinates, for placing blocks by where they appear. */
export const fromScreen = (sx: number, sy: number, digits = 1) => {
  const k = 10 ** digits;
  return {
    x: Math.round(((sx / 14 + sy / 7) / 2) * k) / k,
    y: Math.round(((sx / 14 - sy / 7) / 2) * k) / k,
  };
};
/** Floor rect for crowds, zones and panels anchors. */
type Area = Record<string, number>;

/**
 * AGENTS.md §4C minimum sizes: a glyph plus two text lines needs s ≥ 4 / h ≥ 46, and a two-line
 * label plus a subtitle needs s ≥ 4.8 / h ≥ 54, or the text spills over the block's faces.
 * Raises only what is below the minimum; blocks that already comply are untouched.
 */
const fitText = (o: Opts): Opts => {
  const lines = Array.isArray(o.label) ? o.label.length : o.label ? 1 : 0;
  const rows = lines + (o.sub ? 1 : 0);
  let s = typeof o.s === `number` ? o.s : undefined;
  let h = typeof o.h === `number` ? o.h : undefined;
  if (rows >= 2 && ((s ?? 4) < 4 || (h ?? 46) < 46)) {
    s = Math.max(s ?? 4, 4);
    h = Math.max(h ?? 46, 46);
  }
  if (lines >= 2 && o.sub && ((s ?? 4) < 4.8 || (h ?? 46) < 54)) {
    s = Math.max(s ?? 4, 4.8);
    h = Math.max(h ?? 46, 54);
  }
  return { ...o, ...(s === undefined ? {} : { s }), ...(h === undefined ? {} : { h }) };
};

export const makeBlock = (x: number, y: number, opts: Opts = {}) => ({
  type: `block`,
  x,
  y,
  color: `blue`,
  glyph: `server`,
  ...fitText(opts),
});

export const makeBalancer = (x: number, y: number, opts: Opts = {}) => ({
  type: `block`,
  x,
  y,
  color: `orange`,
  glyph: `balancer`,
  label: [`Load`, `Balancer`],
  pills: `below`,
  ...opts,
});

export const makeCrowd = (
  pos: Area,
  count: number,
  label: string,
  opts: Opts = {},
) => ({ type: `crowd`, ...pos, count, label, ...opts });

export const makeGhost = (x: number, y: number, s: number, h: number, label: string) => ({
  type: `ghost`,
  x,
  y,
  s,
  h,
  label,
});

export const makeLink = (from: string, to: string | null, pts: PointRef[], opts: Partial<LinkSpec> = {}): LinkSpec => ({
  from,
  to,
  pts,
  heads: `end`,
  ...opts,
});

export const DEAD_STATE = {
  dead: 1,
  heat: 0,
  cpu: -1,
  tags: [{ text: `DOWN`, tone: `red`, icon: `alert` }],
};

export const makeHot = (cpu = 1) => ({ heat: 1, cpu });

export const makeCool = (cpu: number) => ({ heat: 0, dead: 0, cpu });

export const makeDevice = (x: number, y: number, opts: Opts = {}) => ({
  type: `device`,
  x,
  y,
  ...opts,
});

export const makeDb = (x: number, y: number, opts: Opts = {}) => ({
  type: `db`,
  x,
  y,
  ...opts,
});

export const makeZone = (pos: Area, label?: string, opts: Opts = {}) => ({
  type: `zone`,
  ...pos,
  ...(label === undefined ? {} : { label }),
  ...opts,
});

export const makeQueue = (
  x: number,
  y: number,
  n: number,
  dir: number[] = [0, -1],
  opts: Opts = {},
) => ({ type: `queue`, x, y, n, dir, ...opts });

export const makePanel = (
  pos: Area,
  title: string,
  lines: string[],
  opts: Opts = {},
) => ({ type: `panel`, ...pos, title, lines, ...opts });

export const makeUser = (tags: unknown[]) => makeDevice(0, -12, { label: `you`, tags });

export const makeDns = (opts: Opts = {}) =>
  makeBlock(0, 1, { color: `yellow`, glyph: `globe`, label: [`DNS`], sub: `resolver`, ...opts });

export const makeWebServer = (opts: Opts = {}) =>
  makeBlock(10, -1, { label: [`Web`, `Server`], ...opts });

export const makeDatabase = (opts: Opts = {}) =>
  makeDb(10, 12, { label: `database`, ...opts });

export const URL_TAG = { text: `https://shop.example`, icon: `globe` };

export const LINK_TEMPLATES = {
  dns: (opts: Partial<LinkSpec> = {}) =>
    makeLink(`dev`, `dns`, [`dev`, `dns`], {
      heads: `both`,
      label: `where is shop.example?`,
      ...opts,
    }),
  web: (opts: Partial<LinkSpec> = {}) =>
    makeLink(`dev`, `web`, [`dev`, [`web`, `dev`], `web`], { heads: `both`, ...opts }),
  db: (opts: Partial<LinkSpec> = {}) =>
    makeLink(`web`, `db`, [`web`, `db`], {
      heads: `both`,
      label: `SELECT … FROM products`,
      ...opts,
    }),
};

export const CACHED_DNS_LINK = LINK_TEMPLATES.dns({ style: `off`, label: `cached · 5 min` });

export const TIMING_PANEL = makePanel(
  { x: 0, y: -12, z: 0, dx: -175, dy: -290 },
  `Where the time went`,
  [
    `DNS lookup           20 ms`,
    `TCP + TLS handshake  60 ms`,
    `request + server     55 ms`,
    `download             20 ms`,
    `= total             155 ms`,
    `# 130 ms of it is waiting on the network`,
  ],
  { icon: `timer` },
);

/**
 * The "one fixed stage" layout shared by explainer lessons: an actor on the left, the thing
 * under discussion in the middle, its backing store on the right, a collaborator above and a
 * side element top-right. Chosen by an annealing search on the engine's own planScene()
 * (AGENTS.md §8) under the rules the auditor enforces: every node inside x∈[-16,16],
 * y∈[-24,20]; every pair of nodes ≥ 185 px apart; every pair joined by a labelled link to a
 * tagged block (caller–main, main–store, helper–main, caller2–main, alt–helper, caller–helper)
 * ≥ 211 px, none over 360 px; camera zoom maximised (mean ≈1.12 on the 834×547 canvas of a
 * 1440×900 window, up from ≈1.06).
 */
export const STAGE = {
  caller: fromScreen(-184, 79),
  main: fromScreen(27, 73),
  store: fromScreen(244, 82),
  helper: fromScreen(-79, -114),
  alt: fromScreen(152, -79),
  /** A second actor next to the caller (concurrency lessons). */
  caller2: fromScreen(-270, -85),
} as const;

/**
 * Three-Tier Web Architecture Archetype (Users -> Load Balancer -> App Servers -> DB).
 * Shared by the scaling lessons that draw this stack (stateless, load-balancing).
 */
export const STAGE_THREE_TIER = {
  usersArea: { x0: -4.5, x1: 4.5, y0: -24, y1: -18 },
  lb: { x: 0, y: -9 },
  db: { x: 0, y: 10 },
} as const;

/**
 * Event-Driven Messaging Archetype (Producer -> three Brokers -> Consumers down-left of each broker).
 * Shared by the Kafka lessons.
 */
export const STAGE_MESSAGING = {
  producer: fromScreen(0, -215),
  brokers: {
    b0: fromScreen(-190, -30),
    b1: fromScreen(0, -30),
    b2: fromScreen(190, -30),
  },
  consumers: {
    c0: fromScreen(-280, 135),
    c1: fromScreen(-90, 135),
    c2: fromScreen(100, 135),
  },
} as const;

/**
 * A standard-size block at a stage position: s 4.4 / h 52, or s 4.8 / h 54 when it carries
 * a two-line label plus a subtitle (AGENTS.md §4C sizing table).
 */
export const stageBlock = (p: { x: number; y: number }, o: Opts = {}) => {
  const lines = Array.isArray(o.label) ? o.label.length : o.label ? 1 : 0;
  const roomy = lines >= 2 && !!o.sub;
  return makeBlock(p.x, p.y, { s: roomy ? 4.8 : 4.4, h: roomy ? 54 : 52, ...o });
};

/** Link between two entity ids; two-way by default, optional label. */
export const linkOf = (from: string, to: string, label?: string, both = true): LinkSpec =>
  makeLink(from, to, [from, to], { ...(both ? { heads: `both` } : {}), ...(label ? { label } : {}) });

/** Code/CLI card parked bottom-left under the caller, where the stage has nothing else. */
export const codeCard = (title: string, lines: string[]) =>
  makePanel({ x: STAGE.main.x, y: STAGE.main.y, z: 0, dx: -250, dy: 150 }, title, lines, { icon: `code` });

/**
 * Gives every concept its own id. A block that keeps its id but changes its label between steps
 * is silently a different thing (the engine only swaps the text), so this renames it (`hub`,
 * `hub~2`, …): the old block leaves the stage and the new one enters. Links are re-keyed by their
 * endpoints so a link never snaps from one target to another (AGENTS.md §8, semantic link ids).
 * Use it on lessons whose steps are separate "screens" rather than one growing system.
 */
export const distinctConcepts = (lesson: Lesson): Lesson => {
  const used: Record<string, number> = {};
  let prev: Record<string, { sig: string; id: string }> = {};
  const steps = lesson.steps.map((step) => {
    const seen: Record<string, { sig: string; id: string }> = {};
    const ids: Record<string, string> = {};
    const entities: Record<string, EntityProps> = {};
    for (const [key, ent] of Object.entries(step.scene.entities)) {
      if (ent.type !== `block` && ent.type !== `db` && ent.type !== `device`) {
        entities[key] = ent;
        ids[key] = key;
        continue;
      }
      const label = Array.isArray(ent.label) ? ent.label.join(` `) : String(ent.label ?? ``);
      const sig = `${ent.type}|${label}`;
      const before = prev[key];
      let id = before?.id ?? key;
      if (!before || before.sig !== sig) {
        const n = used[key] ?? 0;
        used[key] = n + 1;
        id = n === 0 ? key : `${key}_${n + 1}`;
      }
      seen[key] = { sig, id };
      ids[key] = id;
      entities[id] = ent;
    }
    prev = seen;
    const ref = (p: string) => ids[p] ?? p;
    const linkIds: Record<string, string> = {};
    const links: Record<string, LinkSpec> = {};
    for (const [key, spec] of Object.entries(step.scene.links ?? {})) {
      const from = ref(spec.from);
      const to = spec.to == null ? undefined : ref(spec.to);
      const id = `${key}__${from}__${to ?? ``}`;
      linkIds[key] = id;
      links[id] = {
        ...spec,
        from,
        ...(to === undefined ? {} : { to }),
        // A waypoint is an entity id, or an [x, y] pair where either half may be an entity id.
        pts: spec.pts.map(
          (p): PointRef =>
            typeof p === `string` ? ref(p) : [typeof p[0] === `string` ? ref(p[0]) : p[0], typeof p[1] === `string` ? ref(p[1]) : p[1]],
        ),
      };
    }
    const lid = (k: string) => linkIds[k] ?? k;
    const flows = (step.scene.flows ?? []).map((f) => ({
      ...f,
      ...(f.route ? { route: f.route.map((r) => (Array.isArray(r) ? r.map(lid) : lid(r))) } : {}),
      ...(f.routes ? { routes: f.routes.map((r) => ({ ...r, path: r.path.map(lid) })) } : {}),
    }));
    return { ...step, scene: { entities, links, flows } };
  });
  return { ...lesson, steps };
};

/**
 * Factory for a lesson's code/CLI card: a floating panel anchored at a world position and offset in
 * screen px. `defaultIcon` is used when a call does not pass an icon.
 */
export const cardAt =
  (at: { x: number; y: number; dx?: number; dy?: number }, defaultIcon = `code`) =>
  (title: string, lines: string[], icon: string = defaultIcon, extra: Bag = {}) =>
    makePanel(
      { x: at.x, y: at.y, z: 0, ...(at.dx === undefined ? {} : { dx: at.dx }), ...(at.dy === undefined ? {} : { dy: at.dy }) },
      title,
      lines,
      { icon, ...extra },
    );
