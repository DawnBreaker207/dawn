// Easter egg reward: victory chime + confetti burst. Loaded on first trigger.

function playVictoryChime(): void {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.1);
      osc.stop(ctx.currentTime + idx * 0.1 + 0.38);
    });
  } catch {
    // Audio restricted
  }
}

export function launchConfetti(): void {
  try {
    (window as any).umami?.track('easter-egg-unlocked');
  } catch {}
  playVictoryChime();

  // Floating retro toast banner with 100% inline styles (cannot be broken by Tailwind purging)
  document.getElementById('konami-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'konami-toast';
  Object.assign(toast.style, {
    position: 'fixed',
    top: '28px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderRadius: '12px',
    border: '2px solid #fbbf24',
    backgroundColor: 'rgba(15, 17, 23, 0.96)',
    padding: '12px 24px',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    color: '#fef08a',
    boxShadow: '0 0 40px rgba(251, 191, 36, 0.65), 0 20px 25px -5px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto',
    cursor: 'pointer',
    userSelect: 'none',
  });
  toast.innerHTML = `
    <span style="font-size: 26px; line-height: 1;">🎮</span>
    <div>
      <div style="font-weight: 800; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #fbbf24;">
        KONAMI CHEAT ACTIVATED!
      </div>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        +30 Extra Lives Granted · Developer Easter Egg Unlocked
      </div>
    </div>
  `;
  toast.onclick = () => toast.remove();
  document.body.append(toast);
  setTimeout(() => toast.remove(), 5000);

  // Confetti Canvas
  const canvas = document.createElement('canvas');
  Object.assign(canvas.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '999998',
  });
  document.body.append(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.scale(dpr, dpr);

  const colors = ['#82aaff', '#c792ea', '#ecc48d', '#7fdbca', '#ff5370', '#addb67', '#f59e0b', '#ec4899', '#38bdf8'];
  const particles = Array.from({ length: 180 }).map(() => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 260,
    y: window.innerHeight * 0.45,
    vx: (Math.random() - 0.5) * 24,
    vy: (Math.random() - 0.8) * 22,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 14,
    alpha: 1,
  }));

  const start = performance.now();
  function render(now: number) {
    if (!ctx) return;
    const elapsed = now - start;
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    let alive = false;
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.42; // gravity
      p.rot += p.rotSpeed;
      p.alpha = Math.max(0, 1 - elapsed / 3400);

      if (p.alpha > 0) {
        alive = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });

    if (alive) {
      requestAnimationFrame(render);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(render);
}
