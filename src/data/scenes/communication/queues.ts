// @ts-nocheck
import {
  DEAD_STATE,
  makeBlock,
  makeCool,
  makeCrowd,
  makeDb,
  makeHot,
  makeLink,
  makePanel,
  makeQueue,
  makeZone
} from '@/lib/simulator/scene-builders';

const To = { x0: -4.5, x1: 4.5, y0: -21, y1: -15 };

const Eo = { x0: -6.5, x1: 6.5, y0: -1.5, y1: 2.5 };

const Do = { w1: -4, w2: 4 };

const Oo = { w4: -12, w1: -6, w3: 0, w2: 6, w5: 12 };

const ko = (e = 11, t = `creators uploading`) => makeCrowd(To, e, t);

const Ao = (e = {}) => makeBlock(0, -9, { label: [`Web`, `Server`], ...e });

const jo = (e = `QUEUE · VIDEO JOBS`) => makeZone(Eo, e);

const Mo = (e) => makeQueue(5.6, 1, e, [-1, 0]);

const No = (e, t = {}) => makeBlock(e, 9, { color: `green`, glyph: `video`, label: [`Worker`], ...t });

const Po = (e, t = {}) =>
    Object.fromEntries(
      Object.entries(e).map(([e, n]) => [e, No(n, { ...makeCool(-1), ...(t[e] || {}) })]),
    );

const F = {
    uw: (e = {}) => ({ uw: makeLink(`users`, `web`, [`users`, `web`], { heads: `both`, ...e }) }),
    wq: { wq: makeLink(`web`, `mq`, [`web`, `mq`], { label: `enqueue job` }) },
    pull: (e, t = {}) =>
      Object.fromEntries(
        e.map((e, n) => [
          `q${e}`,
          makeLink(`mq`, e, [`mq`, [e, `mq`], e], {
            ...(n === 0 ? { label: `pull` } : {}),
            ...(t[e] || {}),
          }),
        ]),
      ),
  };

const Fo = (e = 3) => ({ route: [`uw`], rate: e, bounce: !0 });

const Io = (e = 1.4) => ({ route: [`wq`], kind: `msg`, rate: e });

const Lo = (e, t = 1.4) => ({
    routes: e.map((e) => ({ path: [`q${e}`] })),
    rate: t,
    kind: `msg`,
    speed: 0.6,
  });

const Ro = (e, t, n) => makePanel({ x: 6.5, y: 2.5, z: 0, dx: 80, dy: -240 }, e, t, { icon: n });

