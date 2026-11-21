/* eslint-disable @typescript-eslint/no-explicit-any */
export const makeBlock = (x: number, y: number, opts: Record<string, any> = {}) => ({
  type: `block`,
  x,
  y,
  color: `blue`,
  glyph: `server`,
  ...opts,
});

export const makeBalancer = (x: number, y: number, opts: Record<string, any> = {}) => ({
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
  pos: Record<string, any>,
  count: number,
  label: string,
  opts: Record<string, any> = {},
) => ({ type: `crowd`, ...pos, count, label, ...opts });

export const makeGhost = (x: number, y: number, s: any, h: any, label: any) => ({
  type: `ghost`,
  x,
  y,
  s,
  h,
  label,
});

export const makeLink = (
  from: any,
  to: any,
  pts: any[],
  opts: Record<string, any> = {},
) => ({ from, to, pts, heads: `end`, ...opts });

export const DEAD_STATE = {
  dead: 1,
  heat: 0,
  cpu: -1,
  tags: [{ text: `DOWN`, tone: `red`, icon: `alert` }],
};

export const makeHot = (cpu = 1) => ({ heat: 1, cpu });

export const makeCool = (cpu: number) => ({ heat: 0, dead: 0, cpu });

export const makeDevice = (x: number, y: number, opts: Record<string, any> = {}) => ({
  type: `device`,
  x,
  y,
  ...opts,
});

export const makeDb = (x: number, y: number, opts: Record<string, any> = {}) => ({
  type: `db`,
  x,
  y,
  ...opts,
});

export const makeZone = (pos: Record<string, any>, label: any, opts: Record<string, any> = {}) => ({
  type: `zone`,
  ...pos,
  label,
  ...opts,
});

export const makeQueue = (
  x: number,
  y: number,
  n: any,
  dir: number[] = [0, -1],
  opts: Record<string, any> = {},
) => ({ type: `queue`, x, y, n, dir, ...opts });

export const makePanel = (
  pos: Record<string, any>,
  title: any,
  lines: any[],
  opts: Record<string, any> = {},
) => ({ type: `panel`, ...pos, title, lines, ...opts });

export const makeUser = (tags: any) => makeDevice(0, -12, { label: `you`, tags });

export const makeDns = (opts: Record<string, any> = {}) =>
  makeBlock(0, 1, { color: `yellow`, glyph: `globe`, label: [`DNS`], sub: `resolver`, ...opts });

export const makeWebServer = (opts: Record<string, any> = {}) =>
  makeBlock(10, -1, { label: [`Web`, `Server`], ...opts });

export const makeDatabase = (opts: Record<string, any> = {}) =>
  makeDb(10, 12, { label: `database`, ...opts });

export const URL_TAG = { text: `https://shop.example`, icon: `globe` };

export const LINK_TEMPLATES = {
  dns: (opts: Record<string, any> = {}) =>
    makeLink(`dev`, `dns`, [`dev`, `dns`], {
      heads: `both`,
      label: `where is shop.example?`,
      ...opts,
    }),
  web: (opts: Record<string, any> = {}) =>
    makeLink(`dev`, `web`, [`dev`, [`web`, `dev`], `web`], { heads: `both`, ...opts }),
  db: (opts: Record<string, any> = {}) =>
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
