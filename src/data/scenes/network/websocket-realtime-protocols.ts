// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const websocketRealtimeProtocolsLesson = {
  id: 'websocket-realtime-protocols',
  title: 'Real-Time Protocols: WebSockets, SSE & Scaling Sockets',
  summary: 'Architect bidirectional real-time channels: from the HTTP 101 Upgrade to minimal 2-byte framing, SSE trade-offs, and multi-server Redis backplanes.',
  minutes: 14,
  level: 'intermediate',
  metrics: ['channel_type', 'frame_overhead', 'concurrency', 'directionality'],
  legend: ['req', 'res', ['ping', 'socket frame'], 'fail'],
  goals: [
    { text: 'Compare polling, long-polling and persistent WebSockets', step: 1 },
    { text: 'The HTTP 101 Switching Protocols upgrade handshake', step: 2 },
    { text: 'WebSocket binary frame anatomy and client masking', step: 3 },
    { text: 'Server-Sent Events (SSE) over HTTP/2 vs WebSockets', step: 4 },
    { text: 'Scale WebSocket clusters with a Redis Pub/Sub backplane', step: 6 },
  ],
  steps: [
    {
      short: 'Polling Waste',
      chapter: 'problem',
      title: 'The Waste of Short & Long Polling',
      body: [
        'Before persistent sockets, web apps polled the server every few seconds (<code>setInterval</code>).',
        '99% of polling requests return empty responses, yet each request pays the price of HTTP headers (1KB), cookies, and TCP handshake setup. Even Long-Polling exhausts server thread pools holding idle connections open.'
      ],
      callout: {
        kind: 'insight',
        text: '10,000 users polling every 2 seconds generates 5,000 HTTP requests per second of pure waste.'
      },
      metrics: { channel_type: 'Short Polling', frame_overhead: '1,000 bytes (Headers)', concurrency: '10,000 (Exhausted)', directionality: 'Half-Duplex (Pull)' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Poll every 2s', tone: 'amber', icon: 'refresh' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Polling Server', 'CPU Saturation'], sub: '99% Empty 304/200' }),
          card: S({ x: -2, y: 14 }, 'HTTP Polling Waste', [
            'Client -> Server: GET /messages?since=100 (1200 bytes)',
            'Server -> Client: HTTP 200 OK {"data": []} (empty!)',
            '2 seconds later: repeats exact same request',
            'Result: High server load, battery drain, and notification lag'
          ], { icon: 'hourglass' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Repeated HTTP Requests' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'HTTP 101 Upgrade',
      chapter: 'setup',
      title: 'The HTTP 101 Switching Protocols Handshake',
      body: [
        'WebSockets start as a standard HTTP request on port 80/443 with special headers: <code>Upgrade: websocket</code> and <code>Connection: Upgrade</code>.',
        'The client includes a random <code>Sec-WebSocket-Key</code>. The server responds with <code>HTTP/1.1 101 Switching Protocols</code> and a cryptographic hash. The underlying TCP socket is now repurposed into a full-duplex WebSocket stream.'
      ],
      callout: {
        kind: 'tip',
        text: 'Because WebSockets start on port 443, standard corporate firewalls allow the connection without blocking custom ports.'
      },
      metrics: { channel_type: 'WebSocket (Upgraded)', frame_overhead: '2 bytes', concurrency: 'Active', directionality: 'Full-Duplex' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Upgrade: websocket', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['WebSocket Gateway', 'Port 443'], sub: 'HTTP 101 Switched' }),
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Upgraded Socket' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'Frame Anatomy',
      chapter: 'technique',
      title: 'WebSocket Framing: 2-Byte Minimal Overhead',
      body: [
        'Once upgraded, HTTP headers disappear entirely. Every message is packed into minimal lightweight frames.',
        'A small message has only a <b>2-byte header</b>: FIN bit, Opcode (Text 0x1, Binary 0x2, Close 0x8, Ping 0x9), and Payload Length. Client-to-server frames are XOR-masked with a 4-byte key to prevent malicious cache poisoning in proxy servers.'
      ],
      callout: {
        kind: 'insight',
        text: 'Comparing headers: HTTP sends 800+ bytes per message; WebSocket sends 2 to 6 bytes. 99% bandwidth reduction.'
      },
      metrics: { channel_type: 'WebSocket Binary', frame_overhead: '2–6 bytes', concurrency: '100k+', directionality: 'Full-Duplex' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Masked Frame', icon: 'lock' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'Unmasking Engine'], sub: 'Opcode: 0x1 (Text)' }),
          card: S({ x: -2, y: 14 }, 'WebSocket Frame Bitfields (RFC 6455)', [
            'Byte 0: FIN (1 bit) | RSV (3 bits) | Opcode (4 bits)',
            'Byte 1: MASK (1 bit) | Payload Length (7 bits)',
            'Bytes 2..5: Masking-key (4 bytes, client-to-server only)',
            'Payload: Unmasked data XOR MaskingKey[i % 4]',
            'Total Header: 2 bytes (or 6 bytes with mask)'
          ], { icon: 'listOrdered' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: '2-Byte Frames' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 3.2 }]
      }
    },
    {
      short: 'SSE Alternative',
      chapter: 'technique',
      title: 'Server-Sent Events (SSE): The Simple One-Way Stream',
      body: [
        'Do you truly need full-duplex communication? In scenarios like stock tickers, live news feeds, or LLM token streaming (ChatGPT), only the server pushes data to the client.',
        '<b>Server-Sent Events (SSE)</b> runs over standard HTTP/1.1 or HTTP/2 (<code>Content-Type: text/event-stream</code>). It handles auto-reconnection, event IDs, and proxies natively without custom framing.'
      ],
      callout: {
        kind: 'tip',
        text: 'Use SSE for LLM AI token streaming and dashboards. Reserve WebSockets for chat and real-time collaborative canvas editing.'
      },
      metrics: { channel_type: 'Server-Sent Events', frame_overhead: 'text/event-stream', concurrency: 'H2 Multiplexed', directionality: 'Unidirectional (Server → Client)' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'EventSource API', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['LLM / News Server', 'SSE Stream'], sub: 'text/event-stream' }),
          card: S({ x: -2, y: 14 }, 'SSE Protocol Wire Format', [
            'Client -> Server: GET /stream HTTP/2 (Accept: text/event-stream)',
            'Server keeps response open indefinitely:',
            '  id: 104',
            '  event: token',
            '  data: {"delta": "Hello world"}',
            'Native browser reconnect: Last-Event-ID resumes stream seamlessly'
          ], { icon: 'refresh' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'end', label: 'One-Way Server Push' })
        },
        flows: [{ route: ['cs'], bounce: false, rate: 2.8 }]
      }
    },
    {
      short: 'Dead Sockets',
      chapter: 'deep',
      title: 'Heartbeats, Ping/Pong & Zombie Sockets',
      body: [
        'Mobile clients frequently switch cell towers, enter tunnels, or sleep without sending a TCP FIN teardown packet.',
        'The server believes the socket is still open (a <b>Zombie Connection</b>), leaking memory and file descriptors. WebSocket Ping/Pong control frames detect dead sockets and clean them up after missed heartbeats.'
      ],
      callout: {
        kind: 'alert',
        text: 'Without heartbeats, half-open zombie connections accumulate until the server exhausts its 65k file descriptor limit.'
      },
      metrics: { channel_type: 'Ping / Pong (0x9 / 0xA)', frame_overhead: '2 bytes', concurrency: 'Filtered', directionality: 'Full-Duplex' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client (Sleep)', tags: [{ text: 'Offline / Tunnel', tone: 'amber', icon: 'alert' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Gateway Server', 'Heartbeat Watchdog'], sub: 'Ping timeout -> Terminate' }),
          card: S({ x: -2, y: 14 }, 'Heartbeat State Machine', [
            'Server sends [Opcode 0x9 PING] every 30 seconds',
            'Client MUST immediately reply [Opcode 0xA PONG]',
            'If no PONG within 10 seconds:',
            '  - Close socket (TCP RST)',
            '  - Free OS file descriptor & notify subscriber service'
          ], { icon: 'clock' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Periodic Ping / Pong' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 1.2 }]
      }
    },
    {
      short: 'Scaling to 1M Sockets',
      chapter: 'deep',
      title: 'Scaling OS & Memory: 1 Million Connections',
      body: [
        'Holding 1 million idle TCP connections requires optimizing kernel memory buffers (<code>wmem</code>, <code>rmem</code>) and epoll file descriptors.',
        'Default Linux socket buffers allocate 128KB per socket (1M sockets = 128 GB RAM!). Tuning socket read/write buffers down to 4KB drops memory to just 4 GB for 1 million concurrent users.'
      ],
      callout: {
        kind: 'insight',
        text: 'Set ulimit -n 1048576 and tune sysctl net.ipv4.tcp_rmem and net.ipv4.tcp_wmem.'
      },
      metrics: { channel_type: 'Tuned Epoll Socket', frame_overhead: '4KB RAM / Conn', concurrency: '1,000,000 Active', directionality: 'Full-Duplex' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: '1M Users', tags: [{ text: '1,000,000 Sockets', tone: 'green', icon: 'users' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['High-Performance Gateway', 'Linux Epoll Kernel'], sub: 'RAM: 4GB Total' }),
          card: S({ x: -2, y: 14 }, 'Kernel Tuning for 1M WebSockets', [
            '/etc/security/limits.conf: * soft nofile 1048576',
            'sysctl -w fs.file-max=2097152',
            'sysctl -w net.ipv4.tcp_rmem="4096 4096 16384"',
            'sysctl -w net.ipv4.tcp_wmem="4096 4096 16384"',
            'Single Box holds 1,000,000 live connections!'
          ], { icon: 'zap' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Epoll Monitored Sockets' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 3.4 }]
      }
    },
    {
      short: 'Redis Backplane',
      chapter: 'solution',
      title: 'Multi-Server Routing: The Redis Pub/Sub Backplane',
      body: [
        'When you scale across multiple WebSocket servers, User A connects to Server 1, but User B connects to Server 2.',
        'How does Server 1 deliver User A’s message to User B? By connecting all WebSocket servers to a shared <b>Redis Pub/Sub or Kafka Backplane</b>. Server 1 publishes to the room topic; Server 2 receives it and broadcasts to User B’s local socket.'
      ],
      callout: {
        kind: 'tip',
        text: 'The WebSocket servers remain completely stateless: any user can connect to any gateway.'
      },
      metrics: { channel_type: 'Distributed WebSockets', frame_overhead: 'Redis Backplane', concurrency: 'Multi-Node Cluster', directionality: 'Cluster Broadcast' },
      scene: {
        entities: {
          userA: y(-12, -10, { form: 'phone', label: 'User A', tags: [{ text: 'Conn: Server 1', icon: 'user' }] }),
          userB: y(-12, 6, { form: 'phone', label: 'User B', tags: [{ text: 'Conn: Server 2', icon: 'user' }] }),
          gw1: d(0, -10, { s: 4.6, h: 52, color: 'orange', glyph: 'network', label: ['WS Gateway 1', 'Node A'], sub: 'Holds User A socket' }),
          gw2: d(0, 6, { s: 4.6, h: 52, color: 'orange', glyph: 'network', label: ['WS Gateway 2', 'Node B'], sub: 'Holds User B socket' }),
          redis: d(14, -2, { s: 4.8, h: 50, color: 'rose', glyph: 'database', label: ['Redis Pub/Sub', 'Backplane Bus'], sub: 'Channel: room_102' }),
          card: S({ x: -2, y: 16 }, 'Multi-Node Message Dispatch', [
            '1. User A sends message "Hi B!" to Gateway 1',
            '2. Gateway 1 publishes: REDIS PUBLISH room_102 "Hi B!"',
            '3. Redis fans out message to Gateway 2',
            '4. Gateway 2 delivers message directly down User B\'s socket'
          ], { icon: 'workflow' })
        },
        links: {
          a1: h('userA', 'gw1', ['userA', 'gw1'], { heads: 'both' }),
          b2: h('userB', 'gw2', ['userB', 'gw2'], { heads: 'both' }),
          g1r: h('gw1', 'redis', ['gw1', 'redis'], { heads: 'end', label: 'PUBLISH' }),
          rg2: h('redis', 'gw2', ['redis', 'gw2'], { heads: 'end', label: 'SUBSCRIBE' })
        },
        flows: [
          { route: ['a1', 'g1r'], bounce: false, rate: 2.2 },
          { route: ['rg2', 'b2'], bounce: false, rate: 2.2 }
        ]
      }
    }
  ]
};
