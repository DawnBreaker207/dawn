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

const Qe = { text: `session: Alice · cart 2`, tone: `violet`, icon: `user` };

const $e = { text: `no session for Alice`, tone: `red`, icon: `alert` };

const et = (e = [{ text: `cart: 2 items`, icon: `check` }]) => y(0, -19, { label: `Alice`, tags: e });

const tt = (e = []) => f(0, -9, { tags: e });

const nt = (e = {}) => ({
    a: d(-7, 0, { label: [`Server A`], ...(e.a || {}) }),
    b: d(0, 0, { label: [`Server B`], ...(e.b || {}) }),
    c: d(7, 0, { label: [`Server C`], ...(e.c || {}) }),
  });

const rt = (e = [{ text: `Alice · cart 2`, tone: `violet`, icon: `user` }]) =>
    b(0, 10, { glyph: `zap`, label: `session store`, tags: e });

const it = { ul: h(`alice`, `lb`, [`alice`, `lb`], { heads: `both` }) };

const at = (e = {}) => ({
    la: h(`lb`, `a`, [`lb`, [`a`, `lb`], `a`], e.a),
    lbb: h(`lb`, `b`, [`lb`, `b`], e.b),
    lc: h(`lb`, `c`, [`lb`, [`c`, `lb`], `c`], e.c),
  });

const ot = {
    as: h(`a`, `st`, [`a`, [`a`, `st`], `st`], { heads: `both` }),
    bs: h(`b`, `st`, [`b`, `st`], { heads: `both` }),
    cs: h(`c`, `st`, [`c`, [`c`, `st`], `st`], { heads: `both` }),
  };

const st = (e, t = 1.5) => [{ routes: e.map((e) => ({ path: e })), rate: t, bounce: !0, kind: `mine` }];

export const statelessLesson = {
    id: `stateless`,
    title: `Stateless Services`,
    summary: `Why the next request must work on any server — and where the state goes instead.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`ok`, `survive`, `scale`, `extra`],
    legend: [`mine`, `res`, `write`, `fail`],
    goals: [
      { text: `What “state” is, and why it pins users to a server`, step: 1 },
      { text: `Sticky sessions — and how they break`, step: 3 },
      { text: `A shared session store makes servers interchangeable`, step: 5 },
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
          entities: { alice: et(), lb: tt(), ...nt({ a: { tags: [Qe] } }) },
          links: { ...it, ...at() },
          flows: st([[`ul`, `la`]], 1),
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
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({ a: { tags: [Qe] }, b: { tags: [$e] }, c: { tags: [$e] } }),
          },
          links: { ...it, ...at({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: st([
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
            alice: et(),
            lb: tt([{ text: `sticky: Alice → A`, icon: `user` }]),
            ...nt({ a: { tags: [Qe] } }),
          },
          links: { ...it, ...at() },
          flows: st([[`ul`, `la`]]),
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
            alice: et([{ text: `signed out · cart empty`, tone: `red`, icon: `alert` }]),
            lb: tt([{ text: `sticky: Alice → B`, icon: `user` }]),
            ...nt({ a: g, b: { tags: [$e] } }),
          },
          links: { ...it, ...at({ a: { style: `off` }, b: { fail: 1 } }) },
          flows: st([[`ul`, `lbb`]]),
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
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at(), ...ot },
          flows: st([
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
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: g,
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at({ a: { style: `off` } }), ...ot },
          flows: st([
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
            alice: et([{ text: `signed token: Alice`, tone: `violet`, icon: `lock` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
          },
          links: { ...it, ...at() },
          flows: st([
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
            alice: et([{ text: `avatar: broken image`, tone: `red`, icon: `alert` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `avatar.png on local disk`, tone: `violet`, icon: `file` }] },
              b: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
              c: { tags: [{ text: `avatar.png?`, tone: `red`, icon: `alert` }] },
            }),
          },
          links: { ...it, ...at({ b: { fail: 1 }, c: { fail: 1 } }) },
          flows: st([
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
            alice: et([{ text: `avatar ✓`, tone: `green`, icon: `check` }]),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            os: b(0, 10, {
              glyph: `box`,
              label: `object storage`,
              tags: [{ text: `avatar.png`, tone: `violet`, icon: `file` }],
            }),
          },
          links: {
            ...it,
            ...at(),
            ao: h(`a`, `os`, [`a`, [`a`, `os`], `os`], { heads: `both` }),
            bo: h(`b`, `os`, [`b`, `os`], { heads: `both` }),
            co: h(`c`, `os`, [`c`, [`c`, `os`], `os`], { heads: `both` }),
          },
          flows: [
            ...st([
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
            alice: et(),
            lb: tt([{ text: `round robin`, icon: `replay` }]),
            ...nt({
              a: { tags: [{ text: `stateless` }] },
              b: { tags: [{ text: `stateless` }] },
              c: { tags: [{ text: `stateless` }] },
            }),
            st: rt(),
          },
          links: { ...it, ...at(), ...ot },
          flows: st([
            [`ul`, `la`, `as`],
            [`ul`, `lbb`, `bs`],
            [`ul`, `lc`, `cs`],
          ]),
        },
      },
    ],
  };

export default statelessLesson;
