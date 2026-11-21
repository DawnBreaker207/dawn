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

const ho = (e = []) => y(0, -19, { form: `phone`, w: 5, d: 5, label: `mobile app`, tags: e });

const go = (e = {}) =>
    d(0, -7, {
      label: [`REST`, `API`],
      glyph: `globe`,
      tags: [
        { text: `GET /users/42/followers` },
        { text: `GET /users/42/posts` },
        { text: `GET /users/42` },
      ],
      ...e,
    });

const _o = (e = {}) =>
    d(0, -7, { color: `purple`, label: [`GraphQL`], sub: `one endpoint`, glyph: `braces`, ...e });

const vo = (e = {}) => ({
    us: d(-7, 4, {
      color: `green`,
      glyph: `user`,
      label: [`Users`],
      sub: `service`,
      ...(e.us || {}),
    }),
    ps: d(7, 4, {
      color: `yellow`,
      glyph: `file`,
      label: [`Posts`],
      sub: `service`,
      ...(e.ps || {}),
    }),
  });

const yo = (e = {}) => ({ pa: h(`phone`, `api`, [`phone`, `api`], { heads: `both`, ...e }) });

const bo = (e = {}) => ({
    au: h(`api`, `us`, [`api`, [`us`, `api`], `us`], { heads: `both`, ...e }),
    ap: h(`api`, `ps`, [`api`, [`ps`, `api`], `ps`], { heads: `both`, ...e }),
  });

const xo = (e = 0.7, t) => ({
    fanout: !0,
    routes: [{ path: [`pa`, `au`] }, { path: [`pa`, `ap`] }],
    rate: e,
    bounce: !0,
    kind: t,
  });

const So = (e, t, n) => S({ x: 7, y: 4, z: 0, dx: 70, dy: -250 }, e, t, { icon: n });

const Co = { label: `4G · 100 ms per round trip`, labelTone: `amber` };

