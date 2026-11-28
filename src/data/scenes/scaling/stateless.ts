import { DEAD_STATE, makeBalancer, makeBlock, makeDb, makeDevice, makeLink, type Bag, type Tag } from '@/lib/simulator/scene-builders';

const sessionTag = { text: `session: Alice · cart 2`, tone: `violet`, icon: `user` };

const $e = { text: `no session for Alice`, tone: `red`, icon: `alert` };

const alice = (e: Tag[] = [{ text: `cart: 2 items`, icon: `check` }]) => makeDevice(0, -19, { label: `Alice`, tags: e });

const loadBalancer = (e: Tag[] = []) => makeBalancer(0, -9, { tags: e });

const servers = (e: Bag = {}) => ({
    a: makeBlock(-7, 0, { label: [`Server A`], ...(e.a || {}) }),
    b: makeBlock(0, 0, { label: [`Server B`], ...(e.b || {}) }),
    c: makeBlock(7, 0, { label: [`Server C`], ...(e.c || {}) }),
  });

const sessionStore = (e = [{ text: `Alice · cart 2`, tone: `violet`, icon: `user` }]) =>
    makeDb(0, 10, { glyph: `zap`, label: `session store`, tags: e });

const userLink = { ul: makeLink(`alice`, `lb`, [`alice`, `lb`], { heads: `both` }) };

const serverLinks = (e: Bag = {}) => ({
    la: makeLink(`lb`, `a`, [`lb`, [`a`, `lb`], `a`], e.a),
    lbb: makeLink(`lb`, `b`, [`lb`, `b`], e.b),
    lc: makeLink(`lb`, `c`, [`lb`, [`c`, `lb`], `c`], e.c),
  });

const sessionLinks = {
    as: makeLink(`a`, `st`, [`a`, [`a`, `st`], `st`], { heads: `both` }),
    bs: makeLink(`b`, `st`, [`b`, `st`], { heads: `both` }),
    cs: makeLink(`c`, `st`, [`c`, [`c`, `st`], `st`], { heads: `both` }),
  };

const requestFlows = (e: string[][], t = 1.5) => [{ routes: e.map((e) => ({ path: e })), rate: t, bounce: !0, kind: `mine` }];

