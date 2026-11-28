import {
  makeBlock,
  makeCool,
  makeCrowd,
  makeHot,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

const londonArea = { x0: -4.5, x1: 4.5, y0: -24, y1: -18 };

const sydneyArea = { x0: 18, x1: 24, y0: -4.5, y1: 4.5 };

const londonUsers = (e = 11, t = `London`) => makeCrowd(londonArea, e, t);

const sydneyUsers = (e = 11, t = `Sydney`) => makeCrowd(sydneyArea, e, t);

const origin = (e = {}) => makeBlock(0, 0, { label: [`Origin`], sub: `Virginia`, ...e });

const edgeNode = (e: number, t: number, n: string, r = {}) =>
    makeBlock(e, t, { color: `green`, glyph: `globe`, label: [`Edge`], sub: n, ...r });

const edgeNodes = (e = {}, t = {}) => ({ el: edgeNode(0, -12, `London`, e), es: edgeNode(12, 0, `Sydney`, t) });

const packetSpeed = 0.72;

const originLinks = {
    lo: makeLink(`lon`, `origin`, [`lon`, `origin`], { heads: `both`, label: `≈ 75 ms per round trip` }),
    so: makeLink(`syd`, `origin`, [`syd`, `origin`], {
      heads: `both`,
      label: `≈ 200 ms per round trip`,
      labelTone: `amber`,
    }),
  };

const edgeLinks = {
    le: makeLink(`lon`, `el`, [`lon`, `el`], { heads: `both`, label: `≈ 10 ms` }),
    eo: makeLink(`el`, `origin`, [`el`, `origin`], {
      heads: `both`,
      style: `dashed`,
      label: `only on a miss`,
    }),
    se: makeLink(`syd`, `es`, [`syd`, `es`], { heads: `both`, label: `≈ 12 ms` }),
    eso: makeLink(`es`, `origin`, [`es`, `origin`], {
      heads: `both`,
      style: `dashed`,
      label: `only on a miss`,
    }),
  };

const requestFlows = (e = 0.9, t = 0.9, n = 1.8) => [
    {
      routes: [
        { path: [`le`], weight: e },
        { path: [`le`, `eo`], weight: 1 - e, kind: `slow` },
      ],
      pick: `weights`,
      rate: n,
      bounce: !0,
      speed: packetSpeed,
    },
    {
      routes: [
        { path: [`se`], weight: t },
        { path: [`se`, `eso`], weight: 1 - t, kind: `slow` },
      ],
      pick: `weights`,
      rate: n,
      bounce: !0,
      speed: packetSpeed,
    },
  ];

export const cdnLesson = {
    id: `cdn`,
    title: `Content Delivery`,
    summary: `Copy what everyone downloads to servers near your users — and stop fighting the speed of light.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`lon`, `syd`, `origin`, `hitRate`],
    legend: [`req`, `res`, [`slow`, `edge miss → origin`], [`mine`, `personal page`]],
    goals: [
      { text: `Why distant users are slow`, step: 0 },
      { text: `How edge servers cache static files`, step: 2 },
      { text: `Cold caches and versioned file names`, step: 5 },
      { text: `How a CDN shields the origin`, step: 6 },
      { text: `Private pages and origin shields`, step: 7 },
    ],
    steps: [
      {
        short: `Far away`,
        chapter: `problem`,
        title: `Your users are far away`,
        body: [
          `Your servers are in Virginia. A user in London waits about 75 ms per round trip; in Sydney about 200 ms. A page needs many round trips, so Sydney waits well over a second.`,
          `Meanwhile every image for every user worldwide is served by that one origin.`,
        ],
        callout: {
          kind: `warn`,
          text: `You can’t speed up light. The only way to cut distance latency is to serve users from somewhere closer.`,
        },
        metrics: { lon: 80, syd: 210, origin: 9e3, hitRate: 0 },
        scene: {
          entities: { lon: londonUsers(), syd: sydneyUsers(), origin: origin(makeHot(0.88)) },
          links: originLinks,
          flows: [
            { route: [`lo`], rate: 1.6, bounce: !0, speed: packetSpeed },
            { route: [`so`], rate: 1.6, bounce: !0, speed: packetSpeed },
          ],
        },
      },
      {
        short: `Same bytes`,
        chapter: `insight`,
        title: `Most bytes are the same for everyone`,
        body: [
          `Look inside a page load. The HTML is personal, but images, scripts, stylesheets and videos are <b>identical</b> for every user.`,
          `Identical, rarely-changing files are perfect for caching — anywhere, including far from the origin.`,
        ],
        callout: { kind: `insight`, text: `Static assets are often 90%+ of the bytes on a page.` },
        metrics: { lon: 80, syd: 210, origin: 9e3, hitRate: 0 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: origin(makeHot(0.88)),
            card: ((e, t, n) => makePanel({ x: 0, y: 0, z: 0, dx: -340, dy: -230 }, e, t, { icon: n }))(
              `What a page is made of`,
              [
                `HTML (per user)     30 KB`,
                `images             1.6 MB`,
                `scripts + styles   400 KB`,
                `= 98% of bytes are the same for everyone`,
              ],
              `layers`,
            ),
          },
          links: originLinks,
          flows: [
            { route: [`lo`], rate: 1.6, bounce: !0, speed: packetSpeed },
            { route: [`so`], rate: 1.6, bounce: !0, speed: packetSpeed },
          ],
        },
      },
      {
        short: `Edges`,
        chapter: `solution`,
        title: `Put copies at the edge`,
        body: [
          `A <span class="term">CDN</span> (content delivery network) runs <span class="term">edge servers</span> in hundreds of cities. Point your static files at it, and each user is served by the edge nearest them.`,
          `London now gets images in ~10 ms. Only misses (amber) travel all the way to Virginia.`,
        ],
        callout: {
          kind: `tip`,
          text: `Popular CDNs: Cloudflare, Fastly, Akamai, Amazon CloudFront. You rent their edges; you don’t run them.`,
        },
        changes: [
          `+ Edge servers in London and Sydney`,
          `~ 90% of requests answered at the edge`,
          `~ Origin load 9,000 → 900 req/s`,
        ],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 90 },
        scene: {
          entities: { lon: londonUsers(), syd: sydneyUsers(), origin: origin(makeCool(0.2)), ...edgeNodes() },
          links: edgeLinks,
          flows: requestFlows(),
        },
      },
      {
        short: `Cold edge`,
        chapter: `technique`,
        title: `First requests are misses`,
        body: [
          `Edges are <span class="term">pull-through</span> caches: they start empty. The first request for a file misses, the edge fetches it from the origin, keeps a copy, and serves everyone after that.`,
          `London’s edge is warm; Sydney’s just started and is still filling up — so Sydney users briefly pay the long trip.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is the same cache-aside idea from the last lesson, spread around the planet.`,
        },
        changes: [
          `~ Sydney edge: cold, filling from origin`,
          `~ Sydney latency 15 → 95 ms (for now)`,
        ],
        metrics: { lon: 12, syd: 95, origin: 2400, hitRate: 70 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: origin(makeCool(0.32)),
            ...edgeNodes(
              { tags: [{ text: `warm`, tone: `green` }] },
              { tags: [{ text: `cold · filling`, tone: `amber`, icon: `alert` }] },
            ),
          },
          links: edgeLinks,
          flows: requestFlows(0.93, 0.45),
        },
      },
      {
        short: `Old files`,
        chapter: `problem`,
        title: `You ship a new logo. Nobody sees it.`,
        body: [
          `You replace <code>logo.png</code> on the origin. But edges cached the old one with a one-day TTL, so users keep seeing the old logo — some in London, some in Sydney, for hours.`,
          `You could purge the edges — modern CDNs do that in seconds — but someone has to remember to, every time, and no purge can reach the copies already saved in users’ browsers.`,
        ],
        callout: {
          kind: `warn`,
          text: `Long TTLs are what make a CDN fast — and what makes updates slow to appear.`,
        },
        changes: [`~ Origin: new logo.png`, `− Edges still serve the old one`],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 90 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: origin({ ...makeCool(0.2), tags: [{ text: `logo.png · new`, tone: `green` }] }),
            ...edgeNodes(
              { tags: [{ text: `logo.png · old`, tone: `red`, icon: `alert` }] },
              { tags: [{ text: `logo.png · old`, tone: `red`, icon: `alert` }] },
            ),
          },
          links: edgeLinks,
          flows: requestFlows(),
        },
      },
      {
        short: `Versioning`,
        chapter: `solution`,
        title: `Give every version a new name`,
        body: [
          `Put a fingerprint of the file’s contents in its name: <code>logo.3f9a.png</code>. A new logo gets a new name, so it can never be confused with the old one.`,
          `Now files can be cached for a <b>year</b>. The HTML (short TTL, or not cached) simply points at the latest names.`,
        ],
        callout: {
          kind: `tip`,
          text: `Build tools such as Vite and webpack add these content hashes for you.`,
        },
        changes: [`~ logo.png → logo.3f9a.png`, `~ Cache lifetime 1 day → 1 year`, `− Stale logos`],
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 96 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: origin({ ...makeCool(0.15), tags: [{ text: `logo.3f9a.png`, tone: `green` }] }),
            ...edgeNodes(
              { tags: [{ text: `logo.3f9a.png · 1 yr`, tone: `green` }] },
              { tags: [{ text: `logo.3f9a.png · 1 yr`, tone: `green` }] },
            ),
          },
          links: edgeLinks,
          flows: requestFlows(0.96, 0.96),
        },
      },
      {
        short: `Spike`,
        chapter: `insight`,
        title: `Spikes hit the edge, not you`,
        body: [
          `A launch goes viral and traffic jumps 20×. Almost all of it is answered by edges spread around the world; the origin barely notices.`,
          `The same spread-out capacity helps absorb floods of malicious traffic (DDoS attacks).`,
        ],
        callout: {
          kind: `insight`,
          text: `A CDN is a cache, a global network and a shield for your origin, all at once.`,
        },
        changes: [`~ Traffic × 20`, `~ Origin load stays ≈ 1,100 req/s`],
        metrics: { lon: 14, syd: 18, origin: 1100, hitRate: 97 },
        scene: {
          entities: {
            lon: londonUsers(15, `London · ×20`),
            syd: sydneyUsers(15, `Sydney · ×20`),
            origin: origin(makeCool(0.2)),
            ...edgeNodes({ cpu: 0.6 }, { cpu: 0.6 }),
          },
          links: edgeLinks,
          flows: requestFlows(0.97, 0.97, 4.6),
        },
      },
      {
        short: `Private`,
        chapter: `problem`,
        title: `Case: never cache someone’s cart`,
        body: [
          `A config change tells the CDN to cache <em>every</em> page for 5 minutes. Bob opens his cart; the edge stores it. Alice opens hers a second later — and the edge serves her <b>Bob’s cart</b>.`,
          `Pages that depend on who is asking must be marked <code>Cache-Control: private</code> (or <code>no-store</code>) so edges always pass them through to the origin.`,
        ],
        callout: {
          kind: `warn`,
          text: `Caching personal data publicly is a classic, very public incident. Default to private; cache public content on purpose.`,
        },
        changes: [
          `+ Cart and account pages: Cache-Control: private`,
          `~ Personal pages always go to the origin`,
        ],
        metrics: { lon: 12, syd: 15, origin: 1400, hitRate: 88 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: origin(makeCool(0.22)),
            ...edgeNodes(
              { tags: [{ text: `/cart → private · pass`, tone: `amber`, icon: `lock` }] },
              { tags: [{ text: `/cart → private · pass`, tone: `amber`, icon: `lock` }] },
            ),
          },
          links: edgeLinks,
          flows: [
            ...requestFlows(0.88, 0.88),
            { route: [`le`, `eo`], kind: `mine`, rate: 0.5, bounce: !0, speed: packetSpeed },
          ],
        },
      },
      {
        short: `Shield`,
        chapter: `technique`,
        title: `Origin shield: one more layer`,
        body: [
          `A real CDN has hundreds of edges. When a new file goes viral, every edge misses once — hundreds of requests for the same file hit your origin at the same moment.`,
          `An <span class="term">origin shield</span> is a mid-tier cache in front of the origin. Edges miss to the shield; only the shield ever asks the origin, so each file is fetched once.`,
        ],
        callout: {
          kind: `tip`,
          text: `Most CDNs offer shielding as a setting. Pick a shield location close to your origin.`,
        },
        changes: [`+ Origin shield between edges and origin`, `~ Origin sees one fetch per file`],
        metrics: { lon: 12, syd: 15, origin: 120, hitRate: 98 },
        scene: {
          entities: {
            lon: londonUsers(),
            syd: sydneyUsers(),
            origin: makeBlock(-9, 9, { label: [`Origin`], sub: `Virginia`, ...makeCool(0.05) }),
            sh: makeBlock(0, 0, {
              color: `green`,
              glyph: `shield`,
              label: [`Shield`],
              sub: `mid-tier cache`,
            }),
            ...edgeNodes(),
          },
          links: {
            le: edgeLinks.le,
            se: edgeLinks.se,
            esh: makeLink(`el`, `sh`, [`el`, `sh`], {
              heads: `both`,
              style: `dashed`,
              label: `edge miss`,
            }),
            ssh: makeLink(`es`, `sh`, [`es`, `sh`], { heads: `both`, style: `dashed` }),
            sho: makeLink(`sh`, `origin`, [`sh`, [`sh`, `origin`], `origin`], {
              heads: `both`,
              label: `once per file`,
            }),
          },
          flows: [
            {
              routes: [
                { path: [`le`], weight: 0.92 },
                { path: [`le`, `esh`], weight: 0.08, kind: `slow` },
              ],
              pick: `weights`,
              rate: 1.8,
              bounce: !0,
              speed: packetSpeed,
            },
            {
              routes: [
                { path: [`se`], weight: 0.92 },
                { path: [`se`, `ssh`], weight: 0.08, kind: `slow` },
              ],
              pick: `weights`,
              rate: 1.8,
              bounce: !0,
              speed: packetSpeed,
            },
            { route: [`sho`], kind: `slow`, rate: 0.15, bounce: !0 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Distance adds latency; <b>edge servers</b> move content close to users.</li>
          <li>CDNs are <b>pull-through caches</b>: misses fill them from your origin.</li>
          <li><b>Versioned file names</b> let you cache for a year and still update instantly.</li>
          <li>The edge absorbs <b>spikes</b> and shields the origin.</li>
          <li>Never cache <b>personal pages</b> publicly; add an <b>origin shield</b> at scale.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That wraps up Scaling. Next module: <b>Data & Storage</b>, starting with SQL vs NoSQL.`,
        },
        metrics: { lon: 12, syd: 15, origin: 900, hitRate: 96 },
        scene: {
          entities: { lon: londonUsers(), syd: sydneyUsers(), origin: origin(makeCool(0.15)), ...edgeNodes() },
          links: edgeLinks,
          flows: requestFlows(0.96, 0.96),
        },
      },
    ],
  };

export default cdnLesson;
