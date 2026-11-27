/**
 * Factory helpers used by scene definitions (src/data/scenes) to build
 * entities, links and common presets.
 */
import type { EntityProps, LinkSpec, PointRef } from './stage/types';

/** Extra entity props merged over a factory's defaults. */
type Opts = Partial<EntityProps>;
/** Floor rect for crowds, zones and panels anchors. */
type Area = Record<string, number>;

export const makeBlock = (x: number, y: number, opts: Opts = {}) => ({
  type: `block`,
  x,
  y,
  color: `blue`,
  glyph: `server`,
  ...opts,
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

export const makeLink = (from: string, to: string, pts: PointRef[], opts: Partial<LinkSpec> = {}): LinkSpec => ({
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

export const makeZone = (pos: Area, label: string, opts: Opts = {}) => ({
  type: `zone`,
  ...pos,
  label,
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
