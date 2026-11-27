// @ts-nocheck
import {
  makeBlock,
  makeCrowd,
  makeDb,
  makeDevice,
  makeHot,
  makeLink,
  makePanel
} from '@/lib/simulator/scene-builders';

const ud = { x0: -4.5, x1: 4.5, y0: -19, y1: -13 };

const dd = (e = `people opening their feed`) => makeCrowd(ud, 12, e);

const fd = (e = [], t = {}) => makeBlock(0, -4, { s: 4.8, h: 52, label: [`Feed`, `API`], tags: e, ...t });

const pd = (e = `Ana posts`) => makeDevice(-16, -12, { form: `phone`, label: e });

const md = (e = [], t = {}) =>
    makeBlock(-12, -4, {
      s: 4.8,
      h: 52,
      color: `green`,
      glyph: `zap`,
      label: [`Feed`, `Cache`],
      sub: `per-user lists`,
      tags: e,
      ...t,
    });

const hd = (e = [], t = {}) =>
    makeBlock(0, 9, { s: 3.4, h: 34, color: `orange`, glyph: `inbox`, label: [`Queue`], tags: e, ...t });

const gd = (e = [], t = {}) =>
    makeBlock(-12, 9, {
      s: 4.4,
      h: 46,
      color: `purple`,
      glyph: `workflow`,
      label: [`Fan-out`, `Workers`],
      tags: e,
      ...t,
    });

const _d = () => makeDb(-12, 19, { r: 1.6, glyph: `network`, color: `store`, label: `who follows whom` });

const vd = [-10, -4, 2];

const yd = (e = {}) =>
    Object.fromEntries(
      vd.map((t, n) => [
        `k${n}`,
        makeDb(12, t, { r: 1.6, glyph: `database`, label: n === 1 ? `posts, by author` : ``, ...e }),
      ]),
    );

const bd = {
    us: makeLink(`readers`, `api`, [`readers`, `api`], { heads: `both` }),
    au: makeLink(`author`, `api`, [`author`, [-1.4, `author`], [-1.4, `api`]]),
    fc: (e = {}) => makeLink(`api`, `feeds`, [`api`, `feeds`], { heads: `both`, ...e }),
    q: makeLink(`api`, `jobs`, [`api`, `jobs`]),
    qw: makeLink(`jobs`, `workers`, [`jobs`, `workers`]),
    wf: (e = {}) => makeLink(`workers`, `feeds`, [`workers`, `feeds`], e),
    wg: makeLink(`workers`, `graph`, [`workers`, `graph`], { heads: `both` }),
  };

const xd = (e = {}) =>
    Object.fromEntries(
      vd.map((t, n) => [
        `k${n}l`,
        makeLink(`api`, `k${n}`, n === 1 ? [`api`, `k1`] : [`api`, [7, `api`], [7, t], `k${n}`], {
          heads: `both`,
          ...(n === 1 ? e : {}),
        }),
      ]),
    );

const Sd = {
    fanout: !0,
    routes: [{ path: [`k0l`] }, { path: [`k1l`] }, { path: [`k2l`] }],
    kind: `slow`,
    bounce: !0,
  };

const Cd = (e = 3.4) => ({ route: [`us`, `fc`], rate: e, bounce: !0 });

const wd = (e = 1.6) => ({
    routes: [{ path: [`k0l`] }, { path: [`k1l`] }, { path: [`k2l`] }],
    rate: e,
    bounce: !0,
  });

const Td = (e = 0.6) => [
    { route: [`au`], kind: `write`, rate: e },
    { route: [`k1l`], kind: `write`, rate: e },
    { route: [`q`, `qw`], kind: `msg`, rate: e },
    { route: [`wg`], rate: e * 0.8, bounce: !0 },
  ];

const Ed = (e = 3) => ({ route: [`wf`], kind: `write`, rate: e });

const Dd = (e = {}) => ({
    readers: dd(),
    author: pd(),
    api: fd(),
    feeds: md(),
    jobs: hd(),
    workers: gd(),
    graph: _d(),
    ...yd(),
    ...e,
  });

const Od = (e = {}) => ({
    us: bd.us,
    au: bd.au,
    fc: bd.fc(),
    q: bd.q,
    qw: bd.qw,
    wf: bd.wf(),
    wg: bd.wg,
    ...xd(),
    ...e,
  });