export const statelessLesson = {
    id: `stateless`,
    title: `Stateless Services`,
    summary: `Why the next request must work on any server — and where the state goes instead.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`ok`, `survive`, `scale`, `extra`],
    legend: [`mine`, `res`, `write`, `fail`],
    goals: [
      { text: 'What “state” is, and why', step: 1 },
      { text: `Sticky sessions — and how they break`, step: 3 },
      { text: 'A shared session store makes', step: 5 },
      { text: `Carrying state in signed tokens`, step: 6 },
      { text: `Files belong in object storage`, step: 8 },
    ],
    steps: [
      {
        short: `Logged in`,
        chapter: `setup`,
        title: `Alice logs in`,
        body: [
          `Alice signs in and adds two things to her cart. Her request happened to land on Server A, which keeps a <span class="term">session</span> in its memory: who she is and what’s in her cart.`,
          `Her browser holds a cookie with the session id, so later requests can find it again.`,
        ],
        callout: {
          kind: `insight`,
          text: `<b>State</b> is anything a server remembers between requests: logins, carts, half-finished uploads.`,
        },
        metrics: { ok: `1 / 1`, survive: `—`, scale: `—`, extra: `+0 ms` },
        scene: {
          entities: { alice: alice(), lb: loadBalancer(), ...servers({ a: { tags: [sessionTag] } }) },
          links: { ...userLink, ...serverLinks() },
          flows: requestFlows([[`ul`, `la`]], 1),
        },
      },
      {
        short: `Logged out`,
        chapter: `problem`,
        title: `Her next request lands elsewhere`,
        body: [
          `The load balancer is doing its job — round robin sends Alice’s next requests to B and then C. Neither has ever heard of her.`,
          `To Alice the app is broken: one page shows her cart, the next asks her to sign in again.`,
        ],
        callout: {
          kind: `warn`,
          text: `If a server keeps state in memory, every other server is useless for that user.`,
        },
        changes: [`~ Requests 2 and 3 go to B and C`, `− “Please sign in again”`],
        metrics: { ok: `1 / 3`, survive: `no`, scale: `no`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice(),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({ a: { tags: [sessionTag] }, b: { tags: [$e] }, c: { tags: [$e] } }),
          },
          links: { ...userLink, ...serverLinks({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: requestFlows([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Sticky`,
        chapter: `solution`,
        title: `Fix 1: sticky sessions`,
        body: [
          `Tell the load balancer to remember where each user started — usually with a cookie — and keep sending them there. Alice always reaches A, so she stays signed in.`,
          `Quick to switch on, and no code changes.`,
        ],
        callout: {
          kind: `warn`,
          text: `Sticky users can’t be moved. If many of them pile onto one server, it stays overloaded while others idle.`,
        },
        changes: [`~ LB pins Alice → Server A`, `~ All her requests succeed`],
        metrics: { ok: `3 / 3`, survive: `no`, scale: `limited`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice(),
            lb: loadBalancer([{ text: `sticky: Alice → A`, icon: `user` }]),
            ...servers({ a: { tags: [sessionTag] } }),
          },
          links: { ...userLink, ...serverLinks() },
          flows: requestFlows([[`ul`, `la`]]),
        },
      },
      {
        short: `A dies`,
        chapter: `problem`,
        title: `…until Server A dies`,
        body: [
          `Server A crashes. The load balancer does the right thing and moves Alice to B — but her session died with A’s memory.`,
          `She’s signed out and her cart is empty. Every user pinned to A just had the same experience.`,
        ],
        callout: {
          kind: `warn`,
          text: `Sticky sessions turn every server into a small single point of failure for its users.`,
        },
        changes: [`− Server A down`, `− Alice’s session lost`, `~ Cart 2 items → empty`],
        metrics: { ok: `0 / 3`, survive: `no`, scale: `limited`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice([{ text: `signed out · cart empty`, tone: `red`, icon: `alert` }]),
            lb: loadBalancer([{ text: `sticky: Alice → B`, icon: `user` }]),
            ...servers({ a: DEAD_STATE, b: { tags: [$e] } }),
          },
          links: { ...userLink, ...serverLinks({ a: { style: `off` }, b: { fail: 1 } }) },
          flows: requestFlows([[`ul`, `lbb`]]),
        },
      },
      {
        short: `Shared store`,
        chapter: `solution`,
        title: `Fix 2: move the state out`,
        body: [
          `Keep sessions in a shared, fast <span class="term">session store</span> (often Redis). Every server reads Alice’s session from it, so any server can handle any request.`,
          `The servers are now <span class="term">stateless</span>: they remember nothing between requests. Round robin is back, and she stays signed in.`,
        ],
        callout: {
          kind: `tip`,
          text: `The cost: one extra hop of about a millisecond per request — cheap, for servers you can add, remove or lose freely.`,
        },
        changes: [`+ Session store`, `~ Servers keep nothing in memory`, `~ Round robin again`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: alice(),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: sessionStore(),
          },
          links: { ...userLink, ...serverLinks(), ...sessionLinks },
          flows: requestFlows([
            [`ul`, `la`, `as`],
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
      {
        short: `Lose one`,
        chapter: `insight`,
        title: `Now losing a server is a non-event`,
        body: [
          `Server A dies again. The load balancer routes around it, B and C read the same session from the store, and Alice doesn’t notice.`,
          `This is what makes autoscaling possible: servers can be created and destroyed at any moment.`,
        ],
        callout: {
          kind: `insight`,
          text: `Stateless servers are cattle, not pets — any one of them can be replaced without anyone noticing.`,
        },
        changes: [`− Server A down`, `~ Alice still signed in, cart intact`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: alice(),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: DEAD_STATE,
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: sessionStore(),
          },
          links: { ...userLink, ...serverLinks({ a: { style: `off` } }), ...sessionLinks },
          flows: requestFlows([
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
      {
        short: `Tokens`,
        chapter: `technique`,
        title: `Or: let the request carry it`,
        body: [
          `Another option is to put the state in the request itself: a signed <span class="term">token</span> (such as a JWT) that says “this is Alice”. Any server can verify the signature without looking anything up.`,
          `No store and no extra hop — but a token can’t easily be cancelled before it expires, and it travels with every request, so keep it small.`,
        ],
        callout: {
          kind: `tip`,
          text: `Common split: tokens for identity, a shared store for anything big or that must change instantly (carts, revoked logins).`,
        },
        changes: [`− Session store`, `+ Signed token in each request`, `~ Extra hop gone`],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice([{ text: `signed token: Alice`, tone: `violet`, icon: `lock` }]),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
          },
          links: { ...userLink, ...serverLinks() },
          flows: requestFlows([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Uploads`,
        chapter: `problem`,
        title: `Case: files on a local disk`,
        body: [
          `Alice uploads a new avatar. Server A saves <code>avatar.png</code> to its own disk and shows it — perfect.`,
          `Her next page loads from Server B, which has no such file: a broken image. Files are state too.`,
        ],
        callout: {
          kind: `warn`,
          text: `Anything written to a server’s local disk — uploads, generated PDFs, temp files — disappears for every other server, and for good when the server is replaced.`,
        },
        changes: [`+ Avatar saved on Server A’s disk`, `− Broken image when served by B or C`],
        metrics: { ok: `1 / 3`, survive: `no`, scale: `no`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice([{ text: `avatar: broken image`, tone: `red`, icon: `alert` }]),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: { tags: [{ text: `avatar.png on local disk`, tone: `violet`, icon: `file` }] },
              b: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
              c: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
            }),
          },
          links: { ...userLink, ...serverLinks({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: requestFlows([
            [`ul`, `la`],
            [`ul`, `lbb`],
            [`ul`, `lc`],
          ]),
        },
      },
      {
        short: `Object store`,
        chapter: `solution`,
        title: `Put files in object storage`,
        body: [
          `Store files in shared <span class="term">object storage</span> (Amazon S3, Google Cloud Storage, Azure Blob): effectively unlimited, durable, and reachable from every server.`,
          `Server A writes the avatar there (dark square); B and C read the same file. Better still, browsers fetch images straight from storage through a CDN.`,
        ],
        callout: {
          kind: `tip`,
          text: `Rule of thumb: servers keep nothing that must outlive the request. Sessions → a store or token; files → object storage; data → the database.`,
        },
        changes: [
          `+ Object storage`,
          `~ Uploads written to storage, not local disk`,
          `~ Every server sees every file`,
        ],
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+0 ms` },
        scene: {
          entities: {
            alice: alice([{ text: `avatar ✓`, tone: `green`, icon: `check` }]),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            os: makeDb(0, 10, {
              glyph: `box`,
              label: `object storage`,
              tags: [{ text: `avatar.png`, tone: `violet`, icon: `file` }],
            }),
          },
          links: {
            ...userLink,
            ...serverLinks(),
            ao: makeLink(`a`, `os`, [`a`, [`a`, `os`], `os`], { heads: `both` }),
            bo: makeLink(`b`, `os`, [`b`, `os`], { heads: `both` }),
            co: makeLink(`c`, `os`, [`c`, [`c`, `os`], `os`], { heads: `both` }),
          },
          flows: [
            ...requestFlows([
              [`ul`, `la`, `ao`],
              [`ul`, `lbb`, `bo`],
              [`ul`, `lc`, `co`],
            ]),
            { route: [`ao`], kind: `write`, rate: 0.5 },
          ],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>State kept in a server’s memory <b>pins users</b> to that server.</li>
          <li><b>Sticky sessions</b> hide the problem until a server dies.</li>
          <li>Move state to a <b>shared store</b>, or carry it in a <b>signed token</b>.</li>
          <li>Files go to <b>object storage</b>, never a server’s local disk.</li>
          <li><b>Stateless</b> servers can be added, removed and lost freely.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Caching</b> — the database behind all these stateless servers is about to become the bottleneck.`,
        },
        metrics: { ok: `3 / 3`, survive: `yes`, scale: `yes`, extra: `+1 ms` },
        scene: {
          entities: {
            alice: alice(),
            lb: loadBalancer([{ text: `round robin`, icon: `replay` }]),
            ...servers({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: sessionStore(),
          },
          links: { ...userLink, ...serverLinks(), ...sessionLinks },
          flows: requestFlows([
            [`ul`, `la`, `as`],
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
    ],
  };

export default statelessLesson;
