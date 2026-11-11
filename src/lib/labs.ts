export interface LabEntry {
  href: string;
  title: string;
  tag: string;
  tagClass: string;
  intro: string;
  desc: string;
  cta: string;
}

export const LABS: LabEntry[] = [
  {
    href: '/lab/sql',
    title: 'SQL EXPLAIN Explorer',
    tag: 'Postgres Engine',
    tagClass: 'border-cyan-500 text-cyan-500',
    intro: 'Seq Scan vs B-Tree, Hash Joins, and fixing Hibernate N+1 queries.',
    desc: 'Visual query execution plans — compare Seq Scan vs B-Tree, dissect Hash Joins, and fix Hibernate N+1 queries.',
    cta: 'Inspect query plans',
  },
  {
    href: '/lab/java',
    title: 'Java & Spring Lab',
    tag: 'Concepts',
    tagClass: 'border-amber-500 text-amber-500',
    intro: 'One page, one tab per concept — pools, virtual threads, proxy chains and container lifecycle.',
    desc: 'Threads, pools, virtual threads, HashMap internals, JVM memory & GC — then Spring mechanics: container lifecycle, AOP proxies, JPA and Security, each drawn.',
    cta: 'Open concept tabs',
  },
  {
    href: '/lab/pathfinding',
    title: 'Pathfinding',
    tag: 'Interactive',
    tagClass: 'border-(--accent) text-(--accent)',
    intro: 'A*, Dijkstra & BFS visualized on a drawable maze.',
    desc: 'Real-time algorithm visualizer for A* Search, Dijkstra, and BFS with maze generation and wall drawing.',
    cta: 'Visualize algorithms',
  },
  {
    href: '/lab/system-design',
    title: 'System Architecture Design',
    tag: 'Architecture',
    tagClass: 'border-emerald-500 text-emerald-500',
    intro: 'Cloudflare Edge-First & C4 Container Architecture with interactive 8-step flow.',
    desc: 'End-to-end cloud architecture decoupling Data Plane, Control Plane, and Zero-Trust persistence with an interactive 8-step flow.',
    cta: 'View system architecture',
  },
  {
    href: '/lab/spider',
    title: 'Spider',
    tag: 'Playable',
    tagClass: 'border-(--accent) text-(--accent)',
    intro: 'Two spiders follow your cursor. Move to draw.',
    desc: 'Interactive web drawing — two spiders follow your cursor. Move to draw.',
    cta: 'Open spider',
  },
];