const kd = () => [Cd(), wd(), ...Td(), Ed()];

const Ad = { x: 0, y: -4, dx: 70, dy: -215 };

const jd = { x: 12, y: -4, dx: -185, dy: 84 };

const Md = (e, t, n, r = jd) => makePanel({ z: 0, ...r }, e, t, { icon: n });

const Nd = { feedMs: 60, readWork: `1 list + a few`, fanout: `≈ 70 · active only`, postDelay: `≈ 2 s` };

const Pd = {
    id: `design-news-feed`,
    title: `Design a News Feed`,
    summary: `Posts from everyone you follow, in 200 ms — and the question of when to do the work.`,
    minutes: 14,
    level: `intermediate`,
    metrics: [`feedMs`, `readWork`, `fanout`, `postDelay`],
    legend: [
      `req`,
      `res`,
      [`slow`, `pull query`],
      [`write`, `post / feed write`],
      [`msg`, `fan-out job`],
      `fail`,
    ],
    goals: [
      { text: `Size the read and write load of a feed`, step: 1 },
      { text: `Fan-out on read vs fan-out on write`, step: 4 },
      { text: 'Why celebrities break pure push', step: 7 },
      { text: `What to store, and for whom`, step: 8 },
      { text: `Cursors, and rebuilding derived data`, step: 10 },
    ],
    steps: [
      {
        short: `The brief`,
        chapter: `setup`,
        title: `The brief: a home feed`,
        body: [
          `Second design. A social app: people follow each other, and the home screen shows recent posts from everyone you follow, newest first.`,
          `What matters: opening the feed must feel instant — under 200 ms. A new post should reach followers within a few seconds, but not necessarily at the same instant for everyone. <b>Eventual consistency is fine</b>: nobody is harmed if a post shows up five seconds late.`,
        ],
        callout: {
          kind: `insight`,
          text: `Notice the freedom in that last requirement. Deciding what does <em>not</em> have to be immediate or exact is what makes large systems possible.`,
        },
        metrics: { feedMs: null, readWork: `—`, fanout: `—`, postDelay: `—` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([], { sub: `to be designed` }),
            card: Md(
              `Requirements`,
              [
                `post        text and a photo`,
                `home feed   posts from people I follow`,
                `= feed opens in under 200 ms`,
                `# a new post may take a few seconds`,
              ],
              `clipboard`,
              Ad,
            ),
          },
          links: { us: bd.us },
          flows: [{ route: [`us`], rate: 2.4, bounce: !0 }],
        },
      },
      {
        short: `Numbers`,
        chapter: `setup`,
        title: `Put numbers on it`,
        body: [
          `<b>200 million</b> people use it daily and open the feed about ten times each: 2 billion feed loads a day, or 23,000 a second on average. They write 50 million posts a day — about 600 a second.`,
          `So feeds are read roughly <b>40 times</b> more often than posts are written. And a typical user follows 200 accounts. Remember that number.`,
        ],
        callout: {
          kind: `tip`,
          text: `Two numbers will drive everything that follows: reads outnumber writes 40 to 1, and every feed draws on 200 sources.`,
        },
        changes: [`+ 23,000 feed loads/s · 600 posts/s`, `+ Typical user follows 200 accounts`],
        metrics: { feedMs: null, readWork: `—`, fanout: `—`, postDelay: `—` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([], { sub: `to be designed` }),
            card: Md(
              `Napkin math`,
              [
                `200 M users × 10 opens   ≈ 23,000 feeds/s`,
                `50 M posts a day         ≈ 600 posts/s`,
                `= about 40 feed reads per post written`,
                `# a typical user follows 200 accounts`,
              ],
              `sigma`,
              Ad,
            ),
          },
          links: { us: bd.us },
          flows: [{ route: [`us`], rate: 4, bounce: !0 }],
        },
      },
      {
        short: `Pull`,
        chapter: `solution`,
        title: `First draft: build the feed when it’s asked for`,
        body: [
          `Store posts in a table indexed by <code>(author_id, created_at)</code>, sharded by author. To build Alice’s feed: find the 200 accounts she follows, fetch the latest posts of each, merge them by time, return the top 20.`,
          `This is the <span class="term">pull</span> model, or fan-out on read. Posting is as cheap as it gets — one insert — and a new post is visible to everyone at once.`,
        ],
        callout: {
          kind: `insight`,
          text: `Nothing is precomputed, so nothing can go stale and nothing needs repairing. For a small app, this is the right design.`,
        },
        changes: [
          `+ Posts store, sharded by author`,
          `+ Feed = query 200 authors, merge, keep the top 20`,
        ],
        metrics: { feedMs: 600, readWork: 200, fanout: 0, postDelay: `instantly` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([{ text: `merge 200 timelines`, icon: `merge` }]),
            ...yd(),
          },
          links: { us: bd.us, ...xd() },
          flows: [
            { route: [`us`], rate: 2.4, bounce: !0 },
            { ...Sd, rate: 1.6 },
          ],
        },
      },
      {
        short: `Wrong side`,
        chapter: `problem`,
        title: `The work lands on the wrong side`,
        body: [
          `Every feed load fans out to 200 authors spread over many shards, and has to wait for the slowest answer — the fan-out tail from <em>Latency & Throughput</em>.`,
          `Worse is the total: 23,000 feed loads a second × 200 lookups = <b>4.6 million</b> lookups a second, mostly recomputing a result identical to what the same person saw a minute ago. The expensive work sits on the path that runs 40 times more often.`,
        ],
        callout: {
          kind: `warn`,
          text: `When reads far outnumber writes, move the work to write time.`,
        },
        changes: [
          `~ 23,000 feeds/s × 200 lookups = 4.6 M lookups/s`,
          `− Post shards overloaded`,
          `~ Feed load 600 ms → 1.4 s`,
        ],
        metrics: { feedMs: 1400, readWork: 200, fanout: 0, postDelay: `instantly` },
        scene: {
          entities: {
            readers: dd(),
            api: fd([{ text: `merge 200 timelines`, icon: `merge` }]),
            ...yd({ ...makeHot(0.97), heat: 0.8 }),
            card: Md(
              `Cost of pull`,
              [
                `23,000 feed loads / s`,
                `× 200 authors each`,
                `! = 4.6 million lookups / s`,
                `# and each load waits for the slowest shard`,
              ],
              `alert`,
              Ad,
            ),
          },
          links: { us: bd.us, ...xd({ fail: 0.2 }) },
          flows: [
            { route: [`us`], rate: 3, bounce: !0 },
            { ...Sd, rate: 3.2 },
          ],
        },
      },
      {
        short: `Push`,
        chapter: `solution`,
        title: `Flip it: deliver posts when they’re written`,
        body: [
          `Give every user a ready-made feed: a list in a cache, newest first. When Ana posts, a <b>fan-out worker</b> looks up her followers and adds the post to each of their lists. This is the <span class="term">push</span> model, or fan-out on write.`,
          `Opening the feed is now one read of one list. The fan-out runs behind a queue (<em>Message Queues</em>), so Ana’s post returns immediately and her followers see it a second or two later.`,
        ],
        callout: {
          kind: `tip`,
          text: `The arithmetic works: 600 posts/s × 200 followers ≈ 120,000 small cache writes a second — far cheaper than 4.6 million lookups.`,
        },
        changes: [
          `+ Feed cache: one list per user`,
          `+ Queue and fan-out workers`,
          `+ Follower lookup`,
          `~ Feed load: 200 lookups → 1`,
        ],
        metrics: { feedMs: 40, readWork: 1, fanout: `200 on average`, postDelay: `≈ 2 s` },
        scene: { entities: Dd(), links: Od(), flows: kd() },
      },
      {
        short: `Ids only`,
        chapter: `technique`,
        title: `Store ids, not posts`,
        body: [
          `Each feed list holds only <b>post ids</b> — a few bytes apiece — and only the newest 800 or so. When a feed is read, the API fetches the posts themselves in one batch from the post store (“hydration”).`,
          `Keeping a single copy of every post means an edit or a delete happens in one place. A deleted post is simply dropped during hydration; nobody has to chase it through millions of lists.`,
        ],
        callout: {
          kind: `tip`,
          text: `200 million lists × 800 ids × 8 bytes ≈ 1.3 TB of memory: a big cache cluster, but an ordinary one. Storing whole posts would cost a hundred times as much.`,
        },
        changes: [
          `~ Feed lists hold post ids only, capped at 800`,
          `+ Posts fetched in one batch at read time`,
          `~ Edits and deletes happen in one place`,
        ],
        metrics: {
          feedMs: 40,
          readWork: `1 list + 1 batch`,
          fanout: `200 on average`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            feeds: md([{ text: `alice → [9041, 9038, 9017 …]`, icon: `listOrdered` }]),
          }),
          links: Od({ ...xd({ label: `hydrate: 20 posts, 1 batch`, labelAt: 0.6 }) }),
          flows: kd(),
        },
      },
      {
        short: `Celebrity`,
        chapter: `problem`,
        title: `Case: fifty million followers`,
        body: [
          `A pop star with <b>50 million</b> followers posts. That single post becomes 50 million cache writes. Even at 100,000 writes a second, delivery takes more than eight minutes — and the queue is so backed up that everyone else’s posts wait behind it.`,
          `It’s the hot-key problem from <em>Sharding</em>: one unusually heavy key overwhelms a design tuned for the average.`,
        ],
        callout: {
          kind: `warn`,
          text: `Averages hide this. The typical account has 200 followers; a few thousand accounts have millions — and they post at the busiest moments.`,
        },
        changes: [
          `+ A celebrity posts to 50 M followers`,
          `− 50 M feed writes for one post`,
          `− Queue backlog delays everybody`,
        ],
        metrics: {
          feedMs: 40,
          readWork: `1 list + 1 batch`,
          fanout: `50,000,000`,
          postDelay: `8+ min`,
        },
        scene: {
          entities: Dd({
            author: pd(`pop star · 50 M followers`),
            jobs: hd([{ text: `backlog: 50 M deliveries`, tone: `red`, icon: `alert` }], {
              heat: 0.8,
            }),
            workers: gd([], { ...makeHot(1), heat: 0.9 }),
          }),
          links: Od(),
          flows: [Cd(), wd(), ...Td(0.5), Ed(7)],
        },
      },
      {
        short: `Hybrid`,
        chapter: `solution`,
        title: `Hybrid: push for most, pull for the famous`,
        body: [
          `Treat the two kinds of account differently. Ordinary users keep fan-out on write. Accounts above a threshold — say 100,000 followers — are <b>not</b> fanned out at all.`,
          `When Alice opens her feed, the API reads her ready-made list <em>and</em> pulls the latest posts of the handful of celebrities she follows — each one a single cached timeline — then merges the two. A few extra lookups per read, instead of 50 million writes per post.`,
        ],
        callout: {
          kind: `insight`,
          text: `Neither pure strategy survives real data. Large designs usually end up as a hybrid, split along exactly the dimension that is skewed.`,
        },
        changes: [
          `~ Accounts over 100 k followers: no fan-out`,
          `+ Their posts are merged in at read time`,
          `~ Post delay back to ≈ 2 s`,
        ],
        metrics: {
          feedMs: 60,
          readWork: `1 list + a few`,
          fanout: `200 · celebrities 0`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            author: pd(`pop star · 50 M followers`),
            api: fd([{ text: `merge: my list + 3 celebrities`, tone: `green`, icon: `merge` }]),
            jobs: hd([{ text: `celebrities skipped`, icon: `check` }]),
          }),
          links: Od({ ...xd({ label: `pull celebrity timelines`, labelAt: 0.6 }) }),
          flows: [
            Cd(),
            wd(2.2),
            { route: [`au`], kind: `write`, rate: 0.6 },
            { route: [`k1l`], kind: `write`, rate: 0.6 },
            Ed(1.6),
          ],
        },
      },
      {
        short: `Idle users`,
        chapter: `tradeoff`,
        title: `Case: feeds nobody reads`,
        body: [
          `Of everyone who follows Ana, perhaps a third opened the app this month. Fanning out to the rest fills memory with lists nobody will ever look at.`,
          `So skip them: fan out only to followers active in the last 30 days, and let everyone else’s list expire. When a lapsed user comes back, build their feed once with the pull model, cache it, and resume pushing.`,
        ],
        callout: {
          kind: `tip`,
          text: `The pull path never goes away. It is how feeds are created, repaired and rebuilt — push is an optimisation layered on top of it.`,
        },
        changes: [
          `~ Fan out only to recently active followers`,
          `~ Idle feed lists expire`,
          `+ Returning users: rebuilt by pull, once`,
        ],
        metrics: Nd,
        scene: {
          entities: Dd({
            workers: gd([{ text: `active in last 30 days only`, tone: `green`, icon: `filter` }]),
            feeds: md([{ text: `idle lists expire`, icon: `clock` }]),
          }),
          links: Od(),
          flows: [Cd(), wd(), ...Td(), Ed(1.4)],
        },
      },
      {
        short: `Scrolling`,
        chapter: `technique`,
        title: `Scrolling: cursors, not page numbers`,
        body: [
          `Alice scrolls down for more. “Page 2” would mean “skip 20, take 20” — but three new posts have arrived at the top since page 1, so she’d see three posts twice.`,
          `Use a <span class="term">cursor</span> instead (see <em>REST, RPC & GraphQL</em>): “give me 20 posts older than post 9017”. The position is tied to a post, not to a count, so new arrivals can’t shift it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Time-ordered ids (<em>Unique IDs at Scale</em>) make this easy: “older than” is simply “id less than”.`,
        },
        changes: [`+ GET /feed?before=9017&limit=20`],
        metrics: Nd,
        scene: {
          entities: Dd({
            card: Md(
              `Cursor pagination`,
              [
                `GET /feed?limit=20`,
                `# → posts 9041 … 9017 · next: before=9017`,
                `GET /feed?before=9017&limit=20`,
                `= stays put while new posts arrive`,
              ],
              `listOrdered`,
            ),
          }),
          links: Od(),
          flows: kd(),
        },
      },
      {
        short: `Cache lost`,
        chapter: `insight`,
        title: `Case: the feed cache is wiped`,
        body: [
          `A bad deploy flushes the feed cache. Every feed is gone — and nothing of value is lost. Posts and the follow graph are the <b>source of truth</b>; feed lists are <b>derived data</b> that can be rebuilt from them.`,
          `The danger is a stampede: millions of users rebuilding by pull at the same moment. So rebuild lazily, only when a user actually opens the app; cap how many rebuilds run at once; and serve a thinner feed until the cache is warm again.`,
        ],
        callout: {
          kind: `insight`,
          text: `Know which of your data is the truth and which is a convenience. You can afford to be relaxed about the second only because you are strict about the first.`,
        },
        changes: [
          `− Feed cache flushed`,
          `~ Feeds rebuilt on demand from posts + follows`,
          `~ Rebuilds throttled to protect the post store`,
        ],
        metrics: {
          feedMs: 350,
          readWork: `rebuild: 200`,
          fanout: `≈ 70 · active only`,
          postDelay: `≈ 2 s`,
        },
        scene: {
          entities: Dd({
            api: fd([{ text: `rebuild on open · max 500 at once`, icon: `gauge` }]),
            feeds: md([{ text: `empty · warming up`, tone: `amber`, icon: `refresh` }], {
              heat: 0.3,
            }),
          }),
          links: Od({ fc: bd.fc({ fail: 0.5 }) }),
          flows: [Cd(2.6), { ...Sd, rate: 1.4 }, ...Td(), Ed(2)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `The finished design`,
        body: [
          `<table class="compare">
          <thead><tr><th>Question</th><th>Decision</th><th>Because</th></tr></thead>
          <tbody>
            <tr><td>Build feeds</td><td>On write (push)</td><td>40 reads per post</td></tr>
            <tr><td>Celebrities</td><td>Pull, merged at read</td><td>50 M writes per post</td></tr>
            <tr><td>Feed entries</td><td>Post ids, capped</td><td>One copy of each post</td></tr>
            <tr><td>Idle users</td><td>No fan-out; rebuild</td><td>Unread feeds cost memory</td></tr>
            <tr><td>Scrolling</td><td>Cursors</td><td>New posts shift pages</td></tr>
          </tbody>
        </table>`,
          `A ranked feed adds one more stage — score the candidates before returning them — but the plumbing underneath is the same.`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Design a Chat System</b> — where every message has to arrive, in order, and show up exactly once.`,
        },
        metrics: Nd,
        scene: { entities: Dd(), links: Od(), flows: kd() },
      },
    ],
  };

export { Pd as designNewsFeedLesson };
export default Pd;
