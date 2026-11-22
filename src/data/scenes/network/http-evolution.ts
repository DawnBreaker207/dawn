// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const httpEvolutionLesson = {
  id: 'http-evolution',
  title: 'Evolution of HTTP: HTTP/1.1 → HTTP/2 → HTTP/3 QUIC',
  summary: 'Follow the protocol evolution: from text-based head-of-line blocking to binary multiplexing and UDP-based QUIC independent streams.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['http_version', 'transport', 'multiplexing', 'hol_blocking', 'conn_migration'],
  legend: ['req', 'res', ['ping', 'frame transfer'], 'fail'],
  goals: [
    { text: 'HTTP/1.1 connection limits and application Head-of-Line blocking', step: 1 },
    { text: 'HTTP/2 binary framing and multiplexed streams', step: 3 },
    { text: 'HPACK static and dynamic header compression', step: 4 },
    { text: 'Why packet loss stalls all streams in HTTP/2 TCP', step: 5 },
    { text: 'HTTP/3 QUIC over UDP and zero-RTT connection migration', step: 6 },
  ],
  steps: [
    {
      short: 'HTTP/1.0',
      chapter: 'setup',
      title: 'HTTP/1.0: New TCP Connection for Every Asset',
      body: [
        'In the original HTTP/1.0 protocol, fetching each HTML, image, and stylesheet required opening a brand-new TCP connection.',
        'Each asset paid the 3-way handshake penalty and Slow Start congestion window penalty, creating crippling latency on asset-heavy pages.'
      ],
      callout: {
        kind: 'insight',
        text: 'A page with 50 images triggered 50 sequential TCP handshakes.'
      },
      metrics: { http_version: 'HTTP/1.0', transport: 'TCP (Ephemeral)', multiplexing: 'None', hol_blocking: 'High', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Browser', tags: [{ text: '50 assets to fetch', icon: 'layers' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Web Server', 'HTTP/1.0'], sub: '1 Conn per Object' }),
          card: S({ x: -2, y: 14 }, 'HTTP/1.0 Connection Overhead', [
            'Asset 1 (index.html): [SYN -> SYN-ACK -> ACK] -> GET -> [FIN]',
            'Asset 2 (style.css):   [SYN -> SYN-ACK -> ACK] -> GET -> [FIN]',
            'Asset 3 (hero.png):    [SYN -> SYN-ACK -> ACK] -> GET -> [FIN]',
            'Result: Massive RTT waste & ephemeral port exhaustion'
          ], { icon: 'network' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'Single-Asset Conns' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 1.6 }]
      }
    },
    {
      short: 'HTTP/1.1 HoL',
      chapter: 'problem',
      title: 'HTTP/1.1 Keep-Alive & Application Head-of-Line Blocking',
      body: [
        'HTTP/1.1 introduced <code>Connection: keep-alive</code>, allowing multiple requests to reuse the same TCP connection sequentially.',
        'However, responses must return in the exact order requested. If request #1 takes 2 seconds to generate on the database, requests #2 and #3 are completely blocked behind it (<b>Head-of-Line Blocking</b>).'
      ],
      callout: {
        kind: 'tip',
        text: 'Pipelining attempted to send requests in batch, but failed in practice because buggy middleboxes dropped out-of-order packets.'
      },
      metrics: { http_version: 'HTTP/1.1', transport: 'TCP Keep-Alive', multiplexing: 'Sequential Only', hol_blocking: 'Application Level', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Browser', tags: [{ text: 'Blocked on Req #1', tone: 'amber', icon: 'hourglass' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Web Server', 'HTTP/1.1 FIFO'], sub: 'Slow query stalls queue' }),
          card: S({ x: -2, y: 14 }, 'Head-of-Line (HoL) Blocking', [
            'Stream: [Req #1: slow API] -> [Req #2: style.css] -> [Req #3: app.js]',
            'Server response order MUST match request order:',
            '- Style.css is ready in 5ms, BUT CANNOT BE SENT',
            '- It waits 2000ms until slow API finishes transmitting!'
          ], { icon: 'hourglass' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'Sequential Queue' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 1.8 }]
      }
    },
    {
      short: 'Domain Sharding',
      chapter: 'technique',
      title: 'Workaround: Browser 6-Connection Limit & Domain Sharding',
      body: [
        'To bypass HTTP/1.1 HoL blocking, web browsers opened up to 6 parallel TCP connections per host.',
        'Websites engineered <b>Domain Sharding</b> (splitting assets across <code>static1.example.com</code>, <code>static2.example.com</code>) and CSS sprites to cheat the 6-connection limit, increasing server memory and TCP handshake overhead.'
      ],
      callout: {
        kind: 'insight',
        text: 'Domain sharding forced browsers to perform multiple DNS lookups and maintain 24+ active TCP sockets.'
      },
      metrics: { http_version: 'HTTP/1.1 (Sharded)', transport: '6x Parallel TCP', multiplexing: 'Fake (Multi-socket)', hol_blocking: 'Mitigated', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Browser', tags: [{ text: '6 Sockets / Host', icon: 'layers' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Web Server', 'High Concurrency'], sub: '6 Sockets per User' }),
          card: S({ x: -2, y: 14 }, 'The Cost of Domain Sharding', [
            'Host 1: static1.cdn.com (6 TCP connections)',
            'Host 2: static2.cdn.com (6 TCP connections)',
            'Total: 12 TCP + TLS handshakes, 12 separate congestion windows',
            'Result: High memory footprint on load balancers'
          ], { icon: 'split' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: '6 Parallel TCP Pipes' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 3.0 }]
      }
    },
    {
      short: 'HTTP/2 Multiplexing',
      chapter: 'technique',
      title: 'HTTP/2: Binary Framing & True Multiplexing',
      body: [
        'HTTP/2 replaces text-based headers with a binary framing layer (HEADERS, DATA, SETTINGS frames) and interleaves bidirectional streams over a <b>single TCP connection</b>.',
        'Requests and responses are assigned stream IDs. Packets from different assets travel interleaved on the wire and reassemble without blocking each other.'
      ],
      callout: {
        kind: 'tip',
        text: 'Asset #2 (CSS) can arrive before Asset #1 (API) even if requested later. Domain sharding is now an anti-pattern.'
      },
      metrics: { http_version: 'HTTP/2', transport: 'Single TCP Socket', multiplexing: 'FULL (Stream IDs)', hol_blocking: 'Eliminated (App)', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Browser', tags: [{ text: '1 TCP, 100 Streams', tone: 'green', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['H2 Web Server', 'Binary Framing Layer'], sub: 'Multiplexed Streams' }),
          card: S({ x: -2, y: 14 }, 'Binary Frame Interleaving', [
            'Frame 1: [Stream 1: HEADERS /api/slow]',
            'Frame 2: [Stream 3: HEADERS /style.css]',
            'Frame 3: [Stream 3: DATA css bytes chunk 1]',
            'Frame 4: [Stream 5: DATA hero.png chunk 1]',
            'Frame 5: [Stream 1: DATA slow api response arrives later]'
          ], { icon: 'layers' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'Single Multiplexed Pipe' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 3.4 }]
      }
    },
    {
      short: 'HPACK Compression',
      chapter: 'deep',
      title: 'HPACK Header Compression',
      body: [
        'HTTP requests frequently repeat large cookie headers, User-Agent strings, and Accept headers (easily 1–2 KB per request).',
        'HTTP/2 uses <b>HPACK</b>: maintaining a static table (61 common header definitions) and an indexed dynamic table synchronized between client and server, compressing headers by up to 85%.'
      ],
      callout: {
        kind: 'insight',
        text: 'A recurring header like Cookie is sent once; subsequent requests only send a 1-byte integer reference index.'
      },
      metrics: { http_version: 'HTTP/2 HPACK', transport: 'Single TCP', multiplexing: 'YES', hol_blocking: 'Low', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Dynamic Table: 4KB', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'HPACK Engine'], sub: 'Synchronized Tables' }),
          card: S({ x: -2, y: 14 }, 'HPACK Compression Mechanism', [
            'Static Table: Index 2 = :method GET, Index 7 = :scheme https',
            'Dynamic Table entry #62 = Cookie: session_id=9f2c841e',
            'Subsequent Request payload: [Index 2, Index 7, Index 62]',
            'Size: 1400 bytes -> 12 bytes on the wire (99% reduction)'
          ], { icon: 'check' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'Compressed Binary Frames' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'TCP HoL Problem',
      chapter: 'problem',
      title: 'The HTTP/2 Achilles Heel: TCP-Level HoL Blocking',
      body: [
        'Because all HTTP/2 streams share one single TCP byte stream, TCP enforces in-order delivery of the underlying transport packets.',
        'If packet #2 drops on a spotty cellular connection, <b>all 100 concurrent HTTP streams freeze</b> waiting for TCP to retransmit packet #2, performing worse than HTTP/1.1!'
      ],
      callout: {
        kind: 'alert',
        text: 'On lossy networks (2% packet loss), HTTP/2 throughput falls behind HTTP/1.1 due to single TCP pipe serialization.'
      },
      metrics: { http_version: 'HTTP/2', transport: 'Single TCP (Bottleneck)', multiplexing: 'FROZEN', hol_blocking: 'TCP-Level Stall', conn_migration: 'No' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'Mobile Client', tags: [{ text: 'Cellular 2% Drop', tone: 'red', icon: 'alert' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'TCP Buffer Stall'], sub: 'Waiting for Packet #2' }),
          card: S({ x: -2, y: 14 }, 'TCP-Level Stall Breakdown', [
            'Stream 1 (Video), Stream 2 (CSS), Stream 3 (JS)',
            'Packet #2 (Stream 1) DROPPED ON CELLULAR TOWER',
            'OS TCP stack refuses to deliver Packets #3, #4, #5 to browser',
            'Result: CSS and JS are completely frozen until #2 is retransmitted'
          ], { icon: 'alert' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'TCP Stalled Queue', fail: 0.3 })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 1.4 }]
      }
    },
    {
      short: 'HTTP/3 QUIC',
      chapter: 'solution',
      title: 'HTTP/3 & QUIC: True Independence over UDP',
      body: [
        'HTTP/3 discards TCP entirely and runs over <b>QUIC (Quick UDP Internet Connections)</b>.',
        'In QUIC, each stream is truly independent at the transport layer: a dropped packet on Stream 1 only delays Stream 1. Streams 2 and 3 continue downloading without a millisecond of delay.'
      ],
      callout: {
        kind: 'insight',
        text: 'QUIC also includes Connection IDs: switching from Wi-Fi to 5G migrates the connection instantly without dropping active streams.'
      },
      metrics: { http_version: 'HTTP/3', transport: 'QUIC (UDP Port 443)', multiplexing: 'TRUE INDEPENDENT', hol_blocking: 'NONE', conn_migration: 'YES (0-ms)' },
      scene: {
        entities: {
          browser: y(-10, -8, { form: 'phone', label: 'QUIC Client', tags: [{ text: 'UDP / 0-RTT Migr', tone: 'green', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Edge Server', 'HTTP/3 QUIC Engine'], sub: 'UDP Port 443' }),
          card: S({ x: -2, y: 14 }, 'Why HTTP/3 Wins', [
            '1. No TCP HoL: Packet drop on Stream 1 does NOT stall Stream 2',
            '2. Integrated TLS 1.3: 1 RTT connection setup (or 0-RTT resumption)',
            '3. Connection Migration: IP changes from 192.168.1.5 (Wi-Fi) to',
            '   10.84.2.1 (5G Cellular) without breaking the active stream!'
          ], { icon: 'zap' })
        },
        links: {
          bs: h('browser', 'server', ['browser', 'server'], { heads: 'both', label: 'Independent UDP QUIC Streams' })
        },
        flows: [{ route: ['bs'], bounce: true, rate: 3.5 }]
      }
    }
  ]
};
