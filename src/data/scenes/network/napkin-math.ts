// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeBalancer as f,
  makeCrowd as p,
  makeGhost as m,
  makeLink as h,
  DEAD_STATE as g,
  makeHot as _,
  makeCool as v,
  makeDevice as y,
  makeDb as b,
  makeZone as x,
  makeQueue as ee,
  makePanel as S,
  makeUser as te,
  makeDns as ne,
  makeWebServer as re,
  makeDatabase as ie,
  URL_TAG as ae,
  LINK_TEMPLATES as C,
  CACHED_DNS_LINK as oe,
  TIMING_PANEL as se,
} from '@/lib/simulator/scene-builders';

const ge = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const _e = { x0: -8.5, x1: 8.5, y0: -12.5, y1: -2.5 };

const ve = { x0: 12.5, x1: 20.5, y0: -13.5, y1: -2.5 };

const ye = () => p(ge, 15, `10M daily users`);

const be = (e, t, n = `sparkles`) =>
    S({ x: -8.5, y: -2.5, z: 0, dx: 150, dy: -205 }, e, t, { icon: n });

const xe = [-6.4, -3.2, 0, 3.2, 6.4];

const Se = [`s1`, `s2`, `s0`, `s3`, `s4`];

const Ce = () => {
    let e = {};
    return (
      xe.forEach((t, n) => {
        ((e[Se[n]] = d(t, -9.6, { s: 2.8, h: 34, label: [], ...v(-1) })),
          (e[`t${n}`] = d(t, -5.4, { s: 2.8, h: 34, label: [], ...v(-1) })));
      }),
      e
    );
  };

const we = (e = {}) => ({ s0: d(0, -7.5, { label: [`One`, `server?`], ...e }) });

const Te = () =>
    Object.fromEntries(
      [-10.2, -4.8].flatMap((e, t) =>
        [11.5, 15.5].map((n, r) => [`d${t}${r}`, b(n, e, { r: 1.45, h: 30 })]),
      ),
    );

const Ee = (e) => ({ u: h(`users`, `s0`, [`users`, `s0`], e) });

const De = { uw: h(`users`, `web`, [`users`, `web`]) };

const Oe = { w: h(`web`, `store`, [`web`, `store`]) };

const ke = (e = !1) => ({
    cdn: d(12, -21, { color: `green`, glyph: `globe`, label: [`CDN`] }),
    ...(e
      ? { cache: d(-14, -7.5, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `~21 GB` }) }
      : {}),
  });

const Ae = {
    sc: h(`store`, `cdn`, [`store`, [`store`, `cdn`], `cdn`], {
      style: `dashed`,
      label: `cache fill`,
      labelAt: 0.3,
    }),
    cu: h(`cdn`, `users`, [`cdn`, `users`], { label: `images · ~16 Gbit/s`, labelAt: 0.5 }),
  };

const je = { wc: h(`web`, `cache`, [`web`, `cache`], { heads: `both` }) };

const Me = be(
    `The brief`,
    [
      `PhotoShare: **10M** daily active users`,
      `each makes **~20** requests a day`,
      `they upload **1M** photos a day, 2 MB each`,
      `# Will one server cope? How much storage?`,
    ],
    `flag`,
  );

