// Load Balancer Defense: keep a small web service alive through eight waves of traffic.
// The simulation (Sim) is plain state plus step(dt); the canvas drawing below only reads it.

export {}; // makes this file a module so its constants do not leak into the global scope

type Kind = 'read' | 'write' | 'bot';
type Phase = 'toBalancer' | 'toCache' | 'toServer';
type GameState = 'ready' | 'running' | 'paused' | 'won' | 'lost';

interface Req {
  kind: Kind;
  x: number;
  y: number;
  tx: number;
  ty: number;
  phase: Phase;
  server: Server | null;
  born: number;
}

interface Server {
  index: number;
  alive: boolean;
  deadUntil: number;
  queue: Req[];
  busy: Req | null;
  left: number;
  incoming: number;
}

interface Fx {
  kind: 'drop' | 'ok' | 'hit';
  x: number;
  y: number;
  age: number;
}

interface WaveSpec {
  title: string;
  rps: number;
  spike?: { from: number; to: number; mult: number };
  ddos?: { from: number; to: number; botRps: number };
  crash?: { at: number; duration: number };
}

const W = 960;
const H = 420;
const CLIENT = { x: 70, y: 210 };
const BALANCER = { x: 330, y: 210 };
const CACHE = { x: 500, y: 70 };
const SERVER_X = 770;
const serverY = (i: number): number => 45 + i * 66;

const WAVE_SECONDS = 25;
const START_MONEY = 120;
const START_HEALTH = 100;
const QUEUE_MAX = 10;
const BASE_CAPACITY = 4; // requests per second per server
const REWARD = 0.5;
const WAVE_BONUS = 40;
const TRAVEL_SPEED = 430; // px per second
const MAX_SERVERS = 6;
const LIMITER_FALSE_POSITIVE = 0.003; // share of good requests a rate limiter wrongly drops
const LEVEL_COSTS = [30, 45, 60];

const WAVES: WaveSpec[] = [
  { title: 'Warm-up', rps: 6 },
  { title: 'Lunch rush', rps: 9 },
  { title: 'Flash sale', rps: 11, spike: { from: 14, to: 23, mult: 1.9 } },
  { title: 'A server crashes', rps: 13, crash: { at: 8, duration: 10 } },
  { title: 'Bot flood', rps: 14, ddos: { from: 8, to: 20, botRps: 22 } },
  { title: 'Busy evening', rps: 18 },
  { title: 'Crash during a sale', rps: 18, spike: { from: 6, to: 18, mult: 1.6 }, crash: { at: 10, duration: 10 } },
  { title: 'Black Friday', rps: 22, spike: { from: 5, to: 21, mult: 1.7 }, ddos: { from: 9, to: 21, botRps: 20 }, crash: { at: 14, duration: 9 } },
];

class Sim {
  state: GameState = 'ready';
  time = 0;
  wave = 0;
  waveTime = 0;
  money = START_MONEY;
  health = START_HEALTH;
  ok = 0;
  dropped = 0;
  latencySum = 0;
  banner = 'Press Start. Your service has 2 servers and no extras.';
  bannerAge = 0;

  servers: Server[] = [];
  reqs: Req[] = [];
  fx: Fx[] = [];
  serverCount = 2;
  level = 0;
  cache = false;
  leastConn = false;
  healthChecks = false;
  limiter = false;

