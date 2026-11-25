/**
 * Interactive Boids Flock Simulation on HTML5 Canvas.
 * Implements Reynolds' three steering rules (Separation, Alignment, Cohesion)
 * plus mouse cursor attraction / repulsion.
 */

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hueShift: number;
}

type CursorMode = 'attract' | 'repel';

const BOID_COUNT = 110;
const MAX_SPEED = 3.2;
const MIN_SPEED = 1.4;
const PERCEPTION_RADIUS = 64;
const SEPARATION_RADIUS = 26;
const CURSOR_RADIUS = 170;

function initBoidsLab(): void {
  const canvas = document.getElementById('boids-canvas') as HTMLCanvasElement | null;
  if (!canvas || canvas.dataset.initialized === '1') return;
  canvas.dataset.initialized = '1';

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const modeBtn = document.getElementById('boids-mode') as HTMLButtonElement | null;
  const scatterBtn = document.getElementById('boids-scatter') as HTMLButtonElement | null;
  const pauseBtn = document.getElementById('boids-pause') as HTMLButtonElement | null;

  let width = 0;
  let height = 0;
  let mode: CursorMode = 'attract';
  let paused = false;
  let rafId = 0;

  const pointer = { x: 0, y: 0, active: false };
  const boids: Boid[] = [];

  function resize(): void {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(300, Math.floor(rect.width));
    height = Math.max(260, Math.floor(rect.height));
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function spawnBoids(): void {
    boids.length = 0;
    for (let i = 0; i < BOID_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
      boids.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        hueShift: i % 3,
      });
    }
  }

  function updateBoids(): void {
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      let sepX = 0;
      let sepY = 0;
      let aliX = 0;
      let aliY = 0;
      let cohX = 0;
      let cohY = 0;
      let neighbors = 0;

      for (let j = 0; j < boids.length; j++) {
        if (i === j) continue;
        const other = boids[j];
        const dx = other.x - b.x;
        const dy = other.y - b.y;
        const distSq = dx * dx + dy * dy;

        if (distSq > 0 && distSq < PERCEPTION_RADIUS * PERCEPTION_RADIUS) {
          const dist = Math.sqrt(distSq);
          aliX += other.vx;
          aliY += other.vy;
          cohX += other.x;
          cohY += other.y;
          neighbors++;

          if (dist < SEPARATION_RADIUS) {
            const push = (SEPARATION_RADIUS - dist) / SEPARATION_RADIUS;
            sepX -= (dx / dist) * push;
            sepY -= (dy / dist) * push;
          }
        }
      }

      if (neighbors > 0) {
        aliX /= neighbors;
        aliY /= neighbors;
        b.vx += (aliX - b.vx) * 0.045;
        b.vy += (aliY - b.vy) * 0.045;

        cohX = cohX / neighbors - b.x;
        cohY = cohY / neighbors - b.y;
        b.vx += cohX * 0.004;
        b.vy += cohY * 0.004;
      }

      b.vx += sepX * 0.22;
      b.vy += sepY * 0.22;

      if (pointer.active) {
        const dx = pointer.x - b.x;
        const dy = pointer.y - b.y;
        const distSq = dx * dx + dy * dy;
        if (distSq > 1 && distSq < CURSOR_RADIUS * CURSOR_RADIUS) {
          const dist = Math.sqrt(distSq);
          const strength = (1 - dist / CURSOR_RADIUS) * 0.35;
          const sign = mode === 'attract' ? 1 : -1.6;
          b.vx += (dx / dist) * strength * sign;
          b.vy += (dy / dist) * strength * sign;
        }
      }

      // Soft edge steering keeps flock inside view without harsh teleporting
      const margin = 48;
      if (b.x < margin) b.vx += 0.18;
      if (b.x > width - margin) b.vx -= 0.18;
      if (b.y < margin) b.vy += 0.18;
      if (b.y > height - margin) b.vy -= 0.18;

      const speed = Math.hypot(b.vx, b.vy) || 0.001;
      const clamped = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
      b.vx = (b.vx / speed) * clamped;
      b.vy = (b.vy / speed) * clamped;

      b.x += b.vx;
      b.y += b.vy;
    }
  }

  function draw(): void {
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? 'rgba(24, 24, 27, 0.28)' : 'rgba(244, 244, 245, 0.32)';
    ctx.fillRect(0, 0, width, height);

    if (pointer.active) {
      ctx.beginPath();
      ctx.arc(pointer.x, pointer.y, 18, 0, Math.PI * 2);
      ctx.strokeStyle = mode === 'attract' ? 'rgba(225, 29, 72, 0.45)' : 'rgba(245, 158, 11, 0.55)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    const palette = isDark
      ? ['#fb7185', '#f472b6', '#fbbf24']
      : ['#e11d48', '#db2777', '#d97706'];

    for (const b of boids) {
      const angle = Math.atan2(b.vy, b.vx);
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(-5, 3.6);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-5, -3.6);
      ctx.closePath();
      ctx.fillStyle = palette[b.hueShift];
      ctx.fill();
      ctx.restore();
    }
  }

  function tick(): void {
    if (!paused) updateBoids();
    draw();
    rafId = requestAnimationFrame(tick);
  }

  const updatePointer = (clientX: number, clientY: number) => {
    const rect = canvas.getBoundingClientRect();
    pointer.x = clientX - rect.left;
    pointer.y = clientY - rect.top;
    pointer.active = true;
  };

  canvas.addEventListener('mousemove', (e) => updatePointer(e.clientX, e.clientY));
  canvas.addEventListener('mouseleave', () => {
    pointer.active = false;
  });
  canvas.addEventListener(
    'touchmove',
    (e) => {
      const touch = e.touches[0];
      if (touch) updatePointer(touch.clientX, touch.clientY);
    },
    { passive: true }
  );
  canvas.addEventListener('touchend', () => {
    pointer.active = false;
  });

  modeBtn?.addEventListener('click', () => {
    mode = mode === 'attract' ? 'repel' : 'attract';
    modeBtn.textContent = mode === 'attract' ? 'Mode: Attract' : 'Mode: Repel';
  });

  scatterBtn?.addEventListener('click', () => {
    spawnBoids();
  });

  pauseBtn?.addEventListener('click', () => {
    paused = !paused;
    pauseBtn.textContent = paused ? '▶ Resume' : '⏸ Pause';
  });

  window.addEventListener('resize', resize);

  resize();
  spawnBoids();
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(tick);
}

initBoidsLab();
document.addEventListener('astro:page-load', initBoidsLab);