export const napkinMathLesson = {
    id: `napkin-math`,
    title: `Napkin Math`,
    summary: `Turn a product idea into servers and terabytes with math that fits on a napkin.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`dau`, `avg`, `peak`, `servers`, `storage`],
    legend: [`req`, `fail`],
    goals: [
      { text: `Daily users → requests per second`, step: 1 },
      { text: `Size for the peak, not the average`, step: 2 },
      { text: `Estimate servers and storage`, step: 4 },
      { text: `Bandwidth and memory estimates`, step: 6 },
      { text: `A few numbers worth memorising`, step: 7 },
    ],
    steps: [
      {
        short: `The question`,
        chapter: `problem`,
        title: `Will one server do?`,
        body: [
          `You’re designing PhotoShare. Before choosing any technology you need a sense of scale: is this one server, or a hundred?`,
          `You don’t need exact numbers — just the right <b>order of magnitude</b>. Napkin math gets you there in minutes.`,
        ],
        callout: {
          kind: `insight`,
          text: `Interviewers and architects both start here: rough numbers first, then design to fit them.`,
        },
        metrics: { dau: `10M`, avg: `?`, peak: `?`, servers: `?`, storage: `?` },
        scene: {
          entities: { users: ye(), ...we({ tags: [{ text: `enough?`, icon: `info` }] }), card: Me },
          links: Ee(),
          flows: [{ route: [`u`], rate: 2 }],
        },
      },
      {
        short: `Requests / s`,
        chapter: `technique`,
        title: `Daily users → requests per second`,
        body: [
          `Start from what you know: users and how often they act. 10M users × 20 requests = 200M requests a day.`,
          `A day has 86,400 seconds. Round it to <b>100,000</b> — napkin math is about being quick, not precise.`,
        ],
        callout: {
          kind: `tip`,
          text: `Handy shortcut: 1M requests per day ≈ 12 requests per second.`,
        },
        changes: [`+ Average load ≈ 2,300 req/s`],
        metrics: { dau: `10M`, avg: 2300, peak: `?`, servers: `?`, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            ...we({ cpu: 0.8 }),
            card: be(
              `Requests per second`,
              [
                `10M users × 20 = **200M** requests/day`,
                `1 day = 86,400 s  (≈ 100k)`,
                `= 200M ÷ 86,400 ≈ 2,300 req/s`,
              ],
              `activity`,
            ),
          },
          links: Ee(),
          flows: [{ route: [`u`], rate: 3.2 }],
        },
      },
      {
        short: `Peak`,
        chapter: `insight`,
        title: `Plan for the peak, not the average`,
        body: [
          `Traffic isn’t flat: people browse in the evening and around big events. A typical peak is 2–3× the daily average.`,
          `Size for 3× and the lone server is clearly overwhelmed.`,
        ],
        callout: {
          kind: `warn`,
          text: `A system sized for its average load is down at exactly the moment most people use it.`,
        },
        changes: [`+ Peak ≈ 3 × average ≈ 7,000 req/s`, `~ One server: overloaded`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: `?`, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            ...we(_(1)),
            card: be(
              `Peak traffic`,
              [`evenings run ~3× the average`, `= 2,300 × 3 ≈ 7,000 req/s`],
              `trendingUp`,
            ),
          },
          links: Ee({ fail: 0.35 }),
          flows: [{ route: [`u`], rate: 6.5 }],
        },
      },
      {
        short: `Servers`,
        chapter: `solution`,
        title: `How many servers?`,
        body: [
          `A load test shows one server handles about <b>1,000 req/s</b>. Peak is 7,000, so we need 7 — plus headroom for spikes and for a server failing.`,
          `Call it <b>10</b>. Notice we used a measured number, not a guess.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spreading traffic across these servers is the job of a load balancer — see Module 02.`,
        },
        changes: [`+ Web tier: 10 servers`, `~ Each runs ~70% busy at peak`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `?` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            card: be(
              `Servers`,
              [
                `1 server ≈ 1,000 req/s (load test)`,
                `7,000 ÷ 1,000 = 7 servers`,
                `+ ~30% headroom for spikes & failures`,
                `= 10 servers`,
              ],
              `server`,
            ),
          },
          links: De,
          flows: [{ route: [`uw`], rate: 6.5 }],
        },
      },
      {
        short: `Storage`,
        chapter: `technique`,
        title: `How much storage?`,
        body: [
          `Photos are the big one: 1M uploads × 2 MB = <b>2 TB per day</b>. Over a year that’s ~730 TB.`,
          `Data is usually stored three times so a dead disk loses nothing — so plan for about <b>2 PB</b> in year one. That rules out “one database server” immediately.`,
        ],
        callout: {
          kind: `insight`,
          text: `Storage grows every day and never resets. Requests per second come and go; bytes stay.`,
        },
        changes: [`+ Storage tier`, `+ 2 TB/day → ~730 TB/year`, `~ ×3 copies → ~2 PB`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            card: be(
              `Storage`,
              [
                `1M photos × 2 MB = **2 TB** per day`,
                `× 365 days ≈ **730 TB** per year`,
                `× 3 copies ≈ 2.2 PB`,
                `= plan for ~2 PB in year one`,
              ],
              `database`,
            ),
          },
          links: { ...De, ...Oe },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
      {
        short: `Bandwidth`,
        chapter: `technique`,
        title: `How much network?`,
        body: [
          `Uploads are the small part: 2 TB a day is about 20 MB/s coming in. Viewing is the big part: if each user looks at 100 photos a day as 200 KB thumbnails, that’s <b>200 TB a day</b> going out.`,
          `200 TB ÷ 100,000 s ≈ 2 GB/s — about 16 Gbit/s on average, more at peak. That’s a job for a CDN, not ten web servers.`,
        ],
        callout: {
          kind: `insight`,
          text: `Read-heavy media apps are usually limited by bandwidth before CPU. Estimate bytes out, not just requests.`,
        },
        changes: [`+ CDN serves the images`, `+ Egress ≈ 16 Gbit/s average`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(),
            card: be(
              `Bytes per second`,
              [
                `in:  2 TB/day ÷ 100k s ≈ 20 MB/s`,
                `out: 10M × 100 views × 200 KB`,
                `     = 200 TB/day ≈ 2 GB/s`,
                `= ~16 Gbit/s → serve from a CDN`,
              ],
              `activity`,
            ),
          },
          links: { ...De, ...Oe, ...Ae },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
            { route: [`sc`, `cu`], rate: 2.4, kind: `push` },
          ],
        },
      },
      {
        short: `Cache size`,
        chapter: `technique`,
        title: `Will it fit in memory?`,
        body: [
          `Feeds read photo metadata and user profiles constantly. Could a cache hold the hot part? Profiles: 10M × 2 KB = 20 GB. Today’s new photos: 1M × 1 KB = 1 GB.`,
          `About 21 GB — it fits in the memory of a single cache server (with a second for redundancy). No exotic architecture needed.`,
        ],
        callout: {
          kind: `tip`,
          text: `Napkin math often says “this is smaller than you think”. That’s just as valuable as finding something big.`,
        },
        changes: [`+ Cache: ~21 GB hot data`],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(),
            cache: d(-14, -7.5, { color: `green`, glyph: `zap`, label: [`Cache`], sub: `~21 GB` }),
            card: be(
              `Hot data in RAM`,
              [
                `profiles: 10M × 2 KB  = 20 GB`,
                `new photos: 1M × 1 KB = 1 GB`,
                `= ~21 GB → one 64 GB cache server`,
              ],
              `zap`,
            ),
          },
          links: {
            ...De,
            ...Oe,
            ...Ae,
            wc: h(`web`, `cache`, [`web`, `cache`], { heads: `both` }),
          },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
            { route: [`sc`, `cu`], rate: 2.4, kind: `push` },
            { route: [`wc`], rate: 2.4, bounce: !0 },
          ],
        },
      },
      {
        short: `Numbers`,
        chapter: `insight`,
        title: `Numbers worth memorising`,
        body: [
          `A handful of numbers make most estimates possible. Learn the orders of magnitude, not the decimals.`,
          `<table class="compare numbers">
          <tbody>
            <tr><td>Read from memory</td><td>100 ns</td></tr>
            <tr><td>Read from SSD</td><td>100 µs</td></tr>
            <tr><td>Round trip, same data center</td><td>0.5 ms</td></tr>
            <tr><td>Round trip, across an ocean</td><td>75–150 ms</td></tr>
            <tr><td>Seconds in a day</td><td>~100,000</td></tr>
          </tbody>
        </table>`,
        ],
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(!0),
            card: be(
              `Handy numbers`,
              [
                `1 day ≈ 100,000 s`,
                `1M req/day ≈ 12 req/s`,
                `1 KB × 1M = 1 GB`,
                `1 MB × 1M = 1 TB`,
              ],
              `bulb`,
            ),
          },
          links: { ...De, ...Oe, ...Ae, ...je },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li><b>Users × actions ÷ 100k s</b> gives average requests per second.</li>
          <li>Multiply by <b>2–3×</b> for the peak, and size for that.</li>
          <li><b>Servers</b> = peak ÷ per-server capacity, plus headroom.</li>
          <li><b>Storage</b> = items/day × size × 365 × copies.</li>
          <li>Estimate <b>bytes out</b> and <b>memory</b> too — they often decide the design.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That finishes Foundations. Next: <b>Vertical vs Horizontal Scaling</b> — what to do when the numbers say one machine won’t do.`,
        },
        metrics: { dau: `10M`, avg: 2300, peak: 7e3, servers: 10, storage: `730 TB` },
        scene: {
          entities: {
            users: ye(),
            web: x(_e, `WEB TIER · 10 SERVERS`),
            ...Ce(),
            store: x(ve, `STORAGE`),
            ...Te(),
            ...ke(!0),
            card: be(
              `The estimate`,
              [
                `average  ≈ 2,300 req/s`,
                `peak     ≈ 7,000 req/s`,
                `servers  = 10`,
                `storage  ≈ 730 TB / year (×3)`,
              ],
              `listOrdered`,
            ),
          },
          links: { ...De, ...Oe, ...Ae, ...je },
          flows: [
            { route: [`uw`], rate: 6 },
            { route: [`w`], rate: 1.6 },
          ],
        },
      },
    ],
  };

export default napkinMathLesson;
