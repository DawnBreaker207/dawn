// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const tlsHandshakeLesson = {
  id: 'tls-handshake',
  title: 'Cryptography & The TLS 1.3 Handshake',
  summary: 'Inside the cryptographic protocol securing the web: TLS 1.2 vs 1.3, ECDHE key exchange, certificate verification, and mutual TLS.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['handshake_rtt', 'cipher_suite', 'forward_secrecy', 'auth_type'],
  legend: ['req', 'res', ['ping', 'crypto exchange'], 'fail'],
  goals: [
    { text: 'Compare TLS 1.2 2-RTT vs TLS 1.3 1-RTT', step: 2 },
    { text: 'ECDHE ephemeral Diffie-Hellman key exchange', step: 3 },
    { text: 'X.509 Certificate Chain verification and SNI', step: 4 },
    { text: '0-RTT early data and replay protection', step: 5 },
    { text: 'Mutual TLS (mTLS) for microservice zero-trust', step: 6 },
  ],
  steps: [
    {
      short: 'Plaintext Risk',
      chapter: 'problem',
      title: 'The Danger of Plaintext HTTP',
      body: [
        'Over an unencrypted HTTP connection, every packet passes through Wi-Fi routers, ISPs, and internet transit exchanges in plaintext.',
        'Attackers can read passwords, session cookies, and tamper with responses via Man-in-the-Middle (MitM) packet injection.'
      ],
      callout: {
        kind: 'insight',
        text: 'TLS provides three guarantees: Encryption (Privacy), Authentication (Identity), and Integrity (No tampering).'
      },
      metrics: { handshake_rtt: '0 RTT', cipher_suite: 'None (Plaintext)', forward_secrecy: 'NO', auth_type: 'None' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Shopper', tags: [{ text: 'cookie: auth_token', tone: 'red', icon: 'lock' }] }),
          attacker: d(0, 0, { s: 4.4, h: 52, color: 'rose', glyph: 'shield', label: ['Packet Sniffer', 'Rogue Wi-Fi Router'], sub: 'Plaintext exposed' }),
          server: d(10, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Bank Server', 'Port 80 (HTTP)'], sub: 'Insecure' }),
          card: S({ x: -2, y: 14 }, 'Plaintext Packet Inspection', [
            'GET /account/balance HTTP/1.1',
            'Host: bank.example.com',
            'Cookie: session_id=9f2c841e (EXPOSED TO ANY HOP)',
            'Result: High vulnerability to eavesdropping & injection'
          ], { icon: 'alert' })
        },
        links: {
          ca: h('client', 'attacker', ['client', 'attacker'], { heads: 'both', label: 'Unencrypted' }),
          as: h('attacker', 'server', ['attacker', 'server'], { heads: 'both', label: 'Cleartext' })
        },
        flows: [{ route: ['ca', 'as'], bounce: true, rate: 1.8 }]
      }
    },
    {
      short: 'TLS 1.2 (2 RTT)',
      chapter: 'setup',
      title: 'Legacy TLS 1.2: Two Round-Trip Penalty',
      body: [
        'In TLS 1.2, negotiating encryption required 2 separate network round trips after the initial TCP handshake (3 RTTs total before HTTP data!).',
        'Round 1: ClientHello / ServerHello + Certificate. Round 2: Client Key Exchange + Cipher Spec. This caused visible sluggishness on high-latency mobile networks.'
      ],
      callout: {
        kind: 'tip',
        text: '3 RTTs on mobile (80ms RTT) meant 240ms delay before receiving the first byte of HTML.'
      },
      metrics: { handshake_rtt: '2 RTT (160ms)', cipher_suite: 'RSA / DHE (Legacy)', forward_secrecy: 'Optional', auth_type: 'Server Only' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'Round 1: Hello', icon: 'refresh' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'TLS 1.2'], sub: 'Cert + KeyExchange' }),
          card: S({ x: -2, y: 14 }, 'TLS 1.2 Handshake (2 RTT)', [
            'RTT 1: ClientHello -> ServerHello + Certificate',
            'RTT 2: ClientKeyExchange + [ChangeCipherSpec] -> Finished',
            'RTT 3: First HTTP GET request permitted',
            'Total: 3 RTTs (1 TCP + 2 TLS) = Severe Mobile Delay'
          ], { icon: 'clock' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: '2-RTT Exchanges' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'TLS 1.3 (1 RTT)',
      chapter: 'technique',
      title: 'Modern TLS 1.3: 1 RTT with Speculative ECDHE',
      body: [
        'TLS 1.3 completely eliminates the second round trip by guessing the server’s preferred curve (e.g. X25519) and sending the client’s Diffie-Hellman public key share directly in the initial <code>ClientHello</code>.',
        'The server computes the master secret, returns its key share in <code>ServerHello</code>, and application data transmission starts immediately in RTT 1.'
      ],
      callout: {
        kind: 'insight',
        text: 'TLS 1.3 also mandates Perfect Forward Secrecy (PFS), banning static RSA key exchange.'
      },
      metrics: { handshake_rtt: '1 RTT (80ms)', cipher_suite: 'TLS_AES_256_GCM_SHA384', forward_secrecy: 'MANDATORY', auth_type: 'Server Only' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'KeyShare: X25519', tone: 'green', icon: 'key' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'TLS 1.3 Active'], sub: '1 RTT Encryption' }),
          card: S({ x: -2, y: 14 }, 'TLS 1.3 1-RTT Optimization', [
            'Client -> Server: ClientHello + KeyShare (Curve25519) + SNI',
            'Server -> Client: ServerHello + KeyShare + EncryptedExtensions + Cert + Finished',
            'Both sides compute: SharedSecret = ECDH(ClientKey, ServerKey)',
            'Result: 50% handshake latency reduction'
          ], { icon: 'zap' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'ClientHello + KeyShare' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Cert & SNI',
      chapter: 'technique',
      title: 'X.509 Certificate Chain & SNI Routing',
      body: [
        'How does the browser know the server is who it claims to be? The server presents an X.509 digital certificate signed by a trusted Certificate Authority (CA).',
        '<b>SNI (Server Name Indication)</b> includes the hostname (e.g. <code>api.example.com</code>) inside ClientHello, allowing one IP address to host hundreds of distinct TLS certificates.'
      ],
      callout: {
        kind: 'tip',
        text: 'Browsers verify the signature up the chain: Leaf Cert → Intermediate CA → Root CA in OS Trust Store.'
      },
      metrics: { handshake_rtt: '1 RTT', cipher_suite: 'ECDHE-ECDSA', forward_secrecy: 'YES', auth_type: 'X.509 Verified' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'SNI: shop.example', icon: 'globe' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Reverse Proxy', 'SNI Dispatcher'], sub: 'Cert: Let\'s Encrypt' }),
          card: S({ x: -2, y: 14 }, 'Certificate Chain of Trust', [
            '1. Root CA (ISRG Root X1 in OS Trust Store) -> signs:',
            '2. Intermediate CA (R3) -> signs:',
            '3. Leaf Certificate (shop.example.com):',
            '   - Subject Alternative Names (SAN)',
            '   - Validity: 90 days, Public Key: ECDSA P-256'
          ], { icon: 'check' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'SNI & Cert Validation' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.4 }]
      }
    },
    {
      short: '0-RTT Resumption',
      chapter: 'deep',
      title: '0-RTT Session Resumption & Replay Attacks',
      body: [
        'For clients that previously connected to the server, TLS 1.3 allows <b>0-RTT Resumption</b>: sending encrypted application data on the very first packet using a Pre-Shared Key (PSK).',
        'However, 0-RTT data is vulnerable to <b>Replay Attacks</b>: an eavesdropper can capture and re-send the packet. Therefore, 0-RTT is strictly forbidden for non-idempotent HTTP methods (POST/PUT).'
      ],
      callout: {
        kind: 'insight',
        text: 'Never allow financial transactions or state mutations over TLS 0-RTT Early Data.'
      },
      metrics: { handshake_rtt: '0 RTT (0ms)', cipher_suite: 'PSK Resumption', forward_secrecy: 'Limited on EarlyData', auth_type: 'PSK Ticket' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Returning User', tags: [{ text: 'PSK Early Data', tone: 'green', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Edge Server', 'Anti-Replay Filter'], sub: 'Ticket Cached' }),
          card: S({ x: -2, y: 14 }, '0-RTT Early Data Safety', [
            'Packet 1: ClientHello + PSK + HTTP GET /feed (Early Data)',
            'Server executes GET immediately without handshake delay',
            'Protection against Replay:',
            '- TLS Single-use ticket nonce & timestamp window',
            '- Reject any POST /checkout in Early Data (RFC 8470)'
          ], { icon: 'shield' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: '0-RTT Instant Data' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 3.2 }]
      }
    },
    {
      short: 'Mutual TLS (mTLS)',
      chapter: 'deep',
      title: 'Mutual TLS (mTLS) in Service Mesh',
      body: [
        'Standard HTTPS only authenticates the server to the client. In <b>Mutual TLS (mTLS)</b>, the server also demands a cryptographic certificate from the client.',
        'This forms the backbone of Zero-Trust architectures (Istio, Linkerd): every microservice call is authenticated, authorized by SPIFFE identity, and encrypted in transit.'
      ],
      callout: {
        kind: 'tip',
        text: 'Even if an attacker breaches the internal VPC, they cannot eavesdrop or impersonate other microservices without valid client certificates.'
      },
      metrics: { handshake_rtt: '1 RTT', cipher_suite: 'TLS 1.3 mTLS', forward_secrecy: 'YES', auth_type: 'Mutual (2-Way)' },
      scene: {
        entities: {
          client: d(-8, -4, { s: 4.6, h: 52, color: 'orange', glyph: 'workflow', label: ['Order Service', 'SPIFFE Cert'], sub: 'spiffe://cluster/ns/order' }),
          server: d(8, 4, { s: 4.8, h: 50, color: 'purple', glyph: 'database', label: ['Payment Gateway', 'Mutual TLS Policy'], sub: 'Validates Client Cert' }),
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'mTLS Encrypted Lane' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.6 }]
      }
    },
    {
      short: 'ALPN Negotiation',
      chapter: 'solution',
      title: 'ALPN Protocol Negotiation (HTTP/1.1 vs H2 vs H3)',
      body: [
        'How does a browser and server agree whether to speak HTTP/1.1 or HTTP/2 without wasting another round trip?',
        '<b>ALPN (Application-Layer Protocol Negotiation)</b> includes the supported application protocols inside the TLS extension handshake, letting the server choose <code>h2</code> immediately.'
      ],
      callout: {
        kind: 'insight',
        text: 'ALPN makes protocol upgrades completely zero-cost during TLS connection establishment.'
      },
      metrics: { handshake_rtt: '1 RTT', cipher_suite: 'ALPN: h2', forward_secrecy: 'YES', auth_type: 'Verified' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Browser', tags: [{ text: 'ALPN: ["h2", "http/1.1"]', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Edge Server', 'ALPN Selector'], sub: 'Selected: h2' }),
          card: S({ x: -2, y: 14 }, 'ALPN Handshake Extension', [
            'ClientHello extension: ALPN [protocols: "h2", "http/1.1"]',
            'Server selects: "h2" (HTTP/2 binary framing)',
            'ServerHello extension: ALPN selected = "h2"',
            'TLS Finished -> First frame is HTTP/2 SETTINGS frame'
          ], { icon: 'check' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'ALPN Protocol Selection' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.5 }]
      }
    }
  ]
};
