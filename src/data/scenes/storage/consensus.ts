import { makeBlock, makeDb, makeLink, makePanel, makeZone, type Bag, type Tag } from '@/lib/simulator/scene-builders';

const ka: Record<string, [number, number]> = { a: [0, -5], b: [-10, 7], c: [10, 7] };

const node = (e: string, t: Tag[] = [], n: Bag = {}) =>
    makeDb(ka[e][0], ka[e][1], {
      r: 1.9,
      glyph: `database`,
      label: `node ${e.toUpperCase()}`,
      tags: t,
      ...n,
    });

const appServer1 = (e: Bag = {}) => makeBlock(7.5, -14, { label: [`App`, `Server 1`], ...e });

const appServer2 = (e: Bag = {}) => makeBlock(-16, 1, { label: [`App`, `Server 2`], ...e });

const leaderTag = (e: number) => ({ text: `leader · term ${e}`, tone: `green`, icon: `flag` });

const followerTag = { text: `follower`, icon: `check` };

const cutStyle = { heads: `none`, style: `cut` };

const links = {
    w1a: (e: Bag = {}) => makeLink(`app1`, `a`, [`app1`, `a`], { heads: `both`, ...e }),
    w2b: (e: Bag = {}) => makeLink(`app2`, `b`, [`app2`, `b`], { heads: `both`, ...e }),
    w1b: (e: Bag = {}) => makeLink(`app1`, `b`, [`app1`, [`b-1`, `app1`], `b-1`], { heads: `both`, ...e }),
    w1c: (e: Bag = {}) => makeLink(`app1`, `c`, [`app1`, [`c+1`, `app1`], `c+1`], { heads: `both`, ...e }),
    ab: (e: Bag = {}) => makeLink(`a`, `b`, [`a`, [`b`, `a`], `b`], e),
    ac: (e: Bag = {}) => makeLink(`a`, `c`, [`a`, [`c`, `a`], `c`], e),
    ba: (e: Bag = {}) => makeLink(`b`, `a`, [`b`, [`b`, `a`], `a`], e),
    bc: (e: Bag = {}) => makeLink(`b`, `c`, [`b`, `c`], e),
    ca: (e: Bag = {}) => makeLink(`c`, `a`, [`c`, [`c`, `a`], `a`], e),
    cb: (e: Bag = {}) => makeLink(`c`, `b`, [`c`, `b`], e),
  };

const partitionLinks = () => ({
    xab: links.ab({ ...cutStyle, label: `✕ cut off`, labelTone: `red`, labelAt: 0.3 }),
    xac: links.ac({ ...cutStyle }),
  });

const writeFlow = (e: string[], t = 0.8, n: Bag = {}) => ({ route: e, kind: `write`, rate: t, bounce: !0, ...n });

const fanoutFlow = (e: string[], t = `write`, n = 0.8, r: Bag = {}) => ({
    fanout: !0,
    routes: e.map((e) => ({ path: [e] })),
    kind: t,
    rate: n,
    ...r,
  });

const panel = (e: string, t: string[], n: string, r: Bag = {}) => makePanel({ x: -10, y: 7, z: 0, dx: 190, dy: -125, ...r }, e, t, { icon: n });

const nodes = (e: Bag = {}) => ({ a: node(`a`, e.a || [followerTag]), b: node(`b`, e.b || [leaderTag(2)]), c: node(`c`, e.c || [followerTag]) });

const baseLinks = () => ({ w1b: links.w1b(), w2b: links.w2b(), ba: links.ba(), bc: links.bc() });

const baseFlows = () => [writeFlow([`w1b`], 0.6), writeFlow([`w2b`], 0.6), fanoutFlow([`ba`, `bc`], `write`, 0.9)];

const triLinks = () => ({ w1c: links.w1c(), ca: links.ca(), cb: links.cb() });

