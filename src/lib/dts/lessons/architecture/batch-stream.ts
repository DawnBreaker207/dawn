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
} from '../../scene-builders';

const el = { x0: -4.5, x1: 4.5, y0: -25, y1: -19 };

const tl = { x0: -16, x1: -6, y0: -3, y1: 9 };

const nl = () => p(el, 13, `viewers`);

const rl = () => d(0, -11, { label: [`Video`, `App`] });

const il = (e = {}) => b(0, 0, { r: 2, h: 42, label: `production DB`, ...e });

const al = (e = []) => d(0, 15, { color: `slab`, glyph: `chartLine`, label: [`Dashboard`], tags: e });

const ol = (e = `NIGHTLY BATCH JOB`, t = {}) => ({
    logs: b(-11, -11, { r: 1.8, h: 36, glyph: `box`, label: `event logs` }),
    batch: x(tl, e),
    w1: d(-13.5, 0, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w1 || [] }),
    w2: d(-8.5, 0, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w2 || [] }),
    w3: d(-13.5, 6, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w3 || [] }),
    w4: d(-8.5, 6, { s: 3, h: 30, color: `green`, glyph: `cpu`, label: [], tags: t.w4 || [] }),
    wh: b(-11, 15, { r: 1.8, h: 36, glyph: `chart`, label: `warehouse` }),
  });

const sl = (e = [], t = []) => ({
    kafka: d(11, -11, { color: `slab`, glyph: `waves`, label: [`Event`, `Stream`], tags: t }),
    proc: d(11, 3, { color: `green`, glyph: `activity`, label: [`Stream`, `Processor`], tags: e }),
    live: b(11, 15, { r: 1.8, h: 36, glyph: `zap`, label: `live counts` }),
  });

const z = {
    base: {
      va: h(`viewers`, `app`, [`viewers`, `app`], { heads: `both` }),
      ad: h(`app`, `prod`, [`app`, `prod`], { heads: `both` }),
    },
    heavy: {
      dp: h(`dash`, `prod`, [`dash`, `prod`], {
        heads: `both`,
        label: `GROUP BY video · every minute`,
        labelTone: `red`,
        labelAt: 0.45,
      }),
    },
    batch: {
      al: h(`app`, `logs`, [`app`, `logs`], { label: `append events` }),
      lb: h(`logs`, `batch`, [`logs`, `batch`], { label: `read 1 day`, labelAt: 0.45 }),
      bw: h(`batch`, `wh`, [`batch`, `wh`], { label: `write results`, labelAt: 0.55 }),
      dw: h(`dash`, `wh`, [`dash`, `wh`], { heads: `both` }),
    },
    stream: {
      ak: h(`app`, `kafka`, [`app`, `kafka`], { label: `publish each view` }),
      kp: h(`kafka`, `proc`, [`kafka`, `proc`]),
      pl: h(`proc`, `live`, [`proc`, `live`], { label: `update counts`, labelAt: 0.5 }),
      dl: h(`dash`, `live`, [`dash`, `live`], { heads: `both` }),
    },
  };

const B = {
    base: { route: [`va`, `ad`], rate: 2.2, bounce: !0 },
    batch: [
      { route: [`al`], kind: `write`, rate: 2.2 },
      { route: [`lb`], kind: `heavy`, rate: 0.35, speed: 0.7 },
      { route: [`bw`], kind: `write`, rate: 0.35 },
      { route: [`dw`], rate: 0.6, bounce: !0 },
    ],
    stream: [
      { route: [`ak`, `kp`, `pl`], kind: `msg`, rate: 2.2, speed: 1.1 },
      { route: [`dl`], rate: 0.8, bounce: !0 },
    ],
  };

const cl = (e, t, n, r = {}) => S({ x: 0, y: 0, z: 0, dx: 75, dy: 25 }, e, t, { icon: n, ...r });

const ll = (e, t, n, r = {}) => S({ x: -11, y: -11, z: 0, dx: -40, dy: -215 }, e, t, { icon: n, ...r });