  private goodAcc = 0;
  private botAcc = 0;
  private rr = 0;
  private crashed = false;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.state = 'ready';
    this.time = 0;
    this.wave = 0;
    this.waveTime = 0;
    this.money = START_MONEY;
    this.health = START_HEALTH;
    this.ok = 0;
    this.dropped = 0;
    this.latencySum = 0;
    this.banner = 'Press Start. Your service has 2 servers and no extras.';
    this.bannerAge = 0;
    this.serverCount = 2;
    this.level = 0;
    this.cache = false;
    this.leastConn = false;
    this.healthChecks = false;
    this.limiter = false;
    this.goodAcc = 0;
    this.botAcc = 0;
    this.rr = 0;
    this.crashed = false;
    this.reqs = [];
    this.fx = [];
    this.servers = [];
    for (let i = 0; i < this.serverCount; i++) this.servers.push(this.makeServer(i));
  }

  private makeServer(index: number): Server {
    return { index, alive: true, deadUntil: 0, queue: [], busy: null, left: 0, incoming: 0 };
  }

  capacity(): number {
    return BASE_CAPACITY * (1 + 0.5 * this.level);
  }

  say(text: string): void {
    this.banner = text;
    this.bannerAge = 0;
  }

  avgLatency(): number {
    return this.ok > 0 ? this.latencySum / this.ok : 0;
  }

  currentRps(): { good: number; bot: number } {
    if (this.wave >= WAVES.length) return { good: 0, bot: 0 }; // the game is won: no more traffic
    const spec = WAVES[this.wave];
    let good = spec.rps;
    let bot = 0;
    if (spec.spike && this.waveTime >= spec.spike.from && this.waveTime < spec.spike.to) good *= spec.spike.mult;
    if (spec.ddos && this.waveTime >= spec.ddos.from && this.waveTime < spec.ddos.to) bot = spec.ddos.botRps;
    return { good, bot };
  }

  // ── purchases ──────────────────────────────────────────────────────────────
  cost(item: Upgrade): number | null {
    switch (item) {
      case 'server':
        return this.serverCount >= MAX_SERVERS ? null : 40;
      case 'level':
        return this.level >= LEVEL_COSTS.length ? null : LEVEL_COSTS[this.level];
      case 'cache':
        return this.cache ? null : 70;
      case 'leastConn':
        return this.leastConn ? null : 50;
      case 'health':
        return this.healthChecks ? null : 35;
      case 'limiter':
        return this.limiter ? null : 45;
    }
  }

  buy(item: Upgrade): boolean {
    if (this.state !== 'running' && this.state !== 'paused') return false;
    const price = this.cost(item);
    if (price === null || this.money < price) return false;
    this.money -= price;
    switch (item) {
      case 'server':
        this.servers.push(this.makeServer(this.serverCount));
        this.serverCount++;
        break;
      case 'level':
        this.level++;
        break;
      case 'cache':
        this.cache = true;
        break;
      case 'leastConn':
        this.leastConn = true;
        break;
      case 'health':
        this.healthChecks = true;
        break;
      case 'limiter':
        this.limiter = true;
        break;
    }
    return true;
  }

  // ── simulation ─────────────────────────────────────────────────────────────
  start(): void {
    if (this.state === 'ready') {
      this.state = 'running';
      this.beginWave();
    }
  }

  private beginWave(): void {
    this.waveTime = 0;
    this.crashed = false;
    this.say(`Wave ${this.wave + 1} of ${WAVES.length}: ${WAVES[this.wave].title}`);
  }

  private spawn(kind: Kind): void {
    this.reqs.push({
      kind,
      x: CLIENT.x,
      y: CLIENT.y + (Math.random() - 0.5) * 70,
      tx: BALANCER.x,
      ty: BALANCER.y,
      phase: 'toBalancer',
      server: null,
      born: this.time,
    });
  }

  private lose(req: Req, penalty: number): void {
    if (req.kind !== 'bot') {
      this.dropped++;
      this.health -= penalty;
    }
    this.fx.push({ kind: 'drop', x: req.x, y: req.y, age: 0 });
  }

  /** Sends the request to a server; false when it was dropped instead. */
  private route(req: Req): boolean {
    const pool = this.healthChecks ? this.servers.filter((s) => s.alive) : this.servers;
    if (pool.length === 0) {
      this.lose(req, 1);
      return false;
    }
    let target: Server;
    if (this.leastConn) {
      const load = (s: Server): number => s.queue.length + (s.busy ? 1 : 0) + s.incoming;
      target = pool.reduce((best, s) => (load(s) < load(best) ? s : best), pool[0]);
    } else {
      target = pool[this.rr % pool.length];
      this.rr++;
    }
    req.phase = 'toServer';
    req.server = target;
    req.tx = SERVER_X - 40;
    req.ty = serverY(target.index);
    target.incoming++;
    return true;
  }

  private arrive(req: Req): boolean {
    // returns true when the request leaves the moving list
    if (req.phase === 'toBalancer') {
      if (req.kind === 'bot' && this.limiter && Math.random() < 0.85) {
        this.lose(req, 0);
        return true;
      }
      if (req.kind !== 'bot' && this.limiter && Math.random() < LIMITER_FALSE_POSITIVE) {
        this.lose(req, 1);
        return true;
      }
      if (req.kind === 'read' && this.cache && Math.random() < 0.45) {
        req.phase = 'toCache';
        req.tx = CACHE.x;
        req.ty = CACHE.y;
        return false;
      }
      return !this.route(req);
    }
    if (req.phase === 'toCache') {
      this.ok++;
      this.money += REWARD / 2;
      this.latencySum += this.time - req.born;
      this.fx.push({ kind: 'hit', x: req.x + 58, y: req.y, age: 0 });
      return true;
    }
    const server = req.server;
    if (!server) return true;
    server.incoming--;
    if (!server.alive || server.queue.length >= QUEUE_MAX) {
      this.lose(req, 1);
      return true;
    }
    server.queue.push(req);
    return true;
  }

  step(dt: number): void {
    if (this.state !== 'running') return;
    this.time += dt;
    const prevWaveTime = this.waveTime;
    this.waveTime += dt;
    this.bannerAge += dt;
    const crossed = (at: number): boolean => prevWaveTime < at && this.waveTime >= at;

    const spec = WAVES[this.wave];
    if (spec.crash && !this.crashed && crossed(spec.crash.at)) {
      this.crashed = true;
      const victims = this.servers.filter((s) => s.alive);
      const victim = victims[Math.floor(Math.random() * victims.length)];
      if (victim) {
        victim.alive = false;
        victim.deadUntil = this.time + spec.crash.duration;
        const stranded = [...victim.queue, ...(victim.busy ? [victim.busy] : [])];
        victim.queue = [];
        victim.busy = null;
        for (const r of stranded) this.lose({ ...r, x: SERVER_X, y: serverY(victim.index) }, 1);
        this.say(
          this.healthChecks
            ? `Server ${victim.index + 1} crashed. Health checks route around it.`
            : `Server ${victim.index + 1} crashed and the balancer keeps sending traffic to it. Health checks would skip it.`,
        );
      }
    }
    if (spec.spike && crossed(spec.spike.from)) this.say(`Traffic spike x${spec.spike.mult}!`);
    if (spec.ddos && crossed(spec.ddos.from)) this.say('Bot flood: purple requests are junk. A rate limiter drops them early.');

    for (const s of this.servers) if (!s.alive && this.time >= s.deadUntil) s.alive = true;

    const rps = this.currentRps();
    this.goodAcc += rps.good * dt;
    this.botAcc += rps.bot * dt;
    while (this.goodAcc >= 1) {
      this.goodAcc -= 1;
      this.spawn(Math.random() < 0.7 ? 'read' : 'write');
    }
    while (this.botAcc >= 1) {
      this.botAcc -= 1;
      this.spawn('bot');
    }

    for (let i = this.reqs.length - 1; i >= 0; i--) {
      const r = this.reqs[i];
      const dx = r.tx - r.x;
      const dy = r.ty - r.y;
      const dist = Math.hypot(dx, dy);
      const move = TRAVEL_SPEED * dt;
      if (dist <= move) {
        r.x = r.tx;
        r.y = r.ty;
        if (this.arrive(r)) this.reqs.splice(i, 1);
      } else {
        r.x += (dx / dist) * move;
        r.y += (dy / dist) * move;
      }
    }

    for (const s of this.servers) {
      if (!s.alive) continue;
      if (!s.busy && s.queue.length > 0) {
        s.busy = s.queue.shift() ?? null;
        s.left = 1 / this.capacity();
      }
      if (s.busy) {
        s.left -= dt;
        if (s.left <= 0) {
          const done = s.busy;
          s.busy = null;
          if (done.kind !== 'bot') {
            this.ok++;
            this.money += REWARD;
            this.latencySum += this.time - done.born;
            this.fx.push({ kind: 'ok', x: SERVER_X + 66, y: serverY(s.index) - 4, age: 0 });
          }
        }
      }
    }

    for (let i = this.fx.length - 1; i >= 0; i--) {
      this.fx[i].age += dt;
      if (this.fx[i].age > 0.7) this.fx.splice(i, 1);
    }

    if (this.health <= 0) {
      this.health = 0;
      this.state = 'lost';
      this.say(`Your service went down in wave ${this.wave + 1}.`);
      return;
    }
    if (this.waveTime >= WAVE_SECONDS) {
      this.wave++;
      if (this.wave >= WAVES.length) {
        this.state = 'won';
        this.say('You survived every wave!');
        return;
      }
      this.money += WAVE_BONUS;
      this.beginWave();
    }
  }
}