const lesson = {
    id: `consensus`,
    title: `Consensus & Leader Election`,
    summary: `How a group of servers agrees on one leader and one history — even when some of them can’t be reached.`,
    minutes: 14,
    level: `advanced`,
    metrics: [`leaders`, `term`, `writes`, `canLose`],
    legend: [
      [`write`, `write / log entry`],
      [`msg`, `vote request`],
      [`ping`, `heartbeat`],
      [`poison`, `stale leader’s write`],
      `fail`,
    ],
    goals: [
      { text: `Why naive failover causes split brain`, step: 1 },
      { text: `Majority quorums — and why they overlap`, step: 2 },
      { text: `Terms, votes and elections (Raft)`, step: 3 },
      { text: `When a write counts as committed`, step: 4 },
      { text: `How many nodes a cluster needs`, step: 6 },
      { text: `Fencing tokens for paused leaders`, step: 8 },
    ],
    steps: [
      {
        short: `One leader`,
        chapter: `setup`,
        title: `One leader, two followers`,
        body: [
          `From <em>Replication</em>: one <span class="term">leader</span> takes every write and copies it to its followers. If the leader dies, a follower is promoted and carries on.`,
          `That sentence hides one of the hardest questions in distributed systems: <b>who decides</b> the leader is dead — and what happens if they’re wrong?`,
        ],
        callout: {
          kind: `insight`,
          text: `From the outside, a crashed server, a slow server and a server behind a broken cable all look exactly the same: silence.`,
        },
        metrics: { leaders: 1, term: `—`, writes: `ok`, canLose: `?` },
        scene: {
          entities: {
            app1: appServer1(),
            a: node(`a`, [{ text: `leader`, tone: `green`, icon: `flag` }]),
            b: node(`b`, [followerTag]),
            c: node(`c`, [followerTag]),
          },
          links: { w1a: links.w1a(), ab: links.ab({ label: `replication`, labelAt: 0.3 }), ac: links.ac() },
          flows: [writeFlow([`w1a`]), fanoutFlow([`ab`, `ac`])],
        },
      },
      {
        short: `Split brain`,
        chapter: `problem`,
        title: `Two leaders at once`,
        body: [
          `A network fault cuts A off from B and C. A is alive and still serving App Server 1 — but B hears nothing, assumes the leader is dead, and promotes itself.`,
          `Now two leaders accept writes. Through A, seat 7 is sold to Ana; through B, the same seat is sold to Ben. Two histories that can never be merged cleanly: <span class="term">split brain</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `A timeout can tell you a server is unreachable. It can never tell you the server is dead.`,
        },
        changes: [
          `− Network between A and the others is cut`,
          `+ B promotes itself`,
          `− Two leaders, two different histories`,
        ],
        metrics: { leaders: 2, term: `—`, writes: `diverging`, canLose: `?` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            a: node(`a`, [{ text: `leader · seat 7 → Ana`, tone: `red`, icon: `flag` }]),
            b: node(`b`, [{ text: `leader · seat 7 → Ben`, tone: `red`, icon: `flag` }]),
            c: node(`c`, [followerTag]),
          },
          links: { w1a: links.w1a(), w2b: links.w2b(), ...partitionLinks(), bc: links.bc() },
          flows: [writeFlow([`w1a`]), writeFlow([`w2b`]), fanoutFlow([`bc`])],
        },
      },
      {
        short: `Majority`,
        chapter: `solution`,
        title: `The rule: nothing counts without a majority`,
        body: [
          `The fix is one rule. A leader is only elected — and a write only confirmed — when <b>more than half</b> of all nodes agree. With three nodes, that’s two.`,
          `Cut off, A can reach only itself: 1 of 3. It can’t confirm anything, so App Server 1’s writes wait and time out. B and C are 2 of 3: they may elect a leader and carry on. Any two majorities share at least one node, so two leaders can never both win.`,
        ],
        callout: {
          kind: `insight`,
          text: `This is CAP in practice: the minority side gives up availability so that the data stays consistent.`,
        },
        changes: [
          `+ Rule: every decision needs 2 of 3`,
          `~ A alone → can’t confirm writes`,
          `~ B + C → a valid majority`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            a: node(`a`, [{ text: `1 of 3 · can’t commit`, tone: `amber`, icon: `lock` }]),
            b: node(`b`, [leaderTag(2)]),
            c: node(`c`, [followerTag]),
            card: panel(
              `Majority (quorum)`,
              [
                `3 nodes → 2 must agree`,
                `5 nodes → 3 must agree`,
                `= two majorities always overlap`,
                `# so only one side can ever decide`,
              ],
              `scale`,
            ),
          },
          links: { w1a: links.w1a({ fail: 1 }), w2b: links.w2b(), ...partitionLinks(), bc: links.bc() },
          flows: [writeFlow([`w1a`]), writeFlow([`w2b`]), fanoutFlow([`bc`])],
        },
      },
      {
        short: `Election`,
        chapter: `technique`,
        title: `How a leader gets elected`,
        body: [
          `This is the <span class="term">Raft</span> algorithm. A leader sends regular heartbeats. Every follower runs a timer of <em>random</em> length; if it runs out with no heartbeat, that follower becomes a <b>candidate</b>.`,
          `B’s timer fires first. It starts <span class="term">term</span> 2, votes for itself and asks the others. A node gives one vote per term, and only to a candidate whose log is at least as complete as its own. C says yes — 2 of 3 — so B leads term 2.`,
        ],
        callout: {
          kind: `tip`,
          text: `Random timers mean two nodes rarely stand at once. If the vote does split, nobody wins, the timers restart, and the next term settles it — usually within a second.`,
        },
        changes: [
          `+ B: no heartbeat → candidate for term 2`,
          `+ C votes for B`,
          `~ B wins 2 of 3 and starts sending heartbeats`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            a: node(`a`, [{ text: `still on term 1`, tone: `amber`, icon: `clock` }]),
            b: node(`b`, [leaderTag(2)]),
            c: node(`c`, [{ text: `voted for B`, tone: `green`, icon: `check` }]),
            card: panel(
              `Election · term 2`,
              [
                `B: timer fires — no heartbeat`,
                `B: term 1 → 2, votes for itself`,
                `B → C: “vote for me?”`,
                `= C: yes → 2 of 3 → B leads`,
                `# one vote per node per term`,
              ],
              `flag`,
            ),
          },
          links: {
            w1a: links.w1a({ fail: 1 }),
            w2b: links.w2b(),
            ...partitionLinks(),
            bc: links.bc({ heads: `both`, label: `vote for me? · term 2` }),
          },
          flows: [
            writeFlow([`w1a`], 0.5),
            { route: [`bc`], kind: `msg`, rate: 0.7, bounce: !0 },
            { route: [`bc`], kind: `ping`, rate: 0.9 },
          ],
        },
      },
      {
        short: `Commit`,
        chapter: `technique`,
        title: `A write is committed by a majority`,
        body: [
          `Writes follow the same rule. App Server 2 sends <code>seat 7 → Ben</code> to the leader. B appends it to its <span class="term">log</span> and sends it to the followers.`,
          `As soon as a majority has stored the entry — B and C — it is <b>committed</b>. Only then does B apply it and answer “saved”. A committed entry survives any failure that leaves a majority standing.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every node applies the same log entries in the same order, so every node ends up in the same state. That’s a <b>replicated state machine</b> — the idea underneath all of this.`,
        },
        changes: [
          `+ B appends entry 4 to its log`,
          `+ C stores it → 2 of 3`,
          `~ Committed → App Server 2 hears “saved”`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            a: node(`a`, [
              { text: `log 1 2 3 · 4′ Ana, unconfirmed`, tone: `amber`, icon: `listOrdered` },
            ]),
            b: node(`b`, [leaderTag(2), { text: `log 1 2 3 · 4 Ben ✓`, tone: `green`, icon: `listOrdered` }]),
            c: node(`c`, [{ text: `log 1 2 3 · 4 Ben ✓`, tone: `green`, icon: `listOrdered` }]),
          },
          links: {
            w1a: links.w1a({ fail: 1 }),
            w2b: links.w2b(),
            ...partitionLinks(),
            bc: links.bc({ heads: `both`, label: `append entry 4` }),
          },
          flows: [writeFlow([`w1a`], 0.5), writeFlow([`w2b`, `bc`], 0.7)],
        },
      },
      {
        short: `Heal`,
        chapter: `solution`,
        title: `The old leader steps down`,
        body: [
          `The network heals. A — still believing it leads term 1 — receives a heartbeat from B stamped <b>term 2</b>. A higher term always wins: A becomes a follower at once.`,
          `A’s log holds one entry that never reached a majority: Ana’s booking, which App Server 1 was never told had succeeded. A discards it and copies B’s log instead. All three nodes are identical again, and nothing that was confirmed has been lost.`,
        ],
        callout: {
          kind: `tip`,
          text: `Terms are a logical clock. Nobody compares wall-clock times — only “whose term number is higher?”`,
        },
        changes: [
          `+ Network restored`,
          `~ A sees term 2 → steps down`,
          `− A’s unconfirmed entry discarded`,
          `~ A copies the log from B · apps follow the leader`,
        ],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            ...nodes({ a: [{ text: `follower · term 2 · caught up`, tone: `green`, icon: `check` }] }),
          },
          links: { ...baseLinks(), ba: links.ba({ label: `heartbeat · term 2`, labelAt: 0.3 }) },
          flows: [...baseFlows(), fanoutFlow([`ba`, `bc`], `ping`, 0.7)],
        },
      },
      {
        short: `How many`,
        chapter: `insight`,
        title: `How many nodes?`,
        body: [
          `A cluster of <b>N</b> nodes needs ⌊N/2⌋ + 1 votes, so it keeps working with ⌊(N − 1)/2⌋ of them down. Three nodes survive one failure; five survive two.`,
          `A fourth node is a trap: the majority becomes 3, so you still survive only one failure — with one more machine that can fail. Use odd sizes, and put each node in a different zone so one outage can’t take a majority with it.`,
        ],
        callout: {
          kind: `tip`,
          text: `Three or five is typical. Every write waits for more acknowledgements as the cluster grows, so bigger clusters get slower, not safer.`,
        },
        changes: [`+ One node per availability zone`],
        metrics: { leaders: 1, term: 2, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            app2: appServer2(),
            ...nodes({
              a: [{ text: `zone 1`, icon: `building` }],
              b: [leaderTag(2), { text: `zone 2`, icon: `building` }],
              c: [{ text: `zone 3`, icon: `building` }],
            }),
            card: panel(
              `Nodes → majority → can lose`,
              [`3  →  2  →  1`, `! 4  →  3  →  1   no gain`, `5  →  3  →  2`, `7  →  4  →  3`],
              `scale`,
            ),
          },
          links: baseLinks(),
          flows: baseFlows(),
        },
      },
      {
        short: `Zombie`,
        chapter: `problem`,
        title: `Case: the leader that paused`,
        body: [
          `Leader B freezes for twenty seconds — a long garbage-collection pause, or its virtual machine being moved. A and C hear no heartbeats, elect C for term 3, and move on.`,
          `Then B wakes up. As far as it can tell no time has passed, and it is still the leader. Before the next message corrects it, it finishes what it was doing: writing a file to shared storage — straight over the new leader’s work.`,
        ],
        callout: {
          kind: `warn`,
          text: `A node cannot know it was paused. “I checked that I was the leader a moment ago” is never proof that you still are.`,
        },
        changes: [
          `− B freezes for 20 s`,
          `+ A and C elect C · term 3`,
          `− B wakes up and writes as if it still led`,
        ],
        metrics: { leaders: `1 + a zombie`, term: 3, writes: `diverging`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            a: node(`a`, [followerTag]),
            b: node(`b`, [{ text: `awake · thinks it leads term 2`, tone: `red`, icon: `alert` }], {
              heat: 0.5,
            }),
            c: node(`c`, [leaderTag(3)]),
            store: makeDb(0, 19, {
              r: 1.8,
              glyph: `file`,
              color: `store`,
              label: `shared storage`,
              tags: [{ text: `report.csv · overwritten by B`, tone: `red`, icon: `alert` }],
            }),
          },
          links: {
            ...triLinks(),
            sb: makeLink(`b`, `store`, [`b`, [`b`, `store`], `store`], {
              label: `write (stale)`,
              labelTone: `red`,
              labelAt: 0.62,
            }),
            sc: makeLink(`c`, `store`, [`c`, [`c`, `store`], `store`]),
          },
          flows: [
            writeFlow([`w1c`], 0.6),
            fanoutFlow([`ca`], `write`, 0.7),
            { route: [`sc`], kind: `write`, rate: 0.5 },
            { route: [`sb`], kind: `poison`, rate: 0.7 },
          ],
        },
      },
      {
        short: `Fencing`,
        chapter: `solution`,
        title: `Fencing tokens`,
        body: [
          `The fix doesn’t depend on B noticing anything. Every request a leader sends carries its <b>term number</b> as a <span class="term">fencing token</span>, and the storage remembers the highest token it has seen.`,
          `C has already written with token 3. When B’s write arrives carrying token 2, the storage refuses it. The stale leader is fenced off by the resource itself.`,
        ],
        callout: {
          kind: `tip`,
          text: `The same goes for distributed locks: the lock service must hand out an increasing number with each lock, and the protected resource must check it. A lock that only says “it’s yours” is not safe.`,
        },
        changes: [
          `+ Every write carries the leader’s term`,
          `+ Storage rejects tokens older than the newest it has seen`,
          `~ B’s write refused: 2 < 3`,
        ],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            a: node(`a`, [followerTag]),
            b: node(`b`, [{ text: `refused → steps down`, tone: `amber`, icon: `undo` }]),
            c: node(`c`, [leaderTag(3)]),
            store: makeDb(0, 19, {
              r: 1.8,
              glyph: `file`,
              color: `store`,
              label: `shared storage`,
              tags: [{ text: `highest token seen: 3`, tone: `green`, icon: `shield` }],
            }),
          },
          links: {
            ...triLinks(),
            sb: makeLink(`b`, `store`, [`b`, [`b`, `store`], `store`], {
              label: `token 2 ✕`,
              labelTone: `red`,
              labelAt: 0.62,
              fail: 1,
            }),
            sc: makeLink(`c`, `store`, [`c`, [`c`, `store`], `store`], {
              label: `token 3 ✓`,
              labelAt: 0.4,
            }),
          },
          flows: [
            writeFlow([`w1c`], 0.6),
            fanoutFlow([`ca`, `cb`], `write`, 0.7),
            { route: [`sc`], kind: `write`, rate: 0.5 },
            { route: [`sb`], kind: `poison`, rate: 0.7 },
          ],
        },
      },
      {
        short: `The price`,
        chapter: `tradeoff`,
        title: `What consensus costs`,
        body: [
          `Every write waits for a round trip to a majority. Inside one data center that’s a millisecond or two; with nodes in different regions it’s 50–150 ms on <em>every</em> write.`,
          `All writes pass through one leader, so throughput is capped by a single machine. And when no majority can be reached, the cluster accepts no writes at all — on purpose.`,
        ],
        callout: {
          kind: `warn`,
          text: `Consensus buys correctness with latency and availability. Spend it on the small, critical decisions — not on every like and page view.`,
        },
        changes: [
          `~ Each write: + 1 majority round trip`,
          `~ An election pauses writes for about a second`,
        ],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            app1: appServer1(),
            a: node(`a`, [followerTag]),
            b: node(`b`, [followerTag]),
            c: node(`c`, [leaderTag(3), { text: `waits for 1 more ack`, icon: `hourglass` }]),
            card: panel(
              `The bill`,
              [
                `every write: + 1 majority round trip`,
                `one leader → one machine’s throughput`,
                `! no majority → no writes`,
                `# an election pauses writes ≈ 1 s`,
              ],
              `dollar`,
            ),
          },
          links: triLinks(),
          flows: [writeFlow([`w1c`], 0.7), fanoutFlow([`ca`, `cb`], `write`, 0.7, { bounce: !0 })],
        },
      },
      {
        short: `In practice`,
        chapter: `insight`,
        title: `You use it far more than you write it`,
        body: [
          `Almost nobody implements Raft or Paxos themselves. You run a small consensus cluster — <b>etcd</b>, <b>ZooKeeper</b> or <b>Consul</b> — and keep only the critical facts in it: who the leader is, what the configuration says, who holds which lock.`,
          `Everything else leans on it. Kubernetes keeps all its cluster state in etcd. Kafka elects its controllers with Raft. Databases such as CockroachDB, Spanner and MongoDB run consensus inside every shard or replica set to decide failover.`,
        ],
        callout: {
          kind: `insight`,
          text: `When the Replication lesson said “promote the most up-to-date follower”, this is the machinery that makes it safe.`,
        },
        changes: [`+ Three systems that depend on the cluster`],
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: {
            cz: makeZone({ x0: -13.5, x1: 13.5, y0: -8.5, y1: 10.5 }, `CONSENSUS CLUSTER · etcd`),
            a: node(`a`, [followerTag]),
            b: node(`b`, [followerTag]),
            c: node(`c`, [leaderTag(3)]),
            k8s: makeBlock(-12, -12, {
              color: `purple`,
              glyph: `box`,
              label: [`Kubernetes`],
              sub: `cluster state`,
            }),
            dbf: makeBlock(0, -18, {
              color: `orange`,
              glyph: `database`,
              label: [`Database`],
              sub: `who is primary?`,
            }),
            job: makeBlock(14, -16, {
              color: `green`,
              glyph: `clock`,
              label: [`Scheduler`],
              sub: `one runner lock`,
            }),
          },
          links: {
            ca: links.ca(),
            cb: links.cb(),
            u1: makeLink(`k8s`, `b`, [`k8s`, `b-1`], { heads: `both` }),
            u2: makeLink(`dbf`, `a`, [`dbf`, `a`], { heads: `both` }),
            u3: makeLink(`job`, `c`, [`job`, `c+1`], { heads: `both` }),
          },
          flows: [
            {
              routes: [{ path: [`u1`] }, { path: [`u2`] }, { path: [`u3`] }],
              rate: 1.6,
              bounce: !0,
            },
            fanoutFlow([`ca`, `cb`], `write`, 0.6),
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>A timeout can’t tell <b>dead</b> from <b>unreachable</b> — naive failover risks split brain.</li>
          <li><b>Majority rule</b>: elections and writes need more than half the nodes, and two majorities always overlap.</li>
          <li><b>Terms</b> order the leaders: a higher term wins and a stale leader steps down.</li>
          <li>A write is <b>committed</b> once a majority has logged it — never before.</li>
          <li>Run <b>3 or 5</b> nodes across zones, and use <b>fencing tokens</b> for anything outside the log.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Transactions & Isolation</b> — keeping one database correct when many requests change it at once.`,
        },
        metrics: { leaders: 1, term: 3, writes: `ok`, canLose: `1 of 3` },
        scene: {
          entities: { app1: appServer1(), a: node(`a`, [followerTag]), b: node(`b`, [followerTag]), c: node(`c`, [leaderTag(3)]) },
          links: triLinks(),
          flows: [writeFlow([`w1c`], 0.7), fanoutFlow([`ca`, `cb`], `write`, 0.7)],
        },
      },
    ],
  };

export { lesson as consensusLesson };
export default lesson;
