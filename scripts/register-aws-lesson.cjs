const fs = require('fs');

const awsLessonCode = `
// --- AWS Cloud Architecture Lesson ---
const aws_h = (from, to, pts, opts = {}) => ({ from, to, pts, heads: 'end', ...opts });
const aws_d = (x, y, opts = {}) => ({ type: 'block', x, y, color: 'blue', glyph: 'server', ...opts });
const aws_f = (x, y, opts = {}) => ({ type: 'block', x, y, color: 'orange', glyph: 'balancer', label: ['ALB', 'Dual-AZ'], pills: 'below', ...opts });
const aws_b = (x, y, opts = {}) => ({ type: 'db', x, y, ...opts });
const aws_y = (x, y, opts = {}) => ({ type: 'device', x, y, ...opts });
const aws_z = (bounds, label, opts = {}) => ({ type: 'zone', ...bounds, label, ...opts });

const awsCloudLesson = {
  id: 'aws-cloud',
  title: 'AWS Cloud Multi-AZ Resilience',
  summary: 'Explore how a fault-tolerant AWS architecture handles traffic, auto-scales across AZs, and self-heals when a full data center goes dark.',
  minutes: 12,
  level: 'intermediate',
  metrics: ['az_health', 'latency', 'ecs_tasks', 'aurora_lag', 'total_uptime'],
  legend: ['req', 'res', ['ping', 'health check'], 'fail'],
  goals: [
    { text: 'Single AZ fragility: why 1 instance in 1 AZ is a single point of failure', step: 1 },
    { text: 'Route 53 & CloudFront Edge caching for global reach', step: 2 },
    { text: 'Application Load Balancer health checking across multiple AZs', step: 3 },
    { text: 'Multi-AZ ECS Fargate auto-scaling and Redis caching', step: 4 },
    { text: 'Amazon Aurora Multi-AZ replication and sub-30s failover', step: 5 },
    { text: 'Disaster test: Kill AZ-1a and watch seamless self-healing', step: 7 }
  ],
  steps: [
    {
      short: 'Single AZ',
      chapter: 'problem',
      title: 'The Single Point of Failure (Single-AZ)',
      body: [
        'A single EC2 instance and a single MySQL database live in one Availability Zone (<code>us-east-1a</code>).',
        'If a power outage, fiber cut, or hardware failure hits that zone, the entire application goes completely dark with zero automated recovery.'
      ],
      callout: {
        kind: 'warn',
        text: 'Never run production workloads in a single Availability Zone. Even high-grade AWS data centers experience periodic local disruptions.'
      },
      changes: ['+ Single EC2 instance in us-east-1a', '+ Single MySQL database', '! High downtime risk'],
      metrics: { az_health: '100%', latency: '85 ms', ecs_tasks: '1 task', aurora_lag: '—', total_uptime: '99.0%' },
      scene: {
        entities: {
          client: aws_y(0, -12, { label: 'users', tags: [{ text: 'https://app.io', icon: 'globe' }] }),
          ec2: aws_d(8, -2, { color: 'yellow', glyph: 'server', label: ['EC2', 'us-east-1a'], cpu: 0.85 }),
          db: aws_b(16, 8, { label: 'MySQL Single', cpu: 0.6 })
        },
        links: {
          c1: aws_h('client', 'ec2', ['client', 'ec2'], { label: 'Direct Traffic', heads: 'both' }),
          d1: aws_h('ec2', 'db', ['ec2', 'db'], { label: 'Read/Write', heads: 'both' })
        },
        flows: [{ route: ['c1', 'd1'], bounce: true, rate: 1.0 }]
      }
    },
    {
      short: 'Edge Layer',
      chapter: 'technique',
      title: 'Global Edge: Route 53 & CloudFront',
      body: [
        'To shield our compute and lower latency worldwide, we introduce <b>Amazon Route 53</b> (Anycast DNS) and <b>Amazon CloudFront</b> (CDN Edge).',
        'CloudFront caches static assets and terminates TLS near the user, cutting round-trip time from 85 ms down to <b>18 ms</b> for cached hits.'
      ],
      callout: {
        kind: 'tip',
        text: 'CloudFront edge locations serve ~80% of read traffic without hitting the origin servers in your VPC.'
      },
      changes: ['+ Route 53 DNS with Latency Routing', '+ CloudFront CDN Edge Distribution', '+ TTFB drops to 18 ms'],
      metrics: { az_health: '100%', latency: '18 ms', ecs_tasks: '1 task', aurora_lag: '—', total_uptime: '99.9%' },
      scene: {
        entities: {
          client: aws_y(0, -12, { label: 'users', tags: [{ text: 'global edge', icon: 'globe' }] }),
          r53: aws_d(0, 0, { color: 'yellow', glyph: 'globe', label: ['Route 53'], sub: 'Latency Routing' }),
          cf: aws_d(8, -6, { color: 'purple', glyph: 'shield', label: ['CloudFront'], sub: 'Edge Cache' }),
          ec2: aws_d(16, -2, { color: 'blue', glyph: 'server', label: ['Origin VPC'], cpu: 0.35 })
        },
        links: {
          dns: aws_h('client', 'r53', ['client', 'r53'], { label: 'DNS Query', heads: 'both' }),
          edge: aws_h('client', 'cf', ['client', 'cf'], { label: 'HTTPS / TLS 1.3', heads: 'both' }),
          origin: aws_h('cf', 'ec2', ['cf', 'ec2'], { label: 'Origin Fetch', heads: 'both' })
        },
        flows: [{ route: ['edge'], bounce: true, rate: 1.5 }]
      }
    },
    {
      short: 'Dual-AZ ALB',
      chapter: 'technique',
      title: 'Application Load Balancer across AZs',
      body: [
        'We deploy an <b>Application Load Balancer (ALB)</b> with nodes in both <code>us-east-1a</code> and <code>us-east-1b</code>.',
        'The ALB automatically routes incoming HTTP requests to healthy compute instances and performs active health checking every 5 seconds.'
      ],
      changes: ['+ Dual-AZ Application Load Balancer', '+ Layer 7 path-based routing', '+ Continuous health checking'],
      metrics: { az_health: '100%', latency: '22 ms', ecs_tasks: '2 tasks', aurora_lag: '—', total_uptime: '99.95%' },
      scene: {
        entities: {
          client: aws_y(0, -12, { label: 'users' }),
          alb: aws_f(0, 0, { color: 'orange', glyph: 'balancer', label: ['ALB', 'Dual-AZ'] }),
          srv_a: aws_d(10, -6, { color: 'blue', glyph: 'server', label: ['Target AZ-1a'], cpu: 0.25 }),
          srv_b: aws_d(10, 6, { color: 'blue', glyph: 'server', label: ['Target AZ-1b'], cpu: 0.25 })
        },
        links: {
          in: aws_h('client', 'alb', ['client', 'alb'], { label: 'HTTPS', heads: 'both' }),
          t_a: aws_h('alb', 'srv_a', ['alb', 'srv_a'], { label: 'HTTP /health', heads: 'both' }),
          t_b: aws_h('alb', 'srv_b', ['alb', 'srv_b'], { label: 'HTTP /health', heads: 'both' })
        },
        flows: [{ route: ['in', 't_a'], bounce: true, rate: 0.9 }, { route: ['in', 't_b'], bounce: true, rate: 0.9 }]
      }
    },
    {
      short: 'ECS Auto-scale',
      chapter: 'technique',
      title: 'Stateless ECS Fargate Containers',
      body: [
        'Instead of fixed virtual machines, we run containerized microservices on <b>AWS ECS Fargate</b>.',
        'Tasks are stateless: if traffic surges, the Auto Scaling policy spins up additional tasks in seconds across both AZs without human intervention.'
      ],
      callout: {
        kind: 'tip',
        text: 'Spreading tasks evenly across AZs ensures that losing one zone never cuts compute capacity by more than 50%.'
      },
      changes: ['+ ECS Fargate Serverless Cluster', '+ Target Tracking Auto-Scaling', '+ 4 Container Tasks balanced'],
      metrics: { az_health: '100%', latency: '24 ms', ecs_tasks: '4 tasks', aurora_lag: '—', total_uptime: '99.99%' },
      scene: {
        entities: {
          alb: aws_f(0, 0, { color: 'orange', glyph: 'balancer', label: ['ALB', 'Dual-AZ'] }),
          ecs1: aws_d(10, -8, { color: 'blue', glyph: 'server', label: ['ECS-1 (AZ-a)'], cpu: 0.3 }),
          ecs2: aws_d(10, -2, { color: 'blue', glyph: 'server', label: ['ECS-2 (AZ-a)'], cpu: 0.3 }),
          ecs3: aws_d(10, 4, { color: 'blue', glyph: 'server', label: ['ECS-3 (AZ-b)'], cpu: 0.3 }),
          ecs4: aws_d(10, 10, { color: 'blue', glyph: 'server', label: ['ECS-4 (AZ-b)'], cpu: 0.3 })
        },
        links: {
          l1: aws_h('alb', 'ecs1', ['alb', 'ecs1']),
          l2: aws_h('alb', 'ecs2', ['alb', 'ecs2']),
          l3: aws_h('alb', 'ecs3', ['alb', 'ecs3']),
          l4: aws_h('alb', 'ecs4', ['alb', 'ecs4'])
        },
        flows: [{ route: ['l1'], bounce: true, rate: 0.8 }, { route: ['l3'], bounce: true, rate: 0.8 }]
      }
    },
    {
      short: 'Redis Cache',
      chapter: 'technique',
      title: 'ElastiCache Redis Caching Layer',
      body: [
        'Before queries hit disk, containers check <b>Amazon ElastiCache Redis</b>.',
        'Hot product catalog and session data return in <b>sub-millisecond (<1 ms)</b> latency, relieving database strain by 85%.'
      ],
      changes: ['+ ElastiCache Redis Primary in AZ-1a', '+ Redis Read Replica in AZ-1b', '+ 85% cache hit ratio'],
      metrics: { az_health: '100%', latency: '6 ms', ecs_tasks: '4 tasks', aurora_lag: '< 1 ms', total_uptime: '99.99%' },
      scene: {
        entities: {
          ecs_a: aws_d(0, -6, { color: 'blue', glyph: 'server', label: ['ECS Cluster', 'AZ-1a'] }),
          ecs_b: aws_d(0, 6, { color: 'blue', glyph: 'server', label: ['ECS Cluster', 'AZ-1b'] }),
          redis_p: aws_d(10, -6, { color: 'green', glyph: 'zap', label: ['Redis Master', 'AZ-1a'] }),
          redis_r: aws_d(10, 6, { color: 'green', glyph: 'zap', label: ['Redis Replica', 'AZ-1b'] })
        },
        links: {
          r1: aws_h('ecs_a', 'redis_p', ['ecs_a', 'redis_p'], { label: 'GET /hot-key (<1ms)', heads: 'both' }),
          r2: aws_h('ecs_b', 'redis_r', ['ecs_b', 'redis_r'], { label: 'Read Cache', heads: 'both' }),
          sync: aws_h('redis_p', 'redis_r', ['redis_p', 'redis_r'], { label: 'Replication', style: 'dashed' })
        },
        flows: [{ route: ['r1'], bounce: true, rate: 1.2 }, { route: ['r2'], bounce: true, rate: 1.2 }]
      }
    },
    {
      short: 'Aurora Multi-AZ',
      chapter: 'technique',
      title: 'Amazon Aurora Multi-AZ Cluster',
      body: [
        'For durable relational storage, we deploy <b>Amazon Aurora PostgreSQL</b> with a Primary Writer in AZ-1a and an Aurora Replica in AZ-1b.',
        'Aurora maintains <b>6 copies of data across 3 AZs</b> at the storage layer. Replication lag to the read replica is virtually zero (<10 ms).'
      ],
      callout: {
        kind: 'insight',
        text: 'Unlike standard RDS MySQL which replicates via binary logs, Aurora uses a distributed log-structured storage volume spanning 3 AZs.'
      },
      changes: ['+ Aurora Primary Writer (AZ-1a)', '+ Aurora Read Replica (AZ-1b)', '+ 6-way distributed SSD storage'],
      metrics: { az_health: '100%', latency: '8 ms', ecs_tasks: '4 tasks', aurora_lag: '8 ms', total_uptime: '99.99%' },
      scene: {
        entities: {
          ecs_a: aws_d(0, -6, { color: 'blue', glyph: 'server', label: ['ECS AZ-1a'] }),
          ecs_b: aws_d(0, 6, { color: 'blue', glyph: 'server', label: ['ECS AZ-1b'] }),
          db_p: aws_b(12, -6, { label: 'Aurora Writer', cpu: 0.35, tags: [{ text: 'Primary', tone: 'green' }] }),
          db_r: aws_b(12, 6, { label: 'Aurora Replica', cpu: 0.2, tags: [{ text: 'Standby', tone: 'blue' }] })
        },
        links: {
          w1: aws_h('ecs_a', 'db_p', ['ecs_a', 'db_p'], { label: 'INSERT / UPDATE', heads: 'both' }),
          r1: aws_h('ecs_b', 'db_r', ['ecs_b', 'db_r'], { label: 'SELECT read-only', heads: 'both' }),
          aurora_sync: aws_h('db_p', 'db_r', ['db_p', 'db_r'], { label: 'Shared Storage (6-way)', heads: 'both' })
        },
        flows: [{ route: ['w1'], bounce: true, rate: 0.9 }, { route: ['r1'], bounce: true, rate: 1.1 }]
      }
    },
    {
      short: 'AZ Outage!',
      chapter: 'problem',
      title: 'Disaster Simulation: AZ-1a Goes Down',
      body: [
        '<b>DISASTER STRIKES!</b> An unexpected power grid failure takes down the entire <code>us-east-1a</code> data center.',
        'All compute tasks and the primary database in AZ-1a lose network connectivity instantly.'
      ],
      callout: {
        kind: 'warn',
        text: 'Notice that traffic to AZ-1b is unaffected! The ALB immediately begins draining unhealthy targets.'
      },
      changes: ['! us-east-1a OFFLINE (Power Cut)', '! ECS AZ-1a unhealthy', '! Primary DB unreachable'],
      metrics: { az_health: '50% (AZ-a DOWN)', latency: '35 ms', ecs_tasks: '2 tasks', aurora_lag: 'Failover…', total_uptime: '99.99%' },
      scene: {
        entities: {
          alb: aws_f(0, 0, { color: 'orange', glyph: 'balancer', label: ['ALB', 'Dual-AZ'] }),
          ecs_a: aws_d(10, -6, { color: 'slab', glyph: 'skull', dead: 1, label: ['ECS AZ-1a (DOWN)'], tags: [{ text: 'DOWN', tone: 'red', icon: 'alert' }] }),
          ecs_b: aws_d(10, 6, { color: 'blue', glyph: 'server', label: ['ECS AZ-1b (HEALTHY)'], cpu: 0.75 }),
          db_a: aws_b(20, -6, { label: 'Writer AZ-a (DOWN)', dead: 1, heat: 0.9, tags: [{ text: 'FAILED', tone: 'red' }] }),
          db_b: aws_b(20, 6, { label: 'Replica AZ-b', tags: [{ text: 'Promoting…', tone: 'amber' }] })
        },
        links: {
          fail_link: aws_h('alb', 'ecs_a', ['alb', 'ecs_a'], { style: 'off', label: 'Connection timeout' }),
          live_link: aws_h('alb', 'ecs_b', ['alb', 'ecs_b'], { label: 'Active Route', heads: 'both' })
        },
        flows: [{ route: ['live_link'], bounce: true, rate: 1.8 }]
      }
    },
    {
      short: 'Auto-Healing',
      chapter: 'solution',
      title: 'Automated Failover & Recovery',
      body: [
        'Watch the architecture self-heal in real-time without human intervention:',
        '1. <b>ALB</b> redirects 100% of user traffic to AZ-1b.<br/>2. <b>ECS Auto Scaling</b> detects high CPU on AZ-1b tasks and rapidly spins up 2 replacement tasks in AZ-1b.<br/>3. <b>Aurora</b> promotes the standby replica in AZ-1b to the new Primary Writer in under <b>25 seconds</b>. Zero data loss!'
      ],
      callout: {
        kind: 'tip',
        text: 'RTO (Recovery Time Objective) < 30 seconds. RPO (Recovery Point Objective) = 0 seconds.'
      },
      changes: ['+ Aurora AZ-1b promoted to Writer in 24s', '+ ECS AZ-1b scaled out to 4 tasks', '+ 100% traffic serving normally'],
      metrics: { az_health: 'Resilient on AZ-b', latency: '22 ms', ecs_tasks: '4 tasks in AZ-b', aurora_lag: '0 ms (New Master)', total_uptime: '99.99%' },
      scene: {
        entities: {
          client: aws_y(0, -12, { label: 'users', tags: [{ text: '0 downtime', tone: 'green', icon: 'check' }] }),
          alb: aws_f(0, 0, { color: 'orange', glyph: 'balancer', label: ['ALB', 'Healthy'] }),
          ecs_b1: aws_d(10, 2, { color: 'blue', glyph: 'server', label: ['ECS AZ-b (#1)'], cpu: 0.35 }),
          ecs_b2: aws_d(10, 8, { color: 'blue', glyph: 'server', label: ['ECS AZ-b (#2)'], cpu: 0.35 }),
          db_b: aws_b(20, 5, { label: 'Aurora New Writer', cpu: 0.4, tags: [{ text: 'PRIMARY WRITER', tone: 'green' }] })
        },
        links: {
          c: aws_h('client', 'alb', ['client', 'alb'], { heads: 'both' }),
          l1: aws_h('alb', 'ecs_b1', ['alb', 'ecs_b1'], { heads: 'both' }),
          l2: aws_h('alb', 'ecs_b2', ['alb', 'ecs_b2'], { heads: 'both' }),
          db_l: aws_h('ecs_b1', 'db_b', ['ecs_b1', 'db_b'], { label: 'Active R/W', heads: 'both' })
        },
        flows: [{ route: ['c', 'l1', 'db_l'], bounce: true, rate: 1.4 }, { route: ['c', 'l2'], bounce: true, rate: 1.0 }]
      }
    },
    {
      short: 'Recap',
      chapter: 'recap',
      title: 'AWS Cloud Resilience Checklist',
      body: [
        '<ul class="takeaways">',
        '  <li><b>Multi-AZ VPC:</b> Always deploy subnets across at least 2 (preferably 3) Availability Zones.</li>',
        '  <li><b>Stateless Compute:</b> Keep sessions in Redis or JWT so any container in any AZ can serve any user.</li>',
        '  <li><b>Managed Aurora:</b> Leverage Aurora distributed storage for automated sub-30s failover with 0 data loss.</li>',
        '  <li><b>Edge Defense:</b> Terminate TLS and cache with CloudFront to absorb traffic surges and DDoS attacks.</li>',
        '</ul>'
      ],
      callout: {
        kind: 'next',
        text: 'Next lab: <b>Microservices & Distributed Sagas</b> — learn how services communicate and rollback transactions.'
      },
      metrics: { az_health: '100% Ready', latency: '15 ms', ecs_tasks: 'Dynamic', aurora_lag: '0 ms', total_uptime: '99.999%' },
      scene: {
        entities: {
          client: aws_y(0, -12, { label: 'users', tags: [{ text: 'resilient', tone: 'green' }] }),
          alb: aws_f(0, 0, { color: 'orange', glyph: 'balancer', label: ['ALB', 'Dual-AZ'] }),
          ecs_a: aws_d(10, -6, { color: 'blue', glyph: 'server', label: ['ECS AZ-1a'] }),
          ecs_b: aws_d(10, 6, { color: 'blue', glyph: 'server', label: ['ECS AZ-1b'] }),
          db_a: aws_b(20, -6, { label: 'Aurora Writer', tags: [{ text: 'Active', tone: 'green' }] }),
          db_b: aws_b(20, 6, { label: 'Aurora Standby', tags: [{ text: 'Replica', tone: 'blue' }] })
        },
        links: {
          c: aws_h('client', 'alb', ['client', 'alb'], { heads: 'both' }),
          l_a: aws_h('alb', 'ecs_a', ['alb', 'ecs_a'], { heads: 'both' }),
          l_b: aws_h('alb', 'ecs_b', ['alb', 'ecs_b'], { heads: 'both' }),
          db_sync: aws_h('db_a', 'db_b', ['db_a', 'db_b'], { label: 'Storage Sync', heads: 'both' })
        },
        flows: [{ route: ['c', 'l_a'], bounce: true, rate: 1.0 }, { route: ['c', 'l_b'], bounce: true, rate: 1.0 }]
      }
    }
  ]
};

// Register into lesson database
if (typeof window !== 'undefined') {
  if (window.__nf) {
    window.__nf['aws-cloud'] = awsCloudLesson;
  }
  if (window.__s && !window.__s.some(m => m.id === 'cloud')) {
    window.__s.push({
      id: 'cloud',
      title: 'AWS Cloud',
      color: 'orange',
      lessons: [
        { id: 'aws-cloud', title: 'AWS Multi-AZ Resilience', ready: true }
      ]
    });
  }
}
`;

fs.writeFileSync('public/dts/assets/aws-lesson-snippet.js', awsLessonCode);
console.log('Saved public/dts/assets/aws-lesson-snippet.js');