type Upgrade = 'server' | 'level' | 'cache' | 'leastConn' | 'health' | 'limiter';

const UPGRADE_KEYS: Record<string, Upgrade> = {
  '1': 'server',
  '2': 'level',
  '3': 'cache',
  '4': 'leastConn',
  '5': 'health',
  '6': 'limiter',
};

const BEST_KEY = 'dawn_lbdef_best_v1';

function readBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
}

function writeBest(value: number): void {
  try {
    localStorage.setItem(BEST_KEY, String(value));
  } catch {
    /* private mode: the best score just is not kept */
  }
}

let teardown: (() => void) | null = null;

function stopLab(): void {
  teardown?.();
  teardown = null;
}

function initLab(): void {
  stopLab();
  const root = document.getElementById('lbd-root');
  const canvas = document.getElementById('lbd-canvas') as HTMLCanvasElement | null; // id is fixed in lb-defense.astro
  if (!root || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const sim = new Sim();
  const controller = new AbortController();
  const { signal } = controller;
  let raf = 0;
  let last = performance.now();
  let hudClock = 0;

  // The canvas is drawn at its real on-screen size (times the device pixel ratio) so lines and text stay
  // sharp. Logical coordinates stay 960x420; `ui` scales text and strokes up when the canvas is shown smaller.
  let ui = 1;
  const resize = (): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(((rect.width * H) / W) * ratio);
    ui = Math.min(1.6, Math.max(1, W / rect.width));
  };
  resize();
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  const $ = (id: string): HTMLElement | null => document.getElementById(id);
  const startBtn = $('lbd-start');
  const pauseBtn = $('lbd-pause');
  const overlay = $('lbd-overlay');
  const overlayTitle = $('lbd-overlay-title');
  const overlayText = $('lbd-overlay-text');
  const bestEl = $('lbd-best');
  const upgradeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-lbd-buy]'));

  const colors = { fg: '#111', dim: '#555', faint: '#888', border: '#ccc', panel: '#fff', bg: '#f4f4f5', accent: '#e11d48' };
  let themeKey = '';
  const refreshColors = (): void => {
    const key = `${document.documentElement.className}|${document.documentElement.dataset.theme ?? ''}`;
    if (key === themeKey) return;
    themeKey = key;
    const cs = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string): string => cs.getPropertyValue(name).trim() || fallback;
    colors.fg = read('--fg', colors.fg);
    colors.dim = read('--fg-dim', colors.dim);
    colors.faint = read('--fg-faint', colors.faint);
    colors.border = read('--border', colors.border);
    colors.panel = read('--bg-alt', colors.panel);
    colors.bg = read('--bg', colors.bg);
    colors.accent = read('--accent', colors.accent);
  };

  const MONO = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

  const box = (x: number, y: number, w: number, h: number, label: string, opts: { dashed?: boolean; dim?: boolean } = {}): void => {
    ctx.save();
    ctx.font = `700 ${14 * ui}px ${MONO}`;
    w = Math.max(w, ctx.measureText(label).width + 22 * ui); // never let the label spill out of its box
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - h / 2, w, h, 10);
    ctx.fillStyle = colors.panel; // opaque, so a link behind a dimmed box does not show through its label
    ctx.fill();
    ctx.globalAlpha = opts.dim ? 0.62 : 1;
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = opts.dashed ? colors.faint : colors.dim;
    ctx.lineWidth = 2 * ui;
    if (opts.dashed) ctx.setLineDash([6 * ui, 5 * ui]);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = colors.fg;
    ctx.font = `700 ${14 * ui}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
    ctx.restore();
  };

  const caption = (text: string, x: number, y: number): void => {
    ctx.fillStyle = colors.dim;
    ctx.font = `600 ${12.5 * ui}px ${MONO}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(text, x, y);
  };

  const draw = (): void => {
    refreshColors();
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.font = `700 ${14 * ui}px ${MONO}`;
    const lbW = Math.max(130, ctx.measureText('load balancer').width + 22 * ui);
    const limW = Math.max(84, ctx.measureText('limiter').width + 22 * ui);
    const limX = BALANCER.x - lbW / 2 - limW / 2 - 26;

    // links
    ctx.strokeStyle = colors.faint;
    ctx.lineWidth = 2 * ui;
    ctx.beginPath();
    ctx.moveTo(CLIENT.x + 34, CLIENT.y);
    ctx.lineTo(BALANCER.x - lbW / 2, BALANCER.y);
    for (const s of sim.servers) {
      ctx.moveTo(BALANCER.x + lbW / 2, BALANCER.y);
      ctx.lineTo(SERVER_X - 46, serverY(s.index));
    }
    if (sim.cache) {
      ctx.moveTo(BALANCER.x + lbW / 4, BALANCER.y - 30);
      ctx.lineTo(CACHE.x - 45, CACHE.y);
    }
    ctx.stroke();

    // clients
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = colors.dim;
      ctx.beginPath();
      ctx.arc(CLIENT.x - 22 + (i % 3) * 22, CLIENT.y - 30 + Math.floor(i / 3) * 30 + (i % 2) * 6, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    caption('users', CLIENT.x, CLIENT.y + 62);

    // balancer, limiter, cache
    box(BALANCER.x, BALANCER.y, 130, 60, 'load balancer');
    caption(sim.leastConn ? 'least connections' : 'round robin', BALANCER.x, BALANCER.y + 50);
    if (sim.healthChecks) caption('health checks on', BALANCER.x, BALANCER.y + 66);
    box(limX, BALANCER.y, limW, 38, 'limiter', { dashed: !sim.limiter, dim: !sim.limiter });
    box(CACHE.x, CACHE.y, 92, 44, 'cache', { dashed: !sim.cache, dim: !sim.cache });

    // servers
    for (let i = 0; i < MAX_SERVERS; i++) {
      const y = serverY(i);
      const s = sim.servers[i];
      if (!s) {
        box(SERVER_X, y, 92, 48, '+', { dashed: true, dim: true });
        continue;
      }
      const load = Math.min(1, s.queue.length / QUEUE_MAX);
      box(SERVER_X, y - 3, 92, 48, s.alive ? `S${i + 1}` : `S${i + 1} down`, { dim: !s.alive });
      if (s.alive) {
        ctx.fillStyle = colors.border;
        ctx.fillRect(SERVER_X - 34, y + 10, 68, 6 * ui);
        ctx.fillStyle = load > 0.8 ? colors.accent : load > 0.5 ? '#f59e0b' : '#16a34a';
        ctx.fillRect(SERVER_X - 34, y + 10, 68 * Math.max(load, s.busy ? 0.06 : 0), 6 * ui);
      }
    }
    caption(`each server ${sim.capacity().toFixed(1)} req/s`, SERVER_X, H - 8);

    // requests, with a thin outline so they stand out from the lines
    const radius = 5.5 * Math.min(ui, 1.3);
    ctx.lineWidth = 1.5 * ui;
    ctx.strokeStyle = colors.panel;
    for (const r of sim.reqs) {
      ctx.fillStyle = r.kind === 'bot' ? '#a855f7' : r.kind === 'write' ? '#16a34a' : '#0ea5e9';
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    for (const f of sim.fx) {
      ctx.globalAlpha = Math.max(0, 1 - f.age / 0.7);
      if (f.kind === 'drop') {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 3 * Math.min(ui, 1.4);
        const o = f.age * 20;
        ctx.beginPath();
        ctx.moveTo(f.x - 6, f.y - 6 + o);
        ctx.lineTo(f.x + 6, f.y + 6 + o);
        ctx.moveTo(f.x + 6, f.y - 6 + o);
        ctx.lineTo(f.x - 6, f.y + 6 + o);
        ctx.stroke();
        ctx.strokeStyle = colors.panel;
      } else {
        ctx.fillStyle = f.kind === 'hit' ? '#0ea5e9' : '#16a34a';
        ctx.beginPath();
        ctx.arc(f.x, f.y - f.age * 24, 5 + f.age * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  };

  const setText = (id: string, text: string): void => {
    const el = $(id);
    if (el && el.textContent !== text) el.textContent = text;
  };

  const updateHud = (): void => {
    const spec = WAVES[Math.min(sim.wave, WAVES.length - 1)];
    const rps = sim.currentRps();
    setText('lbd-wave', `${Math.min(sim.wave + 1, WAVES.length)} / ${WAVES.length}`);
    setText('lbd-wave-title', spec.title);
    setText('lbd-money', `$${Math.floor(sim.money)}`);
    setText('lbd-health', String(Math.max(0, Math.round(sim.health))));
    setText('lbd-rps', `${Math.round(rps.good + rps.bot)}/s`);
    setText('lbd-ok', String(sim.ok));
    setText('lbd-drop', String(sim.dropped));
    setText('lbd-latency', sim.ok ? `${sim.avgLatency().toFixed(1)}s` : '-');
    setText('lbd-banner', sim.banner);
    const healthBar = $('lbd-health-bar');
    if (healthBar) healthBar.style.width = `${Math.max(0, sim.health)}%`;
    const waveBar = $('lbd-wave-bar');
    if (waveBar) waveBar.style.width = `${Math.min(100, (sim.waveTime / WAVE_SECONDS) * 100)}%`;
    for (const button of upgradeButtons) {
      const item = button.dataset.lbdBuy as Upgrade; // values come from the buttons in lb-defense.astro
      const price = sim.cost(item);
      const costEl = button.querySelector<HTMLElement>('[data-lbd-cost]');
      if (costEl) costEl.textContent = price === null ? 'owned' : `$${price}`;
      button.disabled = price === null || sim.money < price || (sim.state !== 'running' && sim.state !== 'paused');
      button.dataset.maxed = String(price === null);
    }
    root.dataset.state = sim.state;
    root.dataset.wave = String(sim.wave + 1);
    root.dataset.health = String(Math.round(sim.health));
    root.dataset.money = String(Math.floor(sim.money));
    root.dataset.ok = String(sim.ok);
    if (pauseBtn) pauseBtn.textContent = sim.state === 'paused' ? 'Resume (Space)' : 'Pause (Space)';
  };

  const showOverlay = (title: string, text: string, button: string): void => {
    if (!overlay || !overlayTitle || !overlayText || !startBtn) return;
    overlayTitle.textContent = title;
    overlayText.textContent = text;
    startBtn.textContent = button;
    overlay.classList.remove('hidden');
  };

  const finish = (): void => {
    const score = Math.round(sim.ok + Math.max(0, sim.health) * 5 + (sim.state === 'won' ? 500 : sim.wave * 40));
    const best = readBest();
    const record = score > best;
    if (record) writeBest(score);
    if (bestEl) bestEl.textContent = String(Math.max(score, best));
    const summary = `${sim.ok} requests served, ${sim.dropped} dropped, average latency ${sim.avgLatency().toFixed(1)}s. Score ${score}${record ? ' (new best!)' : ''}.`;
    if (sim.state === 'won') showOverlay('You survived Black Friday', summary, 'Play again');
    else showOverlay('Your service went down', summary, 'Try again');
    window.umami?.track('lbdef-finish', { result: sim.state, wave: Math.min(sim.wave + 1, WAVES.length), score });
  };

  const frame = (now: number): void => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const before = sim.state;
    sim.step(dt);
    if (before === 'running' && (sim.state === 'won' || sim.state === 'lost')) finish();
    draw();
    hudClock += dt;
    if (hudClock > 0.1 || sim.state !== before) {
      hudClock = 0;
      updateHud();
    }
    raf = requestAnimationFrame(frame);
  };

  const begin = (): void => {
    if (sim.state === 'won' || sim.state === 'lost') sim.reset();
    sim.start();
    overlay?.classList.add('hidden');
    updateHud();
  };

  const togglePause = (): void => {
    if (sim.state === 'running') sim.state = 'paused';
    else if (sim.state === 'paused') {
      sim.state = 'running';
      last = performance.now();
    }
    updateHud();
  };

  startBtn?.addEventListener('click', begin, { signal });
  pauseBtn?.addEventListener('click', togglePause, { signal });
  document.getElementById('lbd-restart')?.addEventListener(
    'click',
    () => {
      sim.reset();
      showOverlay('Load Balancer Defense', 'Keep the service alive through 8 waves. Buy upgrades as traffic grows.', 'Start defense');
      updateHud();
    },
    { signal },
  );
  upgradeButtons.forEach((button) =>
    button.addEventListener(
      'click',
      () => {
        if (sim.buy(button.dataset.lbdBuy as Upgrade)) updateHud(); // values come from lb-defense.astro
      },
      { signal },
    ),
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      if (e.key === ' ' && (sim.state === 'running' || sim.state === 'paused')) {
        e.preventDefault();
        togglePause();
      } else if (UPGRADE_KEYS[e.key]) {
        if (sim.buy(UPGRADE_KEYS[e.key])) updateHud();
      }
    },
    { signal },
  );
  const onHidden = (): void => {
    if (document.hidden && sim.state === 'running') togglePause();
  };
  document.addEventListener('visibilitychange', onHidden, { signal });

  const best = readBest();
  if (bestEl) bestEl.textContent = best ? String(best) : '-';
  showOverlay('Load Balancer Defense', 'Keep the service alive through 8 waves. Buy upgrades as traffic grows.', 'Start defense');
  updateHud();
  raf = requestAnimationFrame(frame);

  teardown = () => {
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    controller.abort();
  };
}

initLab();
document.addEventListener('astro:page-load', initLab);
document.addEventListener('astro:before-swap', stopLab);
