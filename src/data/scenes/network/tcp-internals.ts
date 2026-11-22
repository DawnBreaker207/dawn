// @ts-nocheck
/* eslint-disable */
import {
  makeBlock as d,
  makeDevice as y,
  makeLink as h,
  makePanel as S,
} from '@/lib/simulator/scene-builders';

export const tcpInternalsLesson = {
  id: 'tcp-internals',
  title: 'TCP Internals & Flow Control',
  summary: 'Follow bytes through the transport layer: 3-way handshake, sliding window, congestion control, and connection teardown.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['rtt_ms', 'cwnd_pkts', 'state', 'throughput_mbps'],
  legend: ['req', 'res', ['ping', 'handshake'], 'fail'],
  goals: [
    { text: 'TCP 3-Way Handshake SYN, SYN-ACK, ACK', step: 1 },
    { text: 'Sliding window flow control and rwnd', step: 2 },
    { text: 'Slow Start and congestion window', step: 3 },
    { text: 'Fast retransmit on 3 duplicate ACKs', step: 4 },
    { text: 'Connection termination and TIME_WAIT state', step: 6 },
  ],
  steps: [
    {
      short: 'Handshake',
      chapter: 'setup',
      title: 'The 3-Way Handshake (SYN → SYN-ACK → ACK)',
      body: [
        'Before transmitting any application payload (HTTP, gRPC), TCP establishes a reliable bidirectional stream.',
        'Client sends <code>SYN</code> with an initial sequence number (ISN). Server replies with <code>SYN-ACK</code>. Client responds with <code>ACK</code> and can immediately piggyback data.'
      ],
      callout: {
        kind: 'insight',
        text: 'The 3-way handshake costs exactly 1 full Round-Trip Time (RTT) before a single byte of HTTP data is transferred.'
      },
      metrics: { rtt_ms: '45ms', cwnd_pkts: '10', state: 'ESTABLISHED', throughput_mbps: '0' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client (192.168.1.5)', tags: [{ text: 'ISN=1000', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['TCP Server', 'Port 443'], sub: 'LISTEN → ESTAB' }),
          card: S({ x: -2, y: 14 }, 'Handshake Packet Sequence', [
            '1. Client -> Server [SYN] Seq=1000 Win=65535',
            '2. Server -> Client [SYN, ACK] Seq=5000 Ack=1001',
            '3. Client -> Server [ACK] Seq=1001 Ack=5001',
            'Status: TCP Socket ESTABLISHED (1 RTT)'
          ], { icon: 'network' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'SYN / SYN-ACK' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.0 }]
      }
    },
    {
      short: 'Sliding Window',
      chapter: 'technique',
      title: 'Sliding Window Flow Control (rwnd)',
      body: [
        'Flow control prevents a fast sender from overwhelming a slow receiver with more data than its socket buffer can hold.',
        'The receiver advertises its available buffer space (<code>rwnd</code>) in every ACK header. The sender advances its window as ACKs arrive.'
      ],
      callout: {
        kind: 'tip',
        text: 'If rwnd drops to 0 (Zero Window), sender halts transmission and sends periodic 1-byte Window Probes.'
      },
      metrics: { rtt_ms: '45ms', cwnd_pkts: '32', state: 'STREAMING', throughput_mbps: '85' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Sender', tags: [{ text: 'Window [1001..1048]', icon: 'layers' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Receiver', 'Buffer: 64KB'], sub: 'rwnd=65535' }),
          card: S({ x: -2, y: 14 }, 'Sliding Window Buffer', [
            '[Bytes Acked] [Sent, unacked] [Usable Window] [Can\'t send]',
            'Byte 1..1000: ACKed by receiver',
            'Byte 1001..1032: In-flight on wire (unacked)',
            'Byte 1033..1064: Ready to transmit within rwnd'
          ], { icon: 'layers' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Data Packets / ACKs' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.8 }]
      }
    },
    {
      short: 'Slow Start',
      chapter: 'technique',
      title: 'Congestion Control: Slow Start',
      body: [
        'While flow control protects the receiver, congestion control protects the network routers from packet drop collapse.',
        'TCP begins in <b>Slow Start</b> with an initial congestion window (<code>initcwnd ≈ 10 MSS</code>). For every ACK received, cwnd grows exponentially until reaching <code>ssthresh</code>.'
      ],
      callout: {
        kind: 'insight',
        text: 'Exponential growth: 10 MSS → 20 MSS → 40 MSS → 80 MSS in 4 round trips.'
      },
      metrics: { rtt_ms: '45ms', cwnd_pkts: '64', state: 'EXPONENTIAL', throughput_mbps: '240' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Sender', tags: [{ text: 'cwnd: 10 → 64 MSS', tone: 'green', icon: 'trendingUp' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Receiver', 'Port 443'], sub: 'ssthresh=64' }),
          card: S({ x: -2, y: 14 }, 'Slow Start Math', [
            'Round 1: cwnd = 10 packets  (15 KB)',
            'Round 2: cwnd = 20 packets  (30 KB)',
            'Round 3: cwnd = 40 packets  (60 KB)',
            'Round 4: cwnd = 64 (Reaches ssthresh -> Congestion Avoidance)'
          ], { icon: 'trendingUp' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Burst Window' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 3.5 }]
      }
    },
    {
      short: 'Packet Loss',
      chapter: 'deep',
      title: 'Packet Loss & 3 Duplicate ACKs (Fast Retransmit)',
      body: [
        'When packet #3 is lost in transit, the receiver continues receiving #4, #5, #6 and echoes duplicate ACKs for packet #2.',
        'Upon receiving <b>3 Duplicate ACKs</b>, TCP immediately triggers <b>Fast Retransmit</b> of packet #3 without waiting for the slow Retransmission Timeout (RTO) timer.'
      ],
      callout: {
        kind: 'tip',
        text: 'Fast Retransmit saves hundreds of milliseconds compared to a retransmission timeout timer expiration.'
      },
      metrics: { rtt_ms: '48ms', cwnd_pkts: '32', state: 'FAST RETRANSMIT', throughput_mbps: '110' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Sender', tags: [{ text: 'DupAck #3 -> Retransmit', tone: 'amber', icon: 'refresh' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Receiver', 'Out-of-order'], sub: 'Acking #2 repeatedly' }),
          card: S({ x: -2, y: 14 }, 'Fast Recovery Event', [
            'Packet #3: DROPPED BY ROUTER',
            'Packet #4 arrives -> ACK #2 (Dup 1)',
            'Packet #5 arrives -> ACK #2 (Dup 2)',
            'Packet #6 arrives -> ACK #2 (Dup 3) -> Immediate Retransmit #3',
            'ssthresh = cwnd / 2; cwnd = ssthresh + 3'
          ], { icon: 'alert' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Duplicate ACKs' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 2.2 }]
      }
    },
    {
      short: 'Cubic vs BBR',
      chapter: 'deep',
      title: 'Modern Congestion Control: Cubic vs BBR',
      body: [
        'Traditional algorithms (TCP Reno, Cubic) rely on packet loss as the congestion signal, filling network router buffers (Bufferbloat).',
        'Google BBR (Bottleneck Bandwidth and RTT) models the real physical pipe: tracking max bandwidth and min RTT to maximize throughput without buffer queueing delay.'
      ],
      callout: {
        kind: 'insight',
        text: 'BBR keeps latency minimal on cellular and congested links where loss-based algorithms collapse.'
      },
      metrics: { rtt_ms: '45ms', cwnd_pkts: 'BDP Model', state: 'BBR PACING', throughput_mbps: '480' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'BBR Sender', tags: [{ text: 'Pacing Rate = Bw x RTT', tone: 'green', icon: 'zap' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['BBR Receiver', 'Zero Bufferbloat'], sub: 'pacing_gain=1.25' }),
          card: S({ x: -2, y: 14 }, 'BBR vs Cubic Comparison', [
            'Cubic: Fills buffer until drop -> High latency + Jitter',
            'BBR: Measures BtlBw (Bandwidth) & RTprop (Round Trip)',
            'Target Inflight = BtlBw * RTprop (Bandwidth Delay Product)',
            'Result: Max throughput with minimum queuing latency'
          ], { icon: 'trendingUp' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'Paced Stream' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 3.2 }]
      }
    },
    {
      short: 'Teardown',
      chapter: 'solution',
      title: '4-Way Wave Connection Teardown (FIN → ACK)',
      body: [
        'Because TCP is full-duplex, each direction of the connection must be closed independently.',
        'Client sends <code>FIN</code> to close its write stream. Server answers with <code>ACK</code> (half-close). Once the server finishes sending remaining responses, it sends its own <code>FIN</code>.'
      ],
      callout: {
        kind: 'tip',
        text: 'A half-closed socket can still receive data from the other party.'
      },
      metrics: { rtt_ms: '45ms', cwnd_pkts: '0', state: 'FIN_WAIT_2', throughput_mbps: '0' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'FIN_WAIT_2', icon: 'clock' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'Port 443'], sub: 'LAST_ACK' }),
          card: S({ x: -2, y: 14 }, 'Teardown Packet Sequence', [
            '1. Client -> Server [FIN] Seq=2000 (FIN_WAIT_1)',
            '2. Server -> Client [ACK] Ack=2001 (CLOSE_WAIT)',
            '3. Server -> Client [FIN] Seq=8000 (LAST_ACK)',
            '4. Client -> Server [ACK] Ack=8001 (Client enters TIME_WAIT)'
          ], { icon: 'network' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'both', label: 'FIN / ACK' })
        },
        flows: [{ route: ['cs'], bounce: true, rate: 1.5 }]
      }
    },
    {
      short: 'TIME_WAIT',
      chapter: 'solution',
      title: 'The TIME_WAIT State (2MSL) & Port Exhaustion',
      body: [
        'The party that initiates the active close must stay in <code>TIME_WAIT</code> for 2 MSL (Maximum Segment Lifetime, typically 60s).',
        'This ensures delayed in-flight packets die out and ensures the final ACK arrived at the server. Excessive TIME_WAIT sockets cause ephemeral port exhaustion (65,535 limit).'
      ],
      callout: {
        kind: 'insight',
        text: 'Fix port exhaustion: Enable HTTP Keep-Alive, connection pooling, and tcp_tw_reuse.'
      },
      metrics: { rtt_ms: '—', cwnd_pkts: '0', state: 'TIME_WAIT (60s)', throughput_mbps: '0' },
      scene: {
        entities: {
          client: y(-10, -8, { form: 'phone', label: 'Client', tags: [{ text: 'TIME_WAIT 2MSL', tone: 'amber', icon: 'hourglass' }] }),
          server: d(6, 8, { s: 4.8, h: 50, color: 'blue', glyph: 'server', label: ['Server', 'Socket Closed'], sub: 'CLOSED' }),
          card: S({ x: -2, y: 14 }, 'Why 2MSL is Critical', [
            '1. Reliable ACK: If final ACK lost, server re-sends FIN',
            '2. Packet drain: Old duplicate packets cannot corrupt new sockets',
            'Danger: 50,000 requests/s with no keep-alive exhausts all ephemeral ports',
            'Solution: sysctl net.ipv4.tcp_tw_reuse = 1 + Connection Pools'
          ], { icon: 'hourglass' })
        },
        links: {
          cs: h('client', 'server', ['client', 'server'], { heads: 'end', label: 'Socket Draining' })
        },
        flows: [{ route: ['cs'], bounce: false, rate: 0.8 }]
      }
    }
  ]
};