const zo = {
    id: `queues`,
    title: `Message Queues`,
    summary: `Answer right away, do the slow work later — and never lose a job along the way.`,
    minutes: 12,
    level: `beginner`,
    metrics: [`respond`, `backlog`, `workers`, `lost`],
    legend: [`req`, `res`, `msg`, `slow`, `poison`, `fail`],
    goals: [
      { text: `Why slow work doesn’t belong in a request`, step: 0 },
      { text: `Producers, queues and consumers`, step: 1 },
      { text: `Absorbing spikes as backlog`, step: 2 },
      { text: `Acks, retries and dead-letter queues`, step: 5 },
      { text: `Ordering, partitions and backpressure`, step: 8 },
    ],
    steps: [
      {
        short: `Slow upload`,
        chapter: `problem`,
        title: `Slow work inside the request`,
        body: [
          `Creators upload videos, and each one must be transcoded into several sizes — about 30 seconds of heavy work. Right now the web server does it <em>inside</em> the upload request.`,
          `So the creator stares at a spinner for 30 s, many requests time out, and while servers grind through videos, every other page on the site slows down too.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything slow, heavy or unreliable inside a request — video, email, reports, third-party calls — makes users wait for it.`,
        },
        metrics: { respond: 3e4, backlog: `—`, workers: 0, lost: `25%` },
        scene: {
          entities: {
            users: ko(),
            web: Ao({
              ...makeHot(0.96),
              tags: [{ text: `transcoding · 30 s`, tone: `red`, icon: `video` }],
            }),
          },
          links: F.uw({ label: `upload … wait 30 s`, labelTone: `amber`, fail: 0.25 }),
          flows: [{ route: [`uw`], kind: `slow`, rate: 1.8, bounce: !0, speed: 0.4 }],
        },
      },
      {
        short: `Add a queue`,
        chapter: `solution`,
        title: `Put a queue in between`,
        body: [
          `The web server now just stores the upload, puts a small <b>job</b> message on a <span class="term">message queue</span>, and replies at once: “processing — we’ll notify you”.`,
          `Separate <span class="term">worker</span> machines pull jobs off the queue and transcode at their own pace. The web server is the <b>producer</b>; workers are <b>consumers</b>.`,
        ],
        callout: {
          kind: `tip`,
          text: `Popular queues: RabbitMQ, Amazon SQS, Google Pub/Sub, and Kafka (a log that also works as a queue).`,
        },
        changes: [`+ Queue`, `+ 2 workers`, `~ Upload response 30 s → 80 ms`],
        metrics: { respond: 80, backlog: 2, workers: 2, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao({ tags: [{ text: `202 Accepted · 80 ms`, tone: `green`, icon: `check` }] }),
            mq: jo(),
            q: Mo(2),
            ...Po(Do),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w1`, `w2`]) },
          flows: [Fo(), Io(), Lo([`w1`, `w2`])],
        },
      },
      {
        short: `Spike`,
        chapter: `insight`,
        title: `A spike becomes a backlog`,
        body: [
          `A big creator goes live and uploads jump tenfold. Without the queue, that spike would have flattened the web servers.`,
          `Now the web tier stays fast — it only enqueues — and jobs simply wait their turn. Workers keep a steady pace and catch up after the rush.`,
        ],
        callout: {
          kind: `insight`,
          text: `A queue turns “too much work right now” into “a bit more waiting later”. This is called load levelling.`,
        },
        changes: [
          `~ Uploads ×10`,
          `+ Backlog builds: 1,200 jobs`,
          `~ Upload response stays ~85 ms`,
        ],
        metrics: { respond: 85, backlog: 1200, workers: 2, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao({ tags: [{ text: `202 Accepted · 85 ms`, tone: `green`, icon: `check` }] }),
            mq: jo(`QUEUE · 1,200 JOBS WAITING`),
            q: Mo(11),
            ...Po(Do, {
              w1: { tags: [{ text: `steady pace`, icon: `gauge` }] },
              w2: { tags: [{ text: `steady pace`, icon: `gauge` }] },
            }),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w1`, `w2`]) },
          flows: [Fo(6), Io(4), Lo([`w1`, `w2`])],
        },
      },
      {
        short: `More workers`,
        chapter: `technique`,
        title: `Add workers to drain it`,
        body: [
          `Need to catch up faster? Start more workers. They all pull from the same queue, and each job goes to exactly <b>one</b> of them — the <span class="term">competing consumers</span> pattern.`,
          `Workers are stateless, so adding them is easy, and many teams scale them automatically on queue length.`,
        ],
        callout: {
          kind: `tip`,
          text: `Producers and consumers now scale independently: add web servers for traffic, workers for processing.`,
        },
        changes: [`+ 3 more workers`, `~ Backlog 1,200 → 300 and falling`],
        metrics: { respond: 80, backlog: 300, workers: 5, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`]) },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w3`, `w2`, `w5`], 4.4)],
        },
      },
      {
        short: `Crash`,
        chapter: `problem`,
        title: `A worker dies mid-job`,
        body: [
          `A worker crashes halfway through transcoding. If the queue deleted each job the moment it handed it out, that video is simply gone — the creator waits forever.`,
          `Machines crash, get restarted and are replaced all the time. The queue has to assume it.`,
        ],
        callout: { kind: `warn`, text: `Handing out a job is not the same as finishing it.` },
        changes: [`− Worker crashed`, `− Its in-progress jobs lost`],
        metrics: { respond: 80, backlog: 300, workers: 4, lost: 12 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo, { w3: DEAD_STATE }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`], { w3: { fail: 1 } }),
          },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w3`, `w2`, `w5`], 4.4)],
        },
      },
      {
        short: `Acks`,
        chapter: `solution`,
        title: `Acknowledge when done`,
        body: [
          `Fix: a job is only <em>hidden</em> while a worker has it. When the worker finishes, it sends an <span class="term">acknowledgement</span> and the job is deleted. No ack within a timeout? The job reappears and another worker picks it up.`,
          `The catch: a job can now run <b>twice</b> (say, a worker finishes but dies before acking). So jobs must be <span class="term">idempotent</span> — safe to repeat.`,
        ],
        callout: {
          kind: `tip`,
          text: `This is “at-least-once” delivery, the norm for queues. Exactly-once is very hard; idempotent consumers get you the same result.`,
        },
        changes: [
          `+ Ack after each job`,
          `+ Unacked jobs redelivered after 60 s`,
          `~ Lost jobs 12 → 0`,
        ],
        metrics: { respond: 80, backlog: 320, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `creators · ×10`),
            web: Ao(),
            mq: jo(`QUEUE · DRAINING`),
            q: Mo(4),
            ...Po(Oo, { w3: DEAD_STATE }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w3`, `w2`, `w5`], { w3: { style: `off` } }),
          },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w2`, `w5`], 4)],
        },
      },
      {
        short: `Poison`,
        chapter: `technique`,
        title: `Poison messages and the dead-letter queue`,
        body: [
          `One upload is a corrupt file. Every worker that tries it crashes or fails, the job is redelivered, and it fails again — forever, wasting workers and blocking others.`,
          `So queues count attempts. After, say, 3 failures the message is moved to a <span class="term">dead-letter queue</span> (DLQ) for a human or a script to inspect.`,
        ],
        callout: {
          kind: `tip`,
          text: `Alert on DLQ size. A growing dead-letter queue is often the first sign of a bug.`,
        },
        changes: [
          `− Crashed worker removed`,
          `+ Dead-letter queue`,
          `~ Failing jobs moved aside after 3 attempts`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(),
            q: Mo(2),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }),
            dlq: makeDb(-15, 0.5, { r: 1.6, h: 32, glyph: `skull`, label: `dead letters` }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w2`, `w5`]),
            dl: makeLink(`mq`, `dlq`, [`mq`, `dlq`], {
              style: `dashed`,
              label: `after 3 failures`,
              labelAt: 0.35,
            }),
          },
          flows: [
            Fo(3),
            Io(1.6),
            Lo([`w4`, `w1`, `w2`, `w5`], 1.6),
            { route: [`dl`], kind: `poison`, rate: 0.35, speed: 0.6 },
          ],
        },
      },
      {
        short: `Order`,
        chapter: `problem`,
        title: `Case: messages out of order`,
        body: [
          `A different queue carries account events: <code>created</code>, <code>email changed</code>, <code>deleted</code>. With several workers pulling in parallel, a slow worker can finish “email changed” <em>after</em> another worker has already processed “deleted”.`,
          `Many queues give no ordering guarantee at all — and even ordered ones lose it once several consumers work in parallel.`,
        ],
        callout: {
          kind: `warn`,
          text: `If correctness depends on order, you must design for it explicitly.`,
        },
        changes: [
          `+ Account events: created → changed → deleted`,
          `− Processed as created → deleted → changed`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(`QUEUE · ACCOUNT EVENTS`),
            q: Mo(3),
            ...Po(
              { w4: -12, w1: -6, w2: 6, w5: 12 },
              {
                w1: { tags: [{ text: `“deleted” ✓`, tone: `green` }] },
                w2: {
                  heat: 0.3,
                  tags: [{ text: `“email changed” · late`, tone: `red`, icon: `alert` }],
                },
              },
            ),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Partitions`,
        chapter: `solution`,
        title: `Order per key with partitions`,
        body: [
          `Systems like Kafka split a topic into <span class="term">partitions</span>. Messages with the same key (say, the account id) always go to the same partition, and each partition is read by one worker, in order.`,
          `So events for one account stay in order, while different accounts are still processed in parallel across partitions.`,
        ],
        callout: {
          kind: `tip`,
          text: `Order is guaranteed per key, not globally. Global order means one consumer — and no parallelism.`,
        },
        changes: [
          `+ 4 partitions, keyed by account id`,
          `~ Each worker owns one partition`,
          `~ Events per account stay in order`,
        ],
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(`TOPIC · 4 PARTITIONS BY ACCOUNT`),
            q: Mo(3),
            ...Po(
              { w4: -12, w1: -6, w2: 6, w5: 12 },
              {
                w4: { tags: [{ text: `partition 0` }] },
                w1: { tags: [{ text: `partition 1` }] },
                w2: { tags: [{ text: `partition 2` }] },
                w5: { tags: [{ text: `partition 3` }] },
              },
            ),
          },
          links: { ...F.uw(), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Backpressure`,
        chapter: `technique`,
        title: `When the backlog never drains`,
        body: [
          `Queues absorb spikes — but if jobs arrive faster than workers finish them <em>for hours</em>, the backlog grows forever. Jobs get older and older, and eventually storage runs out.`,
          `Watch queue <b>age</b>, not just length, and push back: autoscale workers, cap the queue, and tell producers to slow down (or reject new jobs with a clear “try later”).`,
        ],
        callout: {
          kind: `insight`,
          text: `A queue buys time, not capacity. Long-term, throughput must match the arrival rate.`,
        },
        changes: [`+ Alert: oldest job > 10 min`, `+ Queue capped · producers told to retry later`],
        metrics: { respond: 120, backlog: 5e4, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(15, `all-day surge`),
            web: Ao({ tags: [{ text: `503 · try again in 60 s`, tone: `amber`, icon: `clock` }] }),
            mq: jo(`QUEUE · 50,000 JOBS · OLDEST 25 MIN`),
            q: Mo(12),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }, { w4: makeHot(1), w1: makeHot(1), w2: makeHot(1), w5: makeHot(1) }),
          },
          links: { ...F.uw({ fail: 0.25 }), ...F.wq, ...F.pull([`w4`, `w1`, `w2`, `w5`]) },
          flows: [Fo(6), Io(4), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>Move slow work out of the request: <b>enqueue</b> a job and answer immediately.</li>
          <li>Queues <b>absorb spikes</b>; add <b>workers</b> to drain the backlog.</li>
          <li><b>Ack</b> after finishing; unacked jobs are retried — keep jobs <b>idempotent</b>.</li>
          <li>Park repeat failures in a <b>dead-letter queue</b>.</li>
          <li>Keep order <b>per key</b> with partitions; watch <b>queue age</b> and push back.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Pub/Sub & Events</b> — when one thing happening should trigger many others.`,
        },
        metrics: { respond: 80, backlog: 60, workers: 4, lost: 0 },
        scene: {
          entities: {
            users: ko(),
            web: Ao(),
            mq: jo(),
            q: Mo(2),
            ...Po({ w4: -12, w1: -6, w2: 6, w5: 12 }),
            dlq: makeDb(-15, 0.5, { r: 1.6, h: 32, glyph: `skull`, label: `dead letters` }),
          },
          links: {
            ...F.uw(),
            ...F.wq,
            ...F.pull([`w4`, `w1`, `w2`, `w5`]),
            dl: makeLink(`mq`, `dlq`, [`mq`, `dlq`], { style: `dashed` }),
          },
          flows: [Fo(3), Io(1.6), Lo([`w4`, `w1`, `w2`, `w5`], 1.6)],
        },
      },
    ],
  };

export { zo as queuesLesson };
export default zo;