const ul = {
    id: `batch-stream`,
    title: `Batch & Stream Processing`,
    summary: `Crunching billions of events: overnight in big batches, or continuously as they arrive.`,
    minutes: 15,
    level: `intermediate`,
    metrics: [`freshness`, `prodLoad`, `eventsDay`, `exact`],
    legend: [
      `req`,
      `res`,
      [`write`, `event / result`],
      [`heavy`, `big scan`],
      [`msg`, `streamed event`],
    ],
    goals: [
      { text: `Keep analytics off the production database`, step: 0 },
      { text: `Batch processing and map/reduce`, step: 2 },
      { text: `Skewed keys: combiners and salting`, step: 4 },
      { text: `Stream processing and windows`, step: 7 },
      { text: `Late events, lag and partitions`, step: 10 },
      { text: `Approximate counts, and running both`, step: 12 },
    ],
    steps: [
      {
        short: `Live DB`,
        chapter: `problem`,
        title: `Analytics on the production database`,
        body: [
          `Every view of every video is a row in the production database — about 2 billion a day. A dashboard shows views per video, recomputed every minute with a big <code>GROUP BY</code>.`,
          `Each run scans the whole day so far — hundreds of millions of rows by mid-morning — and the database that serves the app grinds: viewers wait while it counts.`,
        ],
        callout: {
          kind: `warn`,
          text: `Production databases are tuned for many small, fast queries. Huge scans steal their memory, CPU and disk.`,
        },
        metrics: { freshness: `live`, prodLoad: 95, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: { viewers: nl(), app: rl(), prod: il(_(0.95)), dash: al() },
          links: { ...z.base, ...z.heavy },
          flows: [B.base, { route: [`dp`], kind: `heavy`, rate: 0.6, bounce: !0, hold: 1.3 }],
        },
      },
      {
        short: `Batch`,
        chapter: `solution`,
        title: `Batch: collect now, compute later`,
        body: [
          `Instead, the app appends every view as an event to cheap <b>object storage</b> — files, not database rows. Once a night a <span class="term">batch job</span> reads the whole day, computes the counts on a cluster of workers, and writes the results to an analytics <b>warehouse</b>.`,
          `The dashboard reads the warehouse. The production database only serves the app again.`,
        ],
        callout: {
          kind: `tip`,
          text: `Batch is simple, cheap and easy to rerun: if the job had a bug, fix it and run it again over the same files.`,
        },
        changes: [
          `+ Event logs in object storage`,
          `+ Nightly batch job on 4 workers`,
          `+ Warehouse for analytics`,
          `~ Production DB load 95% → 30%`,
        ],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: { viewers: nl(), app: rl(), prod: il(v(0.3)), dash: al(), ...ol() },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Map/reduce`,
        chapter: `technique`,
        title: `Split the work: map, shuffle, reduce`,
        body: [
          `2 billion events won’t fit through one machine quickly, so the job is split. <b>Map</b>: each worker reads its own chunk of the files and counts views per video. <b>Shuffle</b>: counts for the same video are sent to the same worker. <b>Reduce</b>: that worker adds them up.`,
          `Add more workers and the job finishes proportionally faster.`,
        ],
        callout: {
          kind: `tip`,
          text: `This is MapReduce. Today Spark, BigQuery, Snowflake and friends do the same thing behind a SQL interface.`,
        },
        changes: [`~ Workers 1–2: map their chunks`, `~ Workers 3–4: reduce per video`],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP → SHUFFLE → REDUCE`, {
              w1: [{ text: `map` }],
              w2: [{ text: `map` }],
              w3: [{ text: `reduce` }],
              w4: [{ text: `reduce` }],
            }),
            card: cl(
              `Counting 2 billion views`,
              [
                `map:     each worker counts its chunk`,
                `shuffle: same video → same worker`,
                `reduce:  sum the counts per video`,
                `= 100 workers: ~20 minutes`,
              ],
              `sigma`,
            ),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Skew`,
        chapter: `problem`,
        title: `Case: one video, one exhausted reducer`,
        body: [
          `One video went viral: 40% of all views yesterday. In the shuffle, every view of it goes to the <em>same</em> reducer. That worker grinds for 3 hours while the other 99 finished in 5 minutes — and the job waits for the slowest.`,
          `Splitting work by key only balances it if the keys are balanced. Real data rarely is.`,
        ],
        callout: {
          kind: `warn`,
          text: `Skew is the most common reason a big batch job is mysteriously slow. Look for one task taking far longer than the rest.`,
        },
        changes: [
          `+ One video = 40% of the data`,
          `− One reducer runs 3 h`,
          `~ Job finishes 3 h late`,
        ],
        metrics: { freshness: `up to 27 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP → SHUFFLE → REDUCE`, {
              w1: [{ text: `map` }],
              w2: [{ text: `map` }],
              w4: [{ text: `5 min`, tone: `green` }],
            }),
            w3: d(-13.5, 6, {
              s: 3,
              h: 30,
              color: `green`,
              glyph: `cpu`,
              label: [],
              heat: 0.85,
              tags: [{ text: `40% of data · 3 h`, tone: `red`, icon: `hourglass` }],
            }),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Combine`,
        chapter: `solution`,
        title: `Combine early, split hot keys`,
        body: [
          `Two standard fixes. A <span class="term">combiner</span> pre-aggregates on each mapper: instead of shipping 800 million “view of 4f2” rows, every mapper sends one partial count. For keys that are still too hot, <span class="term">salting</span> splits them — <code>4f2#0</code> … <code>4f2#9</code> go to ten reducers, and a final step adds the ten totals.`,
          `The job drops from 3 hours back to about 20 minutes.`,
        ],
        callout: {
          kind: `tip`,
          text: `Spark and most SQL engines combine automatically for sums and counts, and can detect and split skewed keys for joins.`,
        },
        changes: [
          `+ Combiner on every mapper`,
          `+ Hot key split across 10 reducers`,
          `~ Job 3 h → 20 min`,
        ],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`MAP + COMBINE → REDUCE`, {
              w1: [{ text: `map + combine` }],
              w2: [{ text: `map + combine` }],
              w3: [{ text: `reduce · even`, tone: `green` }],
              w4: [{ text: `reduce · even`, tone: `green` }],
            }),
            card: cl(
              `Taming a hot key`,
              [
                `! viral video: 800M rows → one reducer`,
                `= combiner: each mapper sends 1 count`,
                `= salting: 4f2#0 … 4f2#9 → 10 reducers`,
                `# job: 3 h → 20 min`,
              ],
              `split`,
            ),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Too late`,
        chapter: `problem`,
        title: `A day late is too late`,
        body: [
          `Some questions can’t wait for tonight. A video going viral should show up in “Trending” <em>now</em>. A bot farm faking millions of views should be caught in minutes, before it earns any money.`,
          `Running the batch job every hour helps a little, but each run still re-reads a huge pile of data.`,
        ],
        callout: {
          kind: `insight`,
          text: `Batch answers “what happened?”. Some products need “what is happening?”.`,
        },
        changes: [`− Trending list is a day old`, `− Fake views caught only tomorrow`],
        metrics: { freshness: `up to 24 h`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: yesterday’s`, tone: `red`, icon: `clock` }]),
            ...ol(),
          },
          links: { ...z.base, ...z.batch },
          flows: [B.base, ...B.batch],
        },
      },
      {
        short: `Stream`,
        chapter: `solution`,
        title: `Stream processing: compute as events arrive`,
        body: [
          `Now the app publishes each view to an <b>event stream</b> (Kafka). A <span class="term">stream processor</span> (Flink, Kafka Streams, Spark Streaming) reads events as they arrive and keeps running counts, writing results to a fast store.`,
          `The dashboard is seconds behind reality instead of a day.`,
        ],
        callout: {
          kind: `tip`,
          text: `The processor keeps its counts in local state and checkpoints it regularly, so a crash resumes from the last checkpoint instead of from scratch.`,
        },
        changes: [
          `− Nightly batch job`,
          `+ Event stream`,
          `+ Stream processor`,
          `+ Live counts store`,
          `~ Results age 24 h → 5 s`,
        ],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl(),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Windows`,
        chapter: `technique`,
        title: `Counting in windows`,
        body: [
          `A stream never ends, so “count views” needs a time frame: a <span class="term">window</span>. <b>Tumbling</b> windows cut time into fixed slices (views per minute). <b>Sliding</b> windows overlap (views in the last 10 minutes, updated every minute).`,
          `A sudden jump between windows is exactly what “trending” — or fraud — looks like.`,
        ],
        callout: {
          kind: `tip`,
          text: `Session windows group events by bursts of activity — useful for “how long did people watch?”.`,
        },
        changes: [`+ 1-minute tumbling windows per video`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl([{ text: `windows: 1 min`, icon: `clock` }]),
            card: ll(`Views of video 4f2 per minute`, [], `chartLine`, {
              chart: `bars`,
              bars: [
                { label: `12:01`, to: 0.05, tone: `gray`, note: `120` },
                { label: `12:02`, to: 0.06, tone: `gray`, note: `140` },
                { label: `12:03`, to: 0.31, tone: `amber`, note: `780` },
                { label: `12:04`, to: 1, tone: `green`, note: `2,500 ↑ trending`, bold: !0 },
              ],
            }),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Late events`,
        chapter: `problem`,
        title: `Case: late and duplicate events`,
        body: [
          `A phone watches videos in the subway with no signal and uploads its views two hours later. Should they count for 12:04, when they happened, or now, when they arrived? And a flaky network makes some phones send the same event twice.`,
          `Stream processors use <b>event time</b> (when it happened), a <span class="term">watermark</span> to decide when a window is complete enough to publish, a policy for stragglers, and an event id to drop duplicates.`,
        ],
        callout: {
          kind: `warn`,
          text: `“Exactly-once” in streaming means checkpoints plus idempotent writes — the same lesson as queues, at billions of events a day.`,
        },
        changes: [`+ Events 2 h late`, `+ Duplicate events`, `~ Watermarks + dedupe by event id`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...sl(
              [{ text: `watermark: 12:05 · dedupe on`, icon: `filter` }],
              [{ text: `event from 2 h ago`, tone: `amber`, icon: `clock` }],
            ),
            card: ll(
              `Event time vs arrival time`,
              [
                `view at 12:04, arrives 14:10`,
                `watermark: “events ≤ 5 min late”`,
                `! 2 h late → correct window later`,
                `= duplicate id → dropped`,
              ],
              `clock`,
            ),
          },
          links: { ...z.base, ...z.stream },
          flows: [
            B.base,
            {
              route: [`ak`, `kp`, `pl`],
              kind: `msg`,
              rate: 2.2,
              speed: 1.1,
              pattern: [`msg`, `msg`, `msg`, `slow`, `msg`, `msg`, `poison`],
            },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Lag`,
        chapter: `problem`,
        title: `Case: the processor falls behind`,
        body: [
          `A celebrity live stream triples traffic for an hour. The stream processor can’t keep up, and unprocessed events pile up in the stream: <span class="term">consumer lag</span> reaches 4 minutes and 18 million events.`,
          `Nothing is lost — the stream keeps everything — but the “live” dashboard is now 4 minutes old, and the fraud check runs 4 minutes late.`,
        ],
        callout: {
          kind: `warn`,
          text: `Consumer lag is the key health metric of any streaming system. Alert on it, in seconds or events.`,
        },
        changes: [`~ Traffic × 3`, `− Processor at 100%`, `− Lag: 4 min · 18M events`],
        metrics: { freshness: `4 min`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `live counts: 4 min old`, tone: `amber`, icon: `clock` }]),
            ...sl([], [{ text: `lag: 4 min · 18M events`, tone: `red`, icon: `clock` }]),
            proc: d(11, 3, {
              color: `green`,
              glyph: `activity`,
              label: [`Stream`, `Processor`],
              heat: 0.85,
              tags: [{ text: `falling behind`, tone: `red`, icon: `alert` }],
            }),
          },
          links: { ...z.base, ...z.stream },
          flows: [
            B.base,
            { route: [`ak`], kind: `msg`, rate: 4.4, speed: 1.1 },
            { route: [`kp`, `pl`], kind: `msg`, rate: 1.2 },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Partitions`,
        chapter: `solution`,
        title: `Scale out across partitions`,
        body: [
          `The stream is split into <b>partitions</b> (by video id, so each video’s events stay in order). Each processor instance owns some partitions, so adding instances adds throughput: two processors, two partitions each.`,
          `The backlog drains, lag drops back to seconds, and an autoscaler can add processors whenever lag grows.`,
        ],
        callout: {
          kind: `tip`,
          text: `The number of partitions caps the parallelism. Create more partitions than you need today — adding them later reshuffles keys.`,
        },
        changes: [`+ Second processor`, `~ 4 partitions split 2 + 2`, `~ Lag 4 min → 2 s`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `with care` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `trending: now`, tone: `green`, icon: `trendingUp` }]),
            ...sl(
              [{ text: `partitions 0–1` }],
              [{ text: `4 partitions · lag 2 s`, tone: `green`, icon: `layers` }],
            ),
            proc2: d(17, 3, {
              color: `green`,
              glyph: `activity`,
              label: [`Stream`, `Processor`],
              tags: [{ text: `partitions 2–3` }],
            }),
          },
          links: {
            ...z.base,
            ...z.stream,
            kp2: h(`kafka`, `proc2`, [`kafka`, [`proc2`, `kafka`], `proc2`]),
            p2l: h(`proc2`, `live`, [`proc2`, [`proc2`, `live`], `live`]),
          },
          flows: [
            B.base,
            { route: [`ak`], kind: `msg`, rate: 4.4, speed: 1.1 },
            {
              routes: [{ path: [`kp`, `pl`] }, { path: [`kp2`, `p2l`] }],
              kind: `msg`,
              rate: 4.4,
              speed: 1.1,
            },
            { route: [`dl`], rate: 0.8, bounce: !0 },
          ],
        },
      },
      {
        short: `Unique`,
        chapter: `technique`,
        title: `Case: counting unique viewers`,
        body: [
          `Views are easy to count. <b>Unique</b> viewers are not: to count exactly you must remember every viewer id you’ve seen — 50 million ids for a popular video, about 800 MB of state, per video, per window.`,
          `A <span class="term">HyperLogLog</span> sketch estimates the number of distinct ids in 12 KB with about 1% error, and sketches from different machines and windows simply merge.`,
        ],
        callout: {
          kind: `insight`,
          text: `Approximate algorithms (HyperLogLog, count-min sketch, t-digest for percentiles) trade a tiny error for enormous savings. Dashboards rarely need the last 1%.`,
        },
        changes: [
          `+ Unique viewers per video`,
          `~ Exact set → HyperLogLog sketch`,
          `~ 800 MB → 12 KB per video`,
        ],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `≈ 1% error` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al([{ text: `unique viewers ≈ 48.2M`, icon: `users` }]),
            ...sl([{ text: `HyperLogLog per video`, icon: `sigma` }]),
            card: ll(
              `Unique viewers of 4f2`,
              [
                `exact: remember every viewer id`,
                `! 50M ids × 16 bytes ≈ 800 MB`,
                `= HyperLogLog: 12 KB, ~1% error`,
                `# sketches merge across machines`,
              ],
              `sigma`,
            ),
          },
          links: { ...z.base, ...z.stream },
          flows: [B.base, ...B.stream],
        },
      },
      {
        short: `Both`,
        chapter: `insight`,
        title: `Batch and stream, together`,
        body: [
          `Many systems run both: a stream for fast, approximate answers and a nightly batch that recomputes the exact numbers from the full log (the <b>lambda architecture</b>).`,
          `Others keep only the stream and, to fix a bug or rebuild results, <b>replay</b> the retained event log through a new version of the processor (the <b>kappa architecture</b>).`,
          `<table class="compare">
          <thead><tr><th></th><th>Batch</th><th>Stream</th></tr></thead>
          <tbody>
            <tr><td>Freshness</td><td>Hours</td><td>Seconds</td></tr>
            <tr><td>Complexity</td><td>Low</td><td>Higher</td></tr>
            <tr><td>Rerun</td><td>Easy</td><td>Replay the log</td></tr>
          </tbody>
        </table>`,
        ],
        callout: {
          kind: `tip`,
          text: `Start with batch unless you clearly need seconds. Add streaming for the few results that do.`,
        },
        changes: [`+ Nightly batch back alongside the stream`],
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`NIGHTLY · EXACT`),
            ...sl(),
          },
          links: { ...z.base, ...z.batch, ...z.stream },
          flows: [B.base, ...B.batch, ...B.stream],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Keep heavy analytics <b>off the production database</b>.</li>
          <li><b>Batch</b>: process large, finished datasets cheaply — results are hours old.</li>
          <li><b>Stream</b>: process events as they arrive — seconds old, more moving parts.</li>
          <li>Watch for <b>skewed keys</b> (combine, salt) and <b>consumer lag</b> (add partitions and processors).</li>
          <li>Handle <b>late</b> and <b>duplicate</b> events; many systems run <b>both</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `That completes Architecture. Next module: <b>Security</b> — starting with authentication.`,
        },
        metrics: { freshness: `5 s`, prodLoad: 30, eventsDay: `2 billion`, exact: `yes` },
        scene: {
          entities: {
            viewers: nl(),
            app: rl(),
            prod: il(v(0.3)),
            dash: al(),
            ...ol(`NIGHTLY · EXACT`),
            ...sl(),
          },
          links: { ...z.base, ...z.batch, ...z.stream },
          flows: [B.base, ...B.batch, ...B.stream],
        },
      },
    ],
  };

export { ul as batchStreamLesson };
export default ul;
