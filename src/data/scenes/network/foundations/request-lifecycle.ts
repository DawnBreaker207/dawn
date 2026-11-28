import {
  CACHED_DNS_LINK,
  LINK_TEMPLATES,
  URL_TAG,
  makeDatabase,
  makeDevice,
  makeDns,
  makePanel,
  makeUser,
  makeWebServer
} from '@/lib/simulator/scene-builders';

/* eslint-disable */
export const requestLifecycleLesson = {
    id: `request-lifecycle`,
    title: `How a Request Travels`,
    summary: `Follow one page load hop by hop — and find out where the time really goes.`,
    minutes: 10,
    level: `beginner`,
    metrics: [`dns`, `connect`, `request`, `download`, `total`],
    legend: [`req`, `res`, [`ping`, `handshake`]],
    goals: [
      { text: `What DNS does and why it is cached`, step: 1 },
      { text: `Why a connection costs round trips`, step: 2 },
      { text: 'The path: browser → server', step: 4 },
      { text: `Where page-load time actually goes`, step: 6 },
      { text: `Cases: a slow query and a distant user`, step: 8 },
    ],
    steps: [
      {
        short: `Hit Enter`,
        chapter: `problem`,
        title: `Users say the shop feels slow`,
        body: [
          `Before you can make something faster, you need to know where the time goes. So let’s follow a single page load.`,
          `You type <code>shop.example</code> and press Enter. About a sixth of a second later the page appears. A lot happens in between.`,
        ],
        callout: {
          kind: `insight`,
          text: `Every web request is a conversation between machines. Each step costs time, and the costs add up.`,
        },
        metrics: { dns: null, connect: null, request: null, download: null, total: null },
        scene: { entities: { dev: makeUser([URL_TAG]) }, links: {}, flows: [] },
      },
      {
        short: `Find address`,
        chapter: `technique`,
        title: `Find the address (DNS)`,
        body: [
          `Networks route by numeric IP address, not by name. So the browser first asks a <span class="term">DNS</span> resolver: <em>where is shop.example?</em>`,
          `The answer — <code>203.0.113.7</code> — comes back in about 20 ms.`,
        ],
        callout: {
          kind: `tip`,
          text: `Answers are cached for a time-to-live (TTL). For the next few minutes, repeat visits skip this step entirely.`,
        },
        changes: [`+ DNS resolver`, `+ Lookup: 20 ms`],
        metrics: { dns: 20, connect: null, request: null, download: null, total: 20 },
        scene: {
          entities: {
            dev: makeUser([URL_TAG]),
            dns: makeDns({ tags: [{ text: `→ 203.0.113.7`, tone: `amber` }] }),
          },
          links: { q: LINK_TEMPLATES.dns() },
          flows: [{ route: [`q`], bounce: !0, rate: 0.8 }],
        },
      },
      {
        short: `Connect`,
        chapter: `technique`,
        title: `Open a connection`,
        body: [
          `Now the browser opens a connection to <code>203.0.113.7</code>. A TCP handshake agrees to talk; a TLS handshake sets up encryption. Each needs a <span class="term">round trip</span> — there and back.`,
          `Here a round trip takes 30 ms, so connecting costs 60 ms before a single byte of the page is requested.`,
        ],
        callout: {
          kind: `insight`,
          text: `Round-trip time (RTT) is set by distance and the network, not by how fast your server is.`,
        },
        changes: [`+ Web server`, `~ DNS answer cached`, `+ Handshake: 2 round trips = 60 ms`],
        metrics: { dns: 20, connect: 60, request: null, download: null, total: 80 },
        scene: {
          entities: { dev: makeUser([URL_TAG]), dns: makeDns({ tags: [{ text: `→ 203.0.113.7`, tone: `amber` }] }), web: makeWebServer() },
          links: { q: CACHED_DNS_LINK, h: LINK_TEMPLATES.web({ label: `TCP + TLS handshake` }) },
          flows: [{ route: [`h`], kind: `ping`, bounce: !0, rate: 1.3 }],
        },
      },
      {
        short: `Request`,
        chapter: `technique`,
        title: `Send the request`,
        body: [
          `Over the open connection the browser sends <code>GET /products</code>. The server parses it, checks the session and runs your code.`,
          `That costs one more round trip plus ~10 ms of server work.`,
        ],
        changes: [`+ Request: 1 round trip + 10 ms server time`],
        metrics: { dns: 20, connect: 60, request: 40, download: null, total: 120 },
        scene: {
          entities: { dev: makeUser([URL_TAG]), dns: makeDns(), web: makeWebServer({ cpu: 0.3 }) },
          links: { q: CACHED_DNS_LINK, h: LINK_TEMPLATES.web({ label: `GET /products` }) },
          flows: [{ route: [`h`], bounce: !0, rate: 0.9 }],
        },
      },
      {
        short: `Fetch data`,
        chapter: `technique`,
        title: `The server asks the database`,
        body: [
          `The products don’t live in the web server — they live in a <span class="term">database</span>. The server sends a query and waits for the rows to come back.`,
          `Watch a request travel all the way in and the response all the way out.`,
        ],
        callout: {
          kind: `tip`,
          text: `Keeping the server stateless and the data in a database is what later lets us run many servers. (See Scaling.)`,
        },
        changes: [`+ Database`, `+ Query: 15 ms`],
        metrics: { dns: 20, connect: 60, request: 55, download: null, total: 135 },
        scene: {
          entities: { dev: makeUser([URL_TAG]), dns: makeDns(), web: makeWebServer({ cpu: 0.3 }), db: makeDatabase() },
          links: { q: CACHED_DNS_LINK, h: LINK_TEMPLATES.web({ label: `GET /products` }), s: LINK_TEMPLATES.db() },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9 }],
        },
      },
      {
        short: `Response`,
        chapter: `solution`,
        title: `The response comes home`,
        body: [
          `The server turns rows into HTML and sends it back; downloading it takes another 20 ms. The browser renders the page — <b>155 ms</b> after you pressed Enter.`,
          `Then it notices images and stylesheets in the page and fires off more requests. Reusing the open connection saves them the handshake.`,
        ],
        changes: [`+ Download: 20 ms`, `~ Page ready after 155 ms`],
        metrics: { dns: 20, connect: 60, request: 55, download: 20, total: 155 },
        scene: {
          entities: {
            dev: makeUser([{ text: `page ready · 155 ms`, tone: `green`, icon: `check` }]),
            dns: makeDns(),
            web: makeWebServer({ cpu: 0.3 }),
            db: makeDatabase(),
          },
          links: { q: CACHED_DNS_LINK, h: LINK_TEMPLATES.web({ label: `HTML · 120 KB` }), s: LINK_TEMPLATES.db() },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 1.1 }],
        },
      },
      {
        short: `More files`,
        chapter: `technique`,
        title: `One page, forty more requests`,
        body: [
          `The HTML is only the start. It references images, stylesheets, scripts and fonts — about <b>40 more files</b> — and the browser fetches them all.`,
          `With old HTTP/1.1 each connection carried one request at a time, so browsers opened ~6 connections and queued the rest. <span class="term">HTTP/2</span> sends them all at once over the single connection we already opened.`,
        ],
        callout: {
          kind: `tip`,
          text: `Fewer, smaller files still help: bundle scripts, compress text (gzip/brotli), use modern image formats, and lazy-load what’s below the fold.`,
        },
        changes: [
          `+ 40 more requests: images, CSS, JS, fonts`,
          `~ All multiplexed over one HTTP/2 connection`,
          `~ Fully loaded after 275 ms`,
        ],
        metrics: { dns: 20, connect: 60, request: 55, download: 140, total: 275 },
        scene: {
          entities: {
            dev: makeUser([{ text: `40 files · 1 connection`, tone: `violet`, icon: `layers` }]),
            dns: makeDns(),
            web: makeWebServer({ cpu: 0.35 }),
            db: makeDatabase(),
          },
          links: { q: CACHED_DNS_LINK, h: LINK_TEMPLATES.web({ label: `HTTP/2 · many requests at once` }), s: LINK_TEMPLATES.db() },
          flows: [{ route: [`h`], bounce: !0, rate: 4.2, speed: 1.2 }],
        },
      },
      {
        short: `Slow query`,
        chapter: `problem`,
        title: `Case: one slow query`,
        body: [
          `A new “recommended for you” box ships. Its query sorts every product by a score on each page view, and the database now takes <b>400 ms</b> to answer.`,
          `Same network, same handshakes — but the page jumps from 155 ms to over half a second. Watch requests wait at the database.`,
        ],
        callout: {
          kind: `insight`,
          text: `Measure before optimising. Here the network is fine; the fix is in the database (see the Indexes lesson).`,
        },
        changes: [
          `+ “Recommended” query on every page`,
          `~ Database time 15 → 400 ms`,
          `~ Total 155 → 540 ms`,
        ],
        metrics: { dns: 20, connect: 60, request: 440, download: 20, total: 540 },
        scene: {
          entities: {
            dev: makeUser([URL_TAG]),
            dns: makeDns(),
            web: makeWebServer({ cpu: 0.3 }),
            db: makeDatabase({
              heat: 0.7,
              tags: [{ text: `400 ms · scanning`, tone: `red`, icon: `hourglass` }],
            }),
          },
          links: {
            q: CACHED_DNS_LINK,
            h: LINK_TEMPLATES.web({ label: `GET /products` }),
            s: LINK_TEMPLATES.db({ label: `ORDER BY score · 400 ms`, labelTone: `red` }),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.6, hold: 1.4 }],
        },
      },
      {
        short: `Far away`,
        chapter: `problem`,
        title: `Case: a user in Sydney`,
        body: [
          `Back to the fast query. Now the same page is opened in Sydney, while the server is in Virginia: every round trip takes about <b>200 ms</b> instead of 30.`,
          `Two handshake round trips plus the request round trip cost 600 ms before the page even downloads. Same server, same code — over 4× slower.`,
        ],
        callout: {
          kind: `tip`,
          text: `Cut round trips (TLS 1.3, HTTP/3, keep connections open) and move content closer to users (CDNs, regions — Module 02).`,
        },
        changes: [
          `~ User in Sydney · 200 ms per round trip`,
          `~ Connect 60 → 400 ms`,
          `~ Total 155 → 705 ms`,
        ],
        metrics: { dns: 20, connect: 400, request: 225, download: 60, total: 705 },
        scene: {
          entities: {
            dev: makeDevice(0, -16, { label: `you · Sydney`, tags: [URL_TAG] }),
            dns: makeDns(),
            web: makeWebServer({ tags: [{ text: `Virginia`, icon: `globe` }] }),
            db: makeDatabase(),
          },
          links: {
            q: CACHED_DNS_LINK,
            h: LINK_TEMPLATES.web({ label: `≈ 200 ms per round trip`, labelTone: `amber` }),
            s: LINK_TEMPLATES.db(),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9, speed: 0.55 }],
        },
      },
      {
        short: `Recap`,
        chapter: `recap`,
        title: `Where the time went`,
        body: [
          `Of 155 ms, only about 25 ms was the server and database actually working. The other <b>~130 ms</b> was messages crossing the network.`,
          `<ul class="takeaways">
          <li><b>DNS</b> turns names into addresses; answers are cached.</li>
          <li>Connections cost <b>round trips</b> — reuse them.</li>
          <li>Server code is often the smallest slice of latency — unless a <b>slow query</b> sneaks in.</li>
          <li><b>Distance</b> multiplies every round trip.</li>
        </ul>`,
        ],
        callout: {
          kind: `next`,
          text: `Next up: <b>Latency & Throughput</b> — what happens to that 155 ms when thousands of users arrive at once.`,
        },
        metrics: { dns: 20, connect: 60, request: 55, download: 20, total: 155 },
        scene: {
          entities: {
            dev: makeUser([{ text: `page ready · 155 ms`, tone: `green`, icon: `check` }]),
            dns: makeDns(),
            web: makeWebServer(),
            db: makeDatabase(),
            card: makePanel({ x: -2, y: 14 }, 'cURL Production Trace (155ms)', [
              '$ curl -w "@format.txt" -o /dev/null -s https://shop.example',
              'time_namelookup:    0.020s (DNS)',
              'time_connect:       0.040s (TCP SYN/ACK)',
              'time_appconnect:    0.060s (TLS 1.3)',
              'time_starttransfer: 0.115s (TTFB)',
              'time_total:         0.155s',
            ], { icon: 'timer' }),
          },
          links: {
            q: LINK_TEMPLATES.dns({ label: `20 ms`, style: `off` }),
            h: LINK_TEMPLATES.web({ label: `60 + 55 + 20 ms` }),
            s: LINK_TEMPLATES.db({ label: `15 ms` }),
          },
          flows: [{ route: [`h`, `s`], bounce: !0, rate: 0.9 }],
        },
      },
    ],
  };

export default requestLifecycleLesson;
