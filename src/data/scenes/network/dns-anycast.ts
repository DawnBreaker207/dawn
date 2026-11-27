import {
  makeBlock,
  makeDevice,
  makeLink,
  makePanel,
} from '@/lib/simulator/scene-builders';

export const dnsAnycastLesson = {
  id: 'dns-anycast',
  title: 'Global DNS Resolution & Anycast Routing',
  summary: 'Trace DNS queries from browser cache to Root, TLD, and Authoritative servers, and see how BGP Anycast routes traffic to the nearest PoP.',
  minutes: 13,
  level: 'intermediate',
  metrics: ['dns_ttl', 'resolution_ms', 'routing_type', 'security_mode'],
  legend: ['req', 'res', ['ping', 'dns lookup'], 'fail'],
  goals: [
    { text: 'Recursive resolver vs iterative', step: 1 },
    { text: 'DNS record types A, AAAA, CNAME, ALIAS', step: 2 },
    { text: 'TTL caching mechanics and negative caching', step: 3 },
    { text: 'BGP Anycast routing 1 IP', step: 4 },
    { text: 'GeoDNS and DNSSEC tamper prevention', step: 6 },
  ],
  steps: [
    {
      short: 'The Need for DNS',
      chapter: 'setup',
      title: 'Human Names to Binary IP Addresses',
      body: [
        'Routers and switches only understand numerical IP addresses (IPv4 32-bit, IPv6 128-bit). Humans remember names like <code>shop.example.com</code>.',
        'When a user enters a domain, the OS first checks local caches (Browser cache → OS hosts file → Local resolver) before launching external network queries.'
      ],
      callout: {
        kind: 'insight',
        text: 'A cache hit in the browser cache takes 0 ms without touching the network.'
      },
      metrics: { dns_ttl: 'None', resolution_ms: '0ms (Cache)', routing_type: 'Localhost', security_mode: 'Local OS' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'User Device', tags: [{ text: 'Lookup: shop.example', icon: 'search' }] }),
          resolver: makeBlock(6, 8, { s: 4.8, h: 50, color: 'yellow', glyph: 'globe', label: ['Recursive DNS', '1.1.1.1 / 8.8.8.8'], sub: 'Local ISP / Cloudflare' }),
          card: makePanel({ x: -2, y: 14 }, 'DNS Cache Priority', [
            '1. Browser DNS cache (chrome://net-internals/#dns)',
            '2. OS Resolver cache (ipconfig /displaydns / /etc/hosts)',
            '3. Router DNS cache (Local Gateway 192.168.1.1)',
            '4. Cache Miss -> Forward query to Recursive Resolver (1.1.1.1)'
          ], { icon: 'search' })
        },
        links: {
          cr: makeLink('client', 'resolver', ['client', 'resolver'], { heads: 'both', label: 'Recursive Query' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.0 }]
      }
    },
    {
      short: 'Iterative Hierarchy',
      chapter: 'technique',
      title: 'The 4-Tier Hierarchy: Root, TLD, Authoritative',
      body: [
        'When the recursive resolver has no cached entry, it performs <b>Iterative Lookups</b> walking down the hierarchical tree:',
        '1. Queries <b>Root Server</b> (<code>.</code>) → returns TLD server for <code>.com</code>.<br>2. Queries <b>TLD Server</b> (<code>.com</code>) → returns Authoritative NS.<br>3. Queries <b>Authoritative Server</b> (Route 53 / Cloudflare) → returns exact IP <code>93.184.216.34</code>.'
      ],
      callout: {
        kind: 'tip',
        text: 'There are 13 logical root server addresses (a.root-servers.net to m.root-servers.net), backed by thousands of Anycast physical nodes.'
      },
      metrics: { dns_ttl: '300s', resolution_ms: '120ms (4 hops)', routing_type: 'Iterative Chain', security_mode: 'Standard UDP' },
      scene: {
        entities: {
          resolver: makeBlock(-10, -6, { s: 4.6, h: 52, color: 'yellow', glyph: 'globe', label: ['Recursive Resolver'], sub: '1.1.1.1' }),
          root: makeBlock(0, -6, { s: 4.2, h: 52, color: 'purple', glyph: 'server', label: ['Root Server', 'Zone: "."'], sub: 'Refers to .com' }),
          tld: makeBlock(10, -6, { s: 4.2, h: 52, color: 'blue', glyph: 'server', label: ['TLD Server', 'Zone: ".com"'], sub: 'Refers to NS' }),
          auth: makeBlock(10, 8, { s: 4.8, h: 50, color: 'teal', glyph: 'database', label: ['Authoritative NS', 'shop.example'], sub: 'Returns A Record' }),
          card: makePanel({ x: -2, y: 14 }, 'Iterative Query Path', [
            'Resolver -> Root ("."): "Where is .com?" -> NS a.gtld-servers.net',
            'Resolver -> TLD (".com"): "Where is shop.example?" -> NS ns1.cloudflare.com',
            'Resolver -> Auth ("shop.example"): "What is IP?" -> A: 93.184.216.34',
            'Resolver returns answer to Client and caches according to TTL'
          ], { icon: 'network' })
        },
        links: {
          rr: makeLink('resolver', 'root', ['resolver', 'root'], { heads: 'both' }),
          rt: makeLink('resolver', 'tld', ['resolver', 'tld'], { heads: 'both' }),
          ra: makeLink('resolver', 'auth', ['resolver', 'auth'], { heads: 'both' })
        },
        flows: [
          { route: ['rr'], bounce: true, rate: 1.5 },
          { route: ['rt'], bounce: true, rate: 1.5 },
          { route: ['ra'], bounce: true, rate: 1.5 }
        ]
      }
    },
    {
      short: 'Record Types',
      chapter: 'technique',
      title: 'DNS Record Anatomy: A, AAAA, CNAME, ALIAS',
      body: [
        'A DNS zone file contains typed resource records mapping names to destinations.',
        '<code>A</code> maps to IPv4 (32-bit). <code>AAAA</code> maps to IPv6 (128-bit). <code>CNAME</code> creates an alias to another domain (cannot exist on zone apex <code>@</code>). <code>ALIAS / ANAME</code> resolves aliases at the apex.'
      ],
      callout: {
        kind: 'insight',
        text: 'CNAME at root apex breaks MX records (RFC 1034). Modern DNS providers provide ALIAS/Flattened CNAME records to solve this.'
      },
      metrics: { dns_ttl: '3600s', resolution_ms: '5ms (Warm)', routing_type: 'Record Lookup', security_mode: 'RFC 1035' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'IPv4 + IPv6 Dual', icon: 'zap' }] }),
          auth: makeBlock(6, 8, { s: 4.8, h: 50, color: 'teal', glyph: 'database', label: ['Authoritative NS', 'Zone Records'], sub: 'Zone apex: @' }),
        },
        links: {
          ca: makeLink('client', 'auth', ['client', 'auth'], { heads: 'both', label: 'Query Type: A + AAAA' })
        },
        flows: [{ route: ['ca'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'TTL & Caching',
      chapter: 'deep',
      title: 'TTL Dynamics & Negative Caching',
      body: [
        'Every DNS response carries a <b>Time-To-Live (TTL)</b> in seconds, dictating how long intermediate resolvers may cache the record.',
        'High TTL (86400s / 24h) saves bandwidth but delays DNS migration. Low TTL (60s) allows fast failover but increases query traffic. <b>Negative Caching</b> (RFC 2308) caches NXDOMAIN (non-existent domain) errors based on the SOA record minimum TTL.'
      ],
      callout: {
        kind: 'tip',
        text: 'Before moving servers, drop your DNS TTL to 60s at least 48 hours in advance.'
      },
      metrics: { dns_ttl: '60s (Low TTL)', resolution_ms: '1ms (Cache Hit)', routing_type: 'TTL Expiry', security_mode: 'RFC 2308' },
      scene: {
        entities: {
          resolver: makeBlock(-10, -6, { s: 4.6, h: 52, color: 'yellow', glyph: 'globe', label: ['Resolver Cache', 'TTL Countdown'], sub: 'TTL: 42s left' }),
          server: makeBlock(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Origin Web Host', 'Port 443'], sub: '198.51.100.1' }),
          card: makePanel({ x: -2, y: 14 }, 'TTL Caching Trade-offs', [
            'TTL = 86400 (24h): 99.9% Cache Hit Rate, BUT DNS changes take 24h to propagate',
            'TTL = 60s: Fast failover, but resolver queries origin frequently',
            'Negative Caching: If domain does not exist (NXDOMAIN), resolvers cache failure',
            'defined by SOA MINIMUM field (prevents DDoS on missing domains)'
          ], { icon: 'clock' })
        },
        links: {
          rs: makeLink('resolver', 'server', ['resolver', 'server'], { heads: 'both', label: 'Cached Answer' })
        },
        flows: [{ route: ['rs'], bounce: true, rate: 2.5 }]
      }
    },
    {
      short: 'BGP Anycast',
      chapter: 'deep',
      title: 'BGP Anycast: 1 IP Broadcast Worldwide',
      body: [
        'In traditional <b>Unicast</b> routing, one IP address belongs to exactly one physical server in one datacenter.',
        'In <b>BGP Anycast</b>, the exact same IP address (e.g. <code>1.1.1.1</code> or <code>8.8.8.8</code>) is announced via BGP across hundreds of global Point of Presence (PoP) edge locations. The internet BGP routing protocol automatically routes each client to their topologically nearest PoP.'
      ],
      callout: {
        kind: 'insight',
        text: 'Anycast provides inherent DDoS mitigation: a volumetric attack is diluted and absorbed across 300 global edge centers.'
      },
      metrics: { dns_ttl: 'Anycast', resolution_ms: '12ms (Nearest PoP)', routing_type: 'BGP Anycast', security_mode: 'DDoS Absorbed' },
      scene: {
        entities: {
          clientUs: makeDevice(-12, -10, { form: 'phone', label: 'US User', tags: [{ text: 'Routes to San Jose', icon: 'globe' }] }),
          clientEu: makeDevice(-12, 4, { form: 'phone', label: 'EU User', tags: [{ text: 'Routes to Frankfurt', icon: 'globe' }] }),
          popUs: makeBlock(6, -10, { s: 4.6, h: 52, color: 'orange', glyph: 'globe', label: ['Anycast PoP (US)', 'IP: 1.1.1.1'], sub: 'San Jose Edge (12ms)' }),
          popEu: makeBlock(6, 4, { s: 4.6, h: 52, color: 'orange', glyph: 'globe', label: ['Anycast PoP (EU)', 'IP: 1.1.1.1'], sub: 'Frankfurt Edge (14ms)' }),
          card: makePanel({ x: -2, y: 14 }, 'BGP Anycast Advantages', [
            'Same IP: 1.1.1.1 announced in 300+ cities simultaneously',
            'BGP AS-Path routing directs users to lowest-cost / lowest-hop PoP',
            'DDoS attack in Asia is contained in Asian PoPs without affecting US/EU',
            'Zero latency penalty: Sub-15ms DNS resolution globally'
          ], { icon: 'globe' })
        },
        links: {
          u1: makeLink('clientUs', 'popUs', ['clientUs', 'popUs'], { heads: 'both', label: 'BGP Path 1' }),
          u2: makeLink('clientEu', 'popEu', ['clientEu', 'popEu'], { heads: 'both', label: 'BGP Path 2' })
        },
        flows: [
          { route: ['u1'], bounce: true, rate: 2.0 },
          { route: ['u2'], bounce: true, rate: 2.0 }
        ]
      }
    },
    {
      short: 'GeoDNS & GSLB',
      chapter: 'solution',
      title: 'GeoDNS & Global Server Load Balancing (GSLB)',
      body: [
        'GeoDNS checks the client’s recursive resolver subnet (via <b>EDNS Client Subnet - ECS</b>) and dynamically returns the IP of the closest application datacenter.',
        'European visitors get IP <code>185.x.x.x</code> (Frankfurt), while Asian visitors get IP <code>203.x.x.x</code> (Singapore), minimizing latency before HTTP connections are opened.'
      ],
      callout: {
        kind: 'tip',
        text: 'EDNS Client Subnet (RFC 7871) forwards the first 24 bits of client IP to enable accurate geolocation.'
      },
      metrics: { dns_ttl: '60s', resolution_ms: '15ms', routing_type: 'GeoDNS GSLB', security_mode: 'EDNS0 ECS' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'Tokyo Client', tags: [{ text: 'ECS: 210.140.x.x/24', icon: 'mapPin' }] }),
          geodns: makeBlock(6, 8, { s: 4.8, h: 50, color: 'teal', glyph: 'globe', label: ['GeoDNS Engine', 'Route 53 Geolocation'], sub: 'Resolves to ap-northeast-1' }),
          card: makePanel({ x: -2, y: 14 }, 'GeoDNS Decision Logic', [
            'Query from Client with EDNS Client Subnet: 210.140.10.0/24',
            'GeoDNS Database maps IP to Tokyo, Japan',
            'Rule match: Return closest application region:',
            'Answer: A -> 13.112.0.1 (AWS Tokyo ap-northeast-1)',
            'Result: User connects to local cluster with 8ms latency'
          ], { icon: 'mapPin' })
        },
        links: {
          cg: makeLink('client', 'geodns', ['client', 'geodns'], { heads: 'both', label: 'Geo-Targeted Query' })
        },
        flows: [{ route: ['cg'], bounce: true, rate: 2.6 }]
      }
    },
    {
      short: 'DNSSEC & DoH',
      chapter: 'solution',
      title: 'Security: DNSSEC & DNS-over-HTTPS (DoH)',
      body: [
        'Traditional DNS UDP port 53 is unencrypted and vulnerable to <b>Cache Poisoning (Kaminsky attack)</b> where forged answers redirect users to phishing sites.',
        '<b>DNSSEC</b> uses cryptographic signatures (RRSIG, DNSKEY) to verify authenticity. <b>DoH (DNS over HTTPS)</b> and <b>DoT (DNS over TLS)</b> encrypt the query pipe, preventing ISPs and snoops from tracking which domains you visit.'
      ],
      callout: {
        kind: 'insight',
        text: 'DoH runs over standard HTTPS port 443, making DNS censorship by firewalls virtually impossible.'
      },
      metrics: { dns_ttl: '300s', resolution_ms: '18ms', routing_type: 'DoH (HTTPS Port 443)', security_mode: 'DNSSEC + TLS' },
      scene: {
        entities: {
          client: makeDevice(-10, -8, { form: 'phone', label: 'DoH Client', tags: [{ text: 'Encrypted via HTTPS', tone: 'green', icon: 'lock' }] }),
          resolver: makeBlock(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'shield', label: ['DoH Resolver', 'DNSSEC Validating'], sub: '1.1.1.1 /dns-query' }),
          card: makePanel({ x: -2, y: 14 }, 'Modern DNS Security Stack', [
            '1. Privacy (Client <-> Resolver):',
            '   DNS-over-HTTPS (DoH, RFC 8484) encrypted on port 443',
            '2. Authenticity (Resolver <-> Auth NS):',
            '   DNSSEC cryptographic verification of RRSIG records',
            '3. Zero Cache Poisoning: Spoofed UDP packets rejected by signature'
          ], { icon: 'shield' })
        },
        links: {
          cr: makeLink('client', 'resolver', ['client', 'resolver'], { heads: 'both', label: 'Encrypted TLS Tunnel' })
        },
        flows: [{ route: ['cr'], bounce: true, rate: 2.8 }]
      }
    }
  ]
};