// --- communication ---
const wo = {
    id: `apis`,
    title: `REST, RPC & GraphQL`,
    summary: `Three ways for programs to ask each other for things — and what each costs a phone on 4G.`,
    minutes: 11,
    level: `beginner`,
    metrics: [`trips`, `payload`, `screenMs`, `unused`],
    legend: [`req`, `res`, `heavy`, `fail`],
    goals: [
      { text: `What an API contract is`, step: 0 },
      { text: `REST: resources and verbs`, step: 1 },
      { text: `GraphQL: ask for exactly what you need`, step: 3 },
      { text: `RPC between internal services`, step: 5 },
      { text: `Pagination and API versioning`, step: 7 },
    ],
    steps: [
      {
        short: `Contract`,
        chapter: `setup`,
        title: `Programs need a contract`,
        body: [
          `Your mobile app shows a profile: name, avatar, the last three posts and a follower count. The data lives on your servers, so the app has to ask for it.`,
          `An <span class="term">API</span> is the agreed way to ask: which addresses exist, what to send, and what comes back. Here it’s JSON over HTTPS.`,
        ],
        callout: {
          kind: `insight`,
          text: `An API is a promise. Once apps depend on it, changing it without breaking them is a real design problem.`,
        },
        metrics: { trips: `—`, payload: `—`, screenMs: null, unused: `—` },
        scene: {
          entities: { phone: ho(), api: go({ tags: [] }) },
          links: yo({ label: `HTTPS + JSON` }),
          flows: [{ route: [`pa`], rate: 0.9, bounce: !0 }],
        },
      },
      {
        short: `REST`,
        chapter: `technique`,
        title: `REST: resources and verbs`,
        body: [
          `<span class="term">REST</span> treats data as <b>resources</b> with addresses — <code>/users/42</code>, <code>/users/42/posts</code> — and uses HTTP verbs on them: <code>GET</code> to read, <code>POST</code> to create, <code>PUT</code>/<code>PATCH</code> to update, <code>DELETE</code> to remove.`,
          `It’s simple, works with every tool, and <code>GET</code> responses can be cached by browsers and CDNs. <code>GET</code>, <code>PUT</code> and <code>DELETE</code> are also <span class="term">idempotent</span> — repeating one changes nothing more — while <code>POST</code> is not, which matters the moment a client retries.`,
        ],
        callout: {
          kind: `tip`,
          text: `Status codes carry meaning too: 200 OK, 201 Created, 404 Not Found, 429 Too Many Requests, 500 server error.`,
        },
        changes: [`+ Three endpoints for the profile screen`],
        metrics: { trips: 3, payload: `48 KB`, screenMs: 210, unused: 94 },
        scene: {
          entities: {
            phone: ho(),
            api: go(),
            card: So(
              `The profile screen, in REST`,
              [
                `GET /users/42           → 18 KB`,
                `GET /users/42/posts     → 26 KB`,
                `GET /users/42/followers →  4 KB`,
                `# three requests, one after another`,
              ],
              `globe`,
            ),
          },
          links: yo({ label: `HTTPS + JSON` }),
          flows: [{ route: [`pa`], rate: 1.6, bounce: !0 }],
        },
      },
      {
        short: `On 4G`,
        chapter: `problem`,
        title: `Chatty and bloated on a phone`,
        body: [
          `On a phone, each round trip costs about 100 ms. The client makes its three calls one after another — often it has to, because one call needs an id from the previous answer — so the screen waits for all three in a row.`,
          `Each endpoint also returns the <em>whole</em> object: 48 KB arrive to show about 3 KB. That’s <span class="term">over-fetching</span>; needing several calls for one screen is <span class="term">under-fetching</span>.`,
        ],
        callout: {
          kind: `warn`,
          text: `Round trips and wasted bytes hurt most where networks are slowest — exactly where mobile users are.`,
        },
        changes: [
          `~ Network: 4G, 100 ms per round trip`,
          `~ Screen ready 210 → 420 ms`,
          `− 94% of downloaded data unused`,
        ],
        metrics: { trips: 3, payload: `48 KB`, screenMs: 420, unused: 94 },
        scene: {
          entities: {
            phone: ho([{ text: `loading…`, tone: `amber`, icon: `hourglass` }]),
            api: go(),
            card: So(
              `What the screen needs`,
              [
                `name, avatar URL           ~0.4 KB`,
                `last 3 posts + previews    ~2.5 KB`,
                `follower count             ~0.1 KB`,
                `! downloaded 48 KB · used ~3 KB`,
              ],
              `smartphone`,
            ),
          },
          links: yo(Co),
          flows: [{ route: [`pa`], rate: 1.6, bounce: !0, speed: 0.6 }],
        },
      },
      {
        short: `GraphQL`,
        chapter: `solution`,
        title: `GraphQL: ask for exactly what you need`,
        body: [
          `With <span class="term">GraphQL</span>, the client sends one query describing the exact shape it wants. The GraphQL server fetches each part from the services behind it and returns just those fields.`,
          `Watch one request leave the phone, split to the Users and Posts services, and come back as one response.`,
        ],
        callout: {
          kind: `tip`,
          text: `Great when many different clients (iOS, Android, web, TV) each need slightly different data from the same backend.`,
        },
        changes: [
          `~ REST API → GraphQL endpoint`,
          `+ Users and Posts services behind it`,
          `~ 3 round trips → 1`,
          `~ 48 KB → 3 KB`,
        ],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 140, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo(),
            card: So(
              `One query`,
              [
                `query {`,
                `  user(id: 42) { name avatar`,
                `    posts(last: 3) { title preview }`,
                `    followers { count } }`,
                `}`,
                `= 1 round trip · 3 KB`,
              ],
              `braces`,
            ),
          },
          links: { ...yo(Co), ...bo() },
          flows: [xo()],
        },
      },
      {
        short: `The catch`,
        chapter: `tradeoff`,
        title: `Flexible queries can be expensive`,
        body: [
          `Clients can ask for <em>anything</em> the schema allows — including followers of followers of followers, with all their posts. One innocent-looking query (the big square) melts the Users service.`,
          `And because queries are normally sent as a <code>POST</code> to a single URL, ordinary HTTP caches and CDNs can’t help without extra work such as persisted queries.`,
        ],
        callout: {
          kind: `warn`,
          text: `Production GraphQL needs query depth and cost limits, and often an allow-list of approved (“persisted”) queries.`,
        },
        changes: [`+ A deeply nested query`, `~ Users service overloaded`],
        metrics: { trips: 1, payload: `2.1 MB`, screenMs: 3800, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo({
              us: { ..._(0.97), tags: [{ text: `41,000 lookups`, tone: `red`, icon: `alert` }] },
            }),
            card: So(
              `A “small” query`,
              [
                `followers {`,
                `  followers {`,
                `    followers { posts { comments } }`,
                `  } }`,
                `! 41,000 database lookups`,
              ],
              `alert`,
            ),
          },
          links: { ...yo(Co), ...bo() },
          flows: [xo(0.5, `heavy`)],
        },
      },
      {
        short: `RPC`,
        chapter: `technique`,
        title: `Inside the data center: RPC`,
        body: [
          `Behind the API, services call each other constantly. Here the usual choice is <span class="term">RPC</span> (remote procedure call): calling a function on another machine as if it were local — today usually <b>gRPC</b>.`,
          `The contract is a typed schema (Protocol Buffers); code for both sides is generated from it, and messages travel as compact binary over HTTP/2.`,
        ],
        callout: {
          kind: `tip`,
          text: `gRPC is fast and strictly typed, and supports streaming — but browsers can’t speak it natively (they need a gRPC-Web proxy), so it mostly stays inside your network.`,
        },
        changes: [`~ API → services: gRPC + protobuf`],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho(),
            api: _o(),
            ...vo({ us: v(0.3), ps: v(0.3) }),
            card: So(
              `A gRPC contract`,
              [
                `service Users {`,
                `  rpc GetUser (UserId) returns (User);`,
                `}`,
                `= binary · typed · a few × smaller than JSON`,
              ],
              `workflow`,
            ),
          },
          links: { ...yo(Co), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Pagination`,
        chapter: `technique`,
        title: `Case: a list with 2 million items`,
        body: [
          `A celebrity’s followers list has 2 million entries. Returning it in one response would mean hundreds of megabytes and a very long wait. APIs return lists in <b>pages</b>.`,
          `<code>?offset=40000&limit=20</code> looks simple, but the database still walks past 40,000 rows. A <span class="term">cursor</span> — “the 20 after id 9f3c” — jumps straight there with an index, and doesn’t skip or repeat items when new ones arrive.`,
        ],
        callout: {
          kind: `tip`,
          text: `Return the cursor for the next page in each response. Clients just pass it back.`,
        },
        changes: [`+ Followers returned 20 at a time`, `~ Cursor-based paging`],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho([{ text: `followers · page 2,001`, icon: `users` }]),
            api: _o(),
            ...vo({
              us: { ...v(0.3), tags: [{ text: `2,000,000 followers`, icon: `users` }] },
              ps: v(0.3),
            }),
            card: So(
              `Paging a long list`,
              [
                `! ?offset=40000&limit=20  → walks 40,020 rows`,
                `= ?after=9f3c&limit=20     → index seek, 20 rows`,
                `# response includes next cursor: "a71b"`,
              ],
              `listOrdered`,
            ),
          },
          links: { ...yo({ label: `GET followers?after=9f3c&limit=20`, labelAt: 0.45 }), ...bo() },
          flows: [{ route: [`pa`, `au`], rate: 1.4, bounce: !0 }],
        },
      },
      {
        short: `Versions`,
        chapter: `problem`,
        title: `Case: renaming a field breaks old apps`,
        body: [
          `A tidy-up renames <code>name</code> to <code>display_name</code>. The new app is fine — but millions of phones still run last year’s version, and their profile screens now crash.`,
          `Mobile apps can’t be forced to update. So APIs evolve <b>additively</b>: add the new field, keep the old one, and only remove it once almost nobody calls it. For truly breaking changes, publish a new version (<code>/v2/</code>) and run both.`,
        ],
        callout: {
          kind: `warn`,
          text: `Once an API is public, every field is a promise. Measure who uses it before you break it.`,
        },
        changes: [
          `− Old app versions crash`,
          `~ Fix: keep name, add display_name`,
          `+ /v2 for breaking changes`,
        ],
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: {
            phone: ho([{ text: `app v3.2 · crashed`, tone: `red`, icon: `alert` }]),
            api: _o({ tags: [{ text: `name → display_name`, tone: `amber`, icon: `replay` }] }),
            ...vo({ us: v(0.3), ps: v(0.3) }),
            card: So(
              `Evolving safely`,
              [
                `! remove or rename a field   → old apps break`,
                `= add a field                → nothing breaks`,
                `= deprecate, measure, remove later`,
                `# breaking change? → /v2 alongside /v1`,
              ],
              `layers`,
            ),
          },
          links: { ...yo({ fail: 0.5 }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Choosing`,
        chapter: `insight`,
        title: `Which one, where?`,
        body: [
          `<table class="compare">
          <thead><tr><th></th><th>Best for</th><th>Watch out</th></tr></thead>
          <tbody>
            <tr><td><b>REST</b></td><td>Public APIs, simple CRUD, caching</td><td>Many calls per screen</td></tr>
            <tr><td><b>GraphQL</b></td><td>Many clients, varied screens</td><td>Costly queries, caching</td></tr>
            <tr><td><b>gRPC</b></td><td>Service-to-service</td><td>Not for browsers</td></tr>
          </tbody>
        </table>`,
          `They mix happily: REST or GraphQL at the edge for clients, gRPC between services inside.`,
        ],
        callout: {
          kind: `insight`,
          text: `Whatever the style, version your API and never break existing clients — add fields, don’t rename or remove them.`,
        },
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: { phone: ho(), api: _o(), ...vo({ us: v(0.3), ps: v(0.3) }) },
          links: { ...yo({ label: `GraphQL` }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Recap`,
        body: [
          `<ul class="takeaways">
          <li>An <b>API</b> is a contract between programs.</li>
          <li><b>REST</b>: resources + HTTP verbs; simple and cacheable, but chatty for rich screens.</li>
          <li><b>GraphQL</b>: one query, exact fields; guard against expensive queries.</li>
          <li><b>gRPC</b>: fast, typed calls between internal services.</li>
          <li>Page long lists with <b>cursors</b>; evolve APIs <b>additively</b>.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Message Queues</b> — for work that shouldn’t make anyone wait for an answer.`,
        },
        metrics: { trips: 1, payload: `3 KB`, screenMs: 130, unused: 0 },
        scene: {
          entities: { phone: ho(), api: _o(), ...vo({ us: v(0.3), ps: v(0.3) }) },
          links: { ...yo({ label: `GraphQL` }), ...bo({ label: `gRPC` }) },
          flows: [xo(0.9)],
        },
      },
    ],
  };

export { wo as apisLesson };
export default wo;
