import { getDawnAudioContext, playTactileButtonClick } from './sound.ts';

// Atmospheric Weather Engine (Rain, Snow, Storm & Lightning, Wind & Leaves)
// ---------------------------------------------------------------------------
export type WeatherMode = 'off' | 'rain' | 'snow' | 'storm' | 'wind';

let weatherAnimId = 0;
let activeWeatherModeRunning: WeatherMode = 'off';
let weatherResizeHandler: (() => void) | null = null;
let weatherMouseHandler: ((e: MouseEvent) => void) | null = null;
let stormLightningTimer: any = null;

// Master output bus for all weather audio (thunder + rain bed) — the volume
// setting controls this one node; every effect routes through it.
let weatherGain: GainNode | null = null;
let weatherGainCtx: AudioContext | null = null;

export function getWeatherVolume(): number {
  const v = Number(localStorage.getItem('dawn_weather_vol'));
  return Number.isFinite(v) && v >= 0 && v <= 1 ? v : 1;
}

export function setWeatherVolume(v: number): void {
  const vol = Math.min(1, Math.max(0, v));
  localStorage.setItem('dawn_weather_vol', String(vol));
  if (weatherGain && weatherGainCtx) {
    try {
      weatherGain.gain.cancelScheduledValues(weatherGainCtx.currentTime);
      weatherGain.gain.linearRampToValueAtTime(Math.max(vol, 0.0001), weatherGainCtx.currentTime + 0.15);
    } catch {}
  }
}

function getWeatherGain(ctx: AudioContext): GainNode {
  if (!weatherGain || weatherGainCtx !== ctx) {
    weatherGain = ctx.createGain();
    weatherGain.gain.value = getWeatherVolume();
    weatherGain.connect(ctx.destination);
    weatherGainCtx = ctx;
  }
  return weatherGain;
}

function playThunderSound(): void {
  try {
    const ctx = getDawnAudioContext();
    if (!ctx) return;

    const play = () => {
      const now = ctx.currentTime + 0.02;
      const sr = ctx.sampleRate;

      // Distance: 0 = overhead bolt, 1 = far horizon. Far strikes get a
      // weaker boom and a darker, longer rumble (real behavior).
      const far = Math.random() * Math.random();

      // Brown noise, decorrelated stereo — mono image kills the illusion.
      const makeBrown = (secs: number) => {
        const n = Math.floor(sr * secs);
        const buf = ctx.createBuffer(2, n, sr);
        for (let ch = 0; ch < 2; ch++) {
          const d = buf.getChannelData(ch);
          let last = 0;
          for (let i = 0; i < n; i++) {
            last = (last + 0.045 * (Math.random() * 2 - 1)) / 1.045;
            d[i] = last * 3.4;
          }
        }
        return buf;
      };

      // Envelope of natural thunder: several unpredictable swells (roll), not
      // a clean exponential decay. Rendered as a gain automation curve.
      const humpEnvelope = () => {
        const pts = 28;
        const curve = new Float32Array(pts);
        const phase = Math.random() * Math.PI * 2;
        for (let i = 0; i < pts; i++) {
          const decay = Math.exp(-3.1 * (i / pts));
          const swell = 0.45 + 0.55 * Math.abs(Math.sin(i * 1.35 + phase));
          curve[i] = (0.75 + Math.random() * 0.35) * decay * swell;
        }
        curve[0] = 0.02;
        curve[pts - 1] = 0.0005;
        return curve;
      };

      // 2) Sub boom: brown noise burst swept under 210->55 Hz, pure pressure.
      const boom = (at: number, amp: number) => {
        if (amp <= 0.05) return;
        const src = ctx.createBufferSource();
        src.buffer = makeBrown(0.55);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(210, at);
        lp.frequency.exponentialRampToValueAtTime(55, at + 0.35);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(amp, at + 0.03);
        g.gain.exponentialRampToValueAtTime(0.001, at + 0.5);
        src.connect(lp);
        lp.connect(g);
        g.connect(getWeatherGain(ctx));
        src.start(at);
        src.stop(at + 0.55);
      };

      // 3) Main rumble: LP sweep down + random swells + one darker terrain echo.
      const rumble = (at: number) => {
        const dur = 4.2 + far * 3.5 + Math.random();
        const src = ctx.createBufferSource();
        src.buffer = makeBrown(dur);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(480 - far * 230, at);
        lp.frequency.exponentialRampToValueAtTime(45, at + dur);
        lp.Q.value = 0.9;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.setValueCurveAtTime(humpEnvelope(), at, dur);
        const echo = ctx.createDelay(1);
        echo.delayTime.value = 0.16 + Math.random() * 0.2;
        const eLp = ctx.createBiquadFilter();
        eLp.type = 'lowpass';
        eLp.frequency.value = 240;
        const eGain = ctx.createGain();
        eGain.gain.value = 0.32;
        src.connect(lp);
        lp.connect(g);
        g.connect(getWeatherGain(ctx));
        lp.connect(echo);
        echo.connect(eLp);
        eLp.connect(eGain);
        eGain.connect(getWeatherGain(ctx));
        src.start(at);
        src.stop(at + dur);
      };

      // Storm cells often flash 2–4 return strokes 160–400 ms apart.
      const strokes = 1 + (Math.random() < 0.65 ? (Math.random() < 0.4 ? 3 : 1) : 0);
      for (let i = 0; i < strokes; i++) {
        const at = now + i * (0.16 + Math.random() * 0.24);
        boom(at + 0.02, (1 - far) * 0.5);
      }
      rumble(now);
    };

    if (ctx.state === 'suspended') {
      ctx.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {}
}

// Rain ambience: continuous filtered-noise bed for rain & storm modes.
let rainAudio: { stop: () => void } | null = null;
let rainAudioMode: 'rain' | 'storm' | null = null;

function startRainAudio(mode: 'rain' | 'storm'): void {
  if (rainAudioMode === mode) return;
  stopRainAudio();
  const ctx = getDawnAudioContext();
  if (!ctx) return;

  let stopped = false;
  let g: GainNode | null = null;
  const sources: AudioScheduledSourceNode[] = [];

  const build = () => {
    const sr = ctx.sampleRate;
    // 2s decorrelated stereo noise bed, pink-lite so it loops seamlessly.
    const buf = ctx.createBuffer(2, sr * 2, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < d.length; i++) {
        last = 0.94 * last + 0.06 * (Math.random() * 2 - 1) * 0.55 + (Math.random() * 2 - 1) * 0.45;
        d[i] = last;
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 380;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = mode === 'storm' ? 7200 : 5600;
    g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    const target = mode === 'storm' ? 0.12 : 0.075;
    g.gain.exponentialRampToValueAtTime(target, ctx.currentTime + 1.6);
    // Slow gusts: gentle level breathing so the bed is never static.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.11 + Math.random() * 0.07;
    const lfoAmp = ctx.createGain();
    lfoAmp.gain.value = target * 0.22;
    lfo.connect(lfoAmp);
    lfoAmp.connect(g.gain);
    src.connect(hp);
    hp.connect(lp);
    lp.connect(g);
    g.connect(getWeatherGain(ctx));
    src.start();
    lfo.start();
    sources.push(src, lfo);
  };

  if (ctx.state === 'suspended') {
    ctx.resume().then(build).catch(() => {});
  } else {
    build();
  }

  rainAudio = {
    stop: () => {
      stopped = true;
      if (g) {
        try {
          g.gain.cancelScheduledValues(ctx.currentTime);
          g.gain.setValueAtTime(Math.max(g.gain.value, 0.0001), ctx.currentTime);
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
        } catch {}
      }
      setTimeout(() => sources.forEach((n) => { try { n.stop(); } catch {} }), 900);
    },
  };
  rainAudioMode = mode;
}

function stopRainAudio(): void {
  rainAudio?.stop();
  rainAudio = null;
  rainAudioMode = null;
}

export function setupWeatherEngine(): void {
  const canvas = (document.getElementById('global-weather-canvas') ||
    document.getElementById('global-real-rain')) as HTMLCanvasElement | null;
  const btn = document.getElementById('btn-global-weather') || document.getElementById('btn-global-rain');
  const label = document.getElementById('weather-label') || document.getElementById('rain-label');
  const vol = document.getElementById('weather-vol') as HTMLInputElement | null;
  if (vol) {
    vol.value = String(Math.round(getWeatherVolume() * 100));
    vol.addEventListener('input', () => setWeatherVolume(Number(vol.value) / 100));
  }

  const getSavedMode = (): WeatherMode => {
    const saved = localStorage.getItem('dawn_weather_mode') as WeatherMode | null;
    if (saved && ['off', 'rain', 'snow', 'storm', 'wind'].includes(saved)) {
      return saved;
    }
    if (localStorage.getItem('dawn_real_rain') === 'true') return 'rain';
    return 'off';
  };

  let currentMode: WeatherMode = getSavedMode();

  const updateUI = (mode: WeatherMode) => {
    const configs: Record<WeatherMode, { label: string; icon: string; cls: string; shadow: string }> = {
      off: { label: 'weather: off', icon: '⛅', cls: 'text-(--fg-faint)', shadow: 'none' },
      rain: { label: 'weather: rain', icon: '🌧️', cls: 'text-sky-400', shadow: 'drop-shadow(0 0 6px #38bdf8)' },
      snow: { label: 'weather: snow', icon: '❄️', cls: 'text-cyan-300', shadow: 'drop-shadow(0 0 6px #7dd3fc)' },
      storm: { label: 'weather: storm', icon: '⛈️', cls: 'text-amber-400', shadow: 'drop-shadow(0 0 6px #f59e0b)' },
      wind: { label: 'weather: wind', icon: '💨', cls: 'text-orange-400', shadow: 'drop-shadow(0 0 6px #fb923c)' },
    };

    const cfg = configs[mode] || configs.off;
    if (label) label.textContent = cfg.label;
    if (btn) {
      btn.className = `inline-flex items-center gap-1 text-[11px] px-0.5 ${cfg.cls} cursor-pointer select-none no-underline transition-colors`;
      btn.title = `Weather: ${mode.toUpperCase()} (Click to cycle: Rain 🌧️ → Snow ❄️ → Storm ⛈️ → Wind 💨 → Off ⛅)`;
      const icon = btn.querySelector('.weather-icon, .rain-icon') as HTMLElement | null;
      if (icon) {
        icon.textContent = cfg.icon;
        icon.style.filter = cfg.shadow;
      }
    }
  };

  updateUI(currentMode);

  // Interfaces for weather simulations
  interface RainDrop {
    x: number;
    y: number;
    l: number;
    xs: number;
    ys: number;
    layer: 0 | 1 | 2;
    alpha: number;
    width: number;
  }

  interface Splash {
    x: number;
    y: number;
    vx: number;
    vy: number;
    alpha: number;
    radius: number;
  }

  interface Snowflake {
    x: number;
    y: number;
    r: number;
    ys: number;
    wobbleSpeed: number;
    wobbleAmp: number;
    phase: number;
    alpha: number;
    layer: 0 | 1 | 2;
  }

  interface Leaf {
    x: number;
    y: number;
    vx: number;
    vy: number;
    angle: number;
    spinSpeed: number;
    flip: number;
    flipSpeed: number;
    scale: number;
    color: string;
    swayPhase: number;
  }

  interface WindStreak {
    x: number;
    y: number;
    len: number;
    vx: number;
    alpha: number;
    curv: number;
  }

  interface LightningBolt {
    points: { x: number; y: number }[];
    branches: { points: { x: number; y: number }[] }[];
    flashAlpha: number;
    duration: number;
    age: number;
  }

  function startWeather(mode: WeatherMode) {
    if (!canvas || mode === 'off') {
      stopWeather();
      return;
    }

    if (activeWeatherModeRunning === mode && weatherAnimId !== 0) {
      // Weather effect is already running seamlessly across Astro route transitions
      return;
    }
    activeWeatherModeRunning = mode;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.style.display = 'block';
    canvas.classList.remove('opacity-0');
    canvas.classList.add('opacity-90');

    let W = window.innerWidth;
    let H = window.innerHeight;

    let mouseX = -9999;
    let mouseY = -9999;
    let lastMouseX = -9999;
    let mouseVx = 0;

    // Collections
    let rainDrops: RainDrop[] = [];
    let splashes: Splash[] = [];
    let snowflakes: Snowflake[] = [];
    let leaves: Leaf[] = [];
    let windStreaks: WindStreak[] = [];
    let activeBolt: LightningBolt | null = null;

    function resize() {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      initParticles();
    }

    function initParticles() {
      // 1. Rain & Storm particles
      if (mode === 'rain' || mode === 'storm') {
        const isStorm = mode === 'storm';
        const count = isStorm
          ? Math.floor(Math.min(360, Math.max(160, W * 0.22)))
          : Math.floor(Math.min(240, Math.max(80, W * 0.14)));
        rainDrops = [];
        for (let i = 0; i < count; i++) {
          const layer: 0 | 1 | 2 = Math.random() < 0.5 ? 0 : Math.random() < 0.75 ? 1 : 2;
          let ys = isStorm ? 24 + Math.random() * 12 : 12 + Math.random() * 6;
          let l = isStorm ? 30 + Math.random() * 26 : 16 + Math.random() * 14;
          let alpha = isStorm ? 0.35 + Math.random() * 0.3 : 0.2 + Math.random() * 0.2;
          let width = isStorm ? 1.4 : 1.0;

          if (layer === 1) {
            ys *= 1.35;
            l *= 1.3;
            width *= 1.25;
          } else if (layer === 2) {
            ys *= 1.65;
            l *= 1.6;
            width *= 1.5;
            alpha = Math.min(0.9, alpha * 1.3);
          }

          rainDrops.push({
            x: Math.random() * (W + 250) - 100,
            y: Math.random() * H,
            l,
            xs: isStorm ? -4.5 - Math.random() * 2.5 : -1.8 - Math.random() * 1.2,
            ys,
            layer,
            alpha,
            width,
          });
        }
      }

      // 2. Snow particles
      if (mode === 'snow') {
        const count = Math.floor(Math.min(220, Math.max(80, W * 0.13)));
        snowflakes = [];
        for (let i = 0; i < count; i++) {
          const layer: 0 | 1 | 2 = Math.random() < 0.45 ? 0 : Math.random() < 0.8 ? 1 : 2;
          let r = 1.2 + Math.random() * 1.2;
          let ys = 0.8 + Math.random() * 0.8;
          let alpha = 0.3 + Math.random() * 0.25;
          if (layer === 1) {
            r = 2.2 + Math.random() * 1.4;
            ys = 1.3 + Math.random() * 0.9;
            alpha = 0.55 + Math.random() * 0.25;
          } else if (layer === 2) {
            r = 3.6 + Math.random() * 2.0;
            ys = 1.9 + Math.random() * 1.1;
            alpha = 0.75 + Math.random() * 0.22;
          }

          snowflakes.push({
            x: Math.random() * W,
            y: Math.random() * H,
            r,
            ys,
            wobbleSpeed: 0.02 + Math.random() * 0.03,
            wobbleAmp: 1.2 + Math.random() * 2.2,
            phase: Math.random() * Math.PI * 2,
            alpha,
            layer,
          });
        }
      }

      // 3. Wind particles (autumn leaves & breeze streaks)
      if (mode === 'wind') {
        const leafColors = [
          '#ef4444', // Crimson Maple
          '#f97316', // Autumn Orange
          '#f59e0b', // Golden Amber
          '#b45309', // Burnt Ochre
          '#eab308', // Yellow Birch
        ];
        leaves = [];
        const leafCount = Math.floor(Math.min(50, Math.max(22, W * 0.025)));
        for (let i = 0; i < leafCount; i++) {
          leaves.push({
            x: Math.random() * W,
            y: Math.random() * H,
            vx: 3.5 + Math.random() * 4.2,
            vy: 0.8 + Math.random() * 1.8,
            angle: Math.random() * Math.PI * 2,
            spinSpeed: (Math.random() - 0.5) * 0.06,
            flip: Math.random() * Math.PI,
            flipSpeed: 0.04 + Math.random() * 0.05,
            scale: 0.75 + Math.random() * 0.65,
            color: leafColors[Math.floor(Math.random() * leafColors.length)],
            swayPhase: Math.random() * Math.PI * 2,
          });
        }

        windStreaks = [];
        const streakCount = 18;
        for (let i = 0; i < streakCount; i++) {
          windStreaks.push({
            x: Math.random() * (W + 300) - 150,
            y: Math.random() * H,
            len: 80 + Math.random() * 160,
            vx: 9 + Math.random() * 9,
            alpha: 0.08 + Math.random() * 0.14,
            curv: (Math.random() - 0.5) * 14,
          });
        }
      }
    }

    if (weatherResizeHandler) window.removeEventListener('resize', weatherResizeHandler);
    weatherResizeHandler = resize;
    window.addEventListener('resize', resize, { passive: true });
    resize();

    if (weatherMouseHandler) window.removeEventListener('pointermove', weatherMouseHandler);
    weatherMouseHandler = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (lastMouseX !== -9999) {
        mouseVx = (mouseX - lastMouseX) * 0.4;
      }
      lastMouseX = mouseX;
    };
    window.addEventListener('pointermove', weatherMouseHandler, { passive: true });

    // Lightning Generator for Storm Mode
    function triggerLightning() {
      if (mode !== 'storm' || !canvas) return;

      const startX = Math.random() * (W * 0.8) + W * 0.1;
      const groundY = H * (0.65 + Math.random() * 0.35);
      const points: { x: number; y: number }[] = [{ x: startX, y: 0 }];

      let cx = startX;
      let cy = 0;
      const steps = 14 + Math.floor(Math.random() * 10);
      const dy = groundY / steps;

      for (let s = 1; s <= steps; s++) {
        cx += (Math.random() - 0.5) * (W * 0.06);
        cy += dy + (Math.random() - 0.5) * 15;
        points.push({ x: cx, y: cy });
      }

      // Branch forks
      const branches: { points: { x: number; y: number }[] }[] = [];
      if (points.length > 6) {
        const forkIdx = Math.floor(points.length * (0.3 + Math.random() * 0.4));
        const forkOrigin = points[forkIdx];
        const branchPts: { x: number; y: number }[] = [{ x: forkOrigin.x, y: forkOrigin.y }];
        let bx = forkOrigin.x;
        let by = forkOrigin.y;
        const bSteps = 6 + Math.floor(Math.random() * 5);
        const bDir = Math.random() < 0.5 ? -1 : 1;
        for (let b = 0; b < bSteps; b++) {
          bx += bDir * (12 + Math.random() * 25);
          by += 15 + Math.random() * 20;
          branchPts.push({ x: bx, y: by });
        }
        branches.push({ points: branchPts });
      }

      activeBolt = {
        points,
        branches,
        flashAlpha: 0.65,
        duration: 0.28,
        age: 0,
      };

      // Play synthesized thunder shockwave on lightning strike!
      setTimeout(() => {
        if (currentMode === 'storm') {
          playThunderSound();
        }
      }, 90);

      // Schedule next lightning strike in 4.5 - 8.5 seconds
      clearTimeout(stormLightningTimer);
      const nextDelay = 4500 + Math.random() * 4000;
      stormLightningTimer = setTimeout(triggerLightning, nextDelay);
    }

    if (mode === 'storm') {
      clearTimeout(stormLightningTimer);
      stormLightningTimer = setTimeout(triggerLightning, 1200);
    }

    let lastTime = performance.now();

    function frame(now: number) {
      if (currentMode === 'off') {
        stopWeather();
        return;
      }

      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      ctx!.clearRect(0, 0, W, H);

      // ---------------------------------------------
      // 1. RENDER STORM LIGHTNING & STROBE ILLUMINATION
      // ---------------------------------------------
      if (mode === 'storm' && activeBolt) {
        activeBolt.age += dt;
        const p = activeBolt.age / activeBolt.duration;

        if (p >= 1) {
          activeBolt = null;
        } else {
          // Rapid flickering strobe pulse
          const pulse = Math.sin(p * Math.PI * 6);
          const flashAlpha = Math.max(0, activeBolt.flashAlpha * (1 - p) * (0.6 + 0.4 * pulse));

          // Ambient screen strobe
          ctx!.fillStyle = `rgba(224, 242, 254, ${flashAlpha * 0.42})`;
          ctx!.fillRect(0, 0, W, H);

          // Draw lightning bolt
          ctx!.save();
          ctx!.beginPath();
          ctx!.strokeStyle = 'rgba(255, 255, 255, 0.95)';
          ctx!.shadowColor = '#38bdf8';
          ctx!.shadowBlur = 18;
          ctx!.lineWidth = 2.4;

          const pts = activeBolt.points;
          ctx!.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) {
            ctx!.lineTo(pts[i].x, pts[i].y);
          }
          ctx!.stroke();

          // Draw branches
          for (const br of activeBolt.branches) {
            ctx!.beginPath();
            ctx!.lineWidth = 1.4;
            ctx!.moveTo(br.points[0].x, br.points[0].y);
            for (let i = 1; i < br.points.length; i++) {
              ctx!.lineTo(br.points[i].x, br.points[i].y);
            }
            ctx!.stroke();
          }
          ctx!.restore();
        }
      }

      // ---------------------------------------------
      // 2. RENDER RAIN & STORM DROPLETS
      // ---------------------------------------------
      if (mode === 'rain' || mode === 'storm') {
        const isStorm = mode === 'storm';
        const baseR = isStorm ? 190 : 174;
        const baseG = isStorm ? 215 : 202;
        const baseB = isStorm ? 250 : 240;
        ctx!.lineCap = 'round';

        for (let i = 0; i < rainDrops.length; i++) {
          const d = rainDrops[i];

          const dist = Math.hypot(d.x - mouseX, d.y - mouseY);
          let extraXs = 0;
          if (dist < 110) {
            extraXs = (d.x - mouseX) * 0.035;
          }

          ctx!.beginPath();
          ctx!.lineWidth = d.width;
          ctx!.strokeStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${d.alpha})`;
          ctx!.moveTo(d.x, d.y);
          ctx!.lineTo(d.x + d.xs + extraXs, d.y + d.l);
          ctx!.stroke();

          d.x += (d.xs + extraXs) * (dt * 60);
          d.y += d.ys * (dt * 60);

          if (d.y >= H - 15) {
            if ((d.layer >= 1 || isStorm) && splashes.length < 60 && Math.random() < (isStorm ? 0.65 : 0.45)) {
              const count = isStorm ? 4 : d.layer === 2 ? 3 : 2;
              for (let s = 0; s < count; s++) {
                splashes.push({
                  x: d.x,
                  y: H - 8 + Math.random() * 6,
                  vx: (Math.random() * 4 - 2) * (isStorm ? 1.6 : 1.0),
                  vy: -(Math.random() * 3 + 1.2),
                  alpha: 0.65,
                  radius: Math.random() * 1.4 + 0.6,
                });
              }
            }

            d.y = -d.l - Math.random() * 40;
            d.x = Math.random() * (W + 250) - 50;
          }
        }

        // Splashes
        for (let s = splashes.length - 1; s >= 0; s--) {
          const sp = splashes[s];
          ctx!.beginPath();
          ctx!.fillStyle = `rgba(${baseR}, ${baseG}, ${baseB}, ${sp.alpha})`;
          ctx!.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
          ctx!.fill();

          sp.x += sp.vx;
          sp.y += sp.vy;
          sp.vy += 0.22;
          sp.alpha -= 0.05;

          if (sp.alpha <= 0) {
            splashes.splice(s, 1);
          }
        }
      }

      // ---------------------------------------------
      // 3. RENDER SNOWFALL
      // ---------------------------------------------
      if (mode === 'snow') {
        const timeSec = now * 0.001;
        for (let i = 0; i < snowflakes.length; i++) {
          const s = snowflakes[i];

          // Gentle flutter sway
          const wobble = Math.sin(timeSec * s.wobbleSpeed * 60 + s.phase) * s.wobbleAmp;

          // Mouse proximity flutter
          const dist = Math.hypot(s.x - mouseX, s.y - mouseY);
          let pushX = 0;
          let pushY = 0;
          if (dist < 120 && dist > 0) {
            const force = (120 - dist) / 120;
            pushX = ((s.x - mouseX) / dist) * force * 3.5;
            pushY = ((s.y - mouseY) / dist) * force * 1.5;
          }

          ctx!.beginPath();
          ctx!.fillStyle = `rgba(240, 248, 255, ${s.alpha})`;
          if (s.layer === 2) {
            ctx!.shadowColor = '#bae6fd';
            ctx!.shadowBlur = 6;
          } else {
            ctx!.shadowBlur = 0;
          }
          ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx!.fill();

          s.x += (wobble + pushX) * (dt * 60);
          s.y += (s.ys + pushY) * (dt * 60);

          if (s.y > H + 10) {
            s.y = -s.r - Math.random() * 20;
            s.x = Math.random() * W;
          }
          if (s.x < -20) s.x = W + 10;
          if (s.x > W + 20) s.x = -10;
        }
        ctx!.shadowBlur = 0;
      }

      // ---------------------------------------------
      // 4. RENDER WIND & FLOATING AUTUMN LEAVES
      // ---------------------------------------------
      if (mode === 'wind') {
        // Wind gusts
        ctx!.lineWidth = 1.2;
        for (let i = 0; i < windStreaks.length; i++) {
          const ws = windStreaks[i];
          ctx!.beginPath();
          ctx!.strokeStyle = `rgba(226, 232, 240, ${ws.alpha})`;
          ctx!.moveTo(ws.x, ws.y);
          ctx!.quadraticCurveTo(ws.x + ws.len * 0.5, ws.y + ws.curv, ws.x + ws.len, ws.y);
          ctx!.stroke();

          ws.x += ws.vx * (dt * 60);
          if (ws.x > W + 50) {
            ws.x = -ws.len - Math.random() * 150;
            ws.y = Math.random() * H;
          }
        }

        // Autumn Leaves
        for (let i = 0; i < leaves.length; i++) {
          const lf = leaves[i];

          // 3D flutter rotation
          lf.angle += lf.spinSpeed * (dt * 60);
          lf.flip += lf.flipSpeed * (dt * 60);
          const flipScale = Math.cos(lf.flip);

          // Mouse breeze
          const dist = Math.hypot(lf.x - mouseX, lf.y - mouseY);
          let extraVx = 0;
          let extraVy = 0;
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140;
            extraVx = ((lf.x - mouseX) / dist) * force * 5.0 + mouseVx * 0.2;
            extraVy = ((lf.y - mouseY) / dist) * force * 3.0;
          }

          // Swaying sinusoidal drift
          const sway = Math.sin(now * 0.003 + lf.swayPhase) * 1.2;

          ctx!.save();
          ctx!.translate(lf.x, lf.y);
          ctx!.rotate(lf.angle);
          ctx!.scale(lf.scale, lf.scale * flipScale);

          // Draw organic autumn leaf shape
          ctx!.beginPath();
          ctx!.fillStyle = lf.color;
          ctx!.moveTo(0, -14);
          ctx!.bezierCurveTo(8, -10, 10, 2, 0, 16);
          ctx!.bezierCurveTo(-10, 2, -8, -10, 0, -14);
          ctx!.fill();

          // Central vein line
          ctx!.beginPath();
          ctx!.strokeStyle = 'rgba(0, 0, 0, 0.2)';
          ctx!.lineWidth = 0.8;
          ctx!.moveTo(0, -12);
          ctx!.lineTo(0, 13);
          ctx!.stroke();

          ctx!.restore();

          lf.x += (lf.vx + extraVx) * (dt * 60);
          lf.y += (lf.vy + sway + extraVy) * (dt * 60);

          if (lf.x > W + 40 || lf.y > H + 40) {
            lf.x = -30 - Math.random() * 60;
            lf.y = Math.random() * (H * 0.85);
          }
        }
      }

      weatherAnimId = requestAnimationFrame(frame);
    }

    cancelAnimationFrame(weatherAnimId);
    weatherAnimId = requestAnimationFrame(frame);
  }

  function stopWeather() {
    activeWeatherModeRunning = 'off';
    cancelAnimationFrame(weatherAnimId);
    weatherAnimId = 0;
    clearTimeout(stormLightningTimer);
    if (weatherResizeHandler) {
      window.removeEventListener('resize', weatherResizeHandler);
      weatherResizeHandler = null;
    }
    if (weatherMouseHandler) {
      window.removeEventListener('pointermove', weatherMouseHandler);
      weatherMouseHandler = null;
    }
    if (canvas) {
      canvas.classList.remove('opacity-90');
      canvas.classList.add('opacity-0');
      setTimeout(() => {
        if (activeWeatherModeRunning === 'off') {
          canvas.style.display = 'none';
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }, 500);
    }
  }

  const setWeather = (mode: WeatherMode) => {
    currentMode = mode;
    localStorage.setItem('dawn_weather_mode', mode);
    localStorage.setItem('dawn_real_rain', mode === 'rain' ? 'true' : 'false');
    updateUI(mode);

    const detail = { mode };
    window.dispatchEvent(new CustomEvent('dawn:weather-state', { detail, bubbles: true }));
    document.dispatchEvent(new CustomEvent('dawn:weather-state', { detail, bubbles: true }));
    document.dispatchEvent(new CustomEvent('dawn:rain-state', { detail: { enabled: mode === 'rain' }, bubbles: true }));

    if (mode === 'off') {
      stopWeather();
      stopRainAudio();
    } else {
      startWeather(mode);
      if (mode === 'rain' || mode === 'storm') startRainAudio(mode); else stopRainAudio();
      if (mode === 'storm') {
        setTimeout(() => playThunderSound(), 180);
      }
    }
  };

  const cycleWeather = () => {
    const cycleOrder: WeatherMode[] = ['off', 'rain', 'snow', 'storm', 'wind'];
    const curIdx = cycleOrder.indexOf(currentMode);
    const nextMode = cycleOrder[(curIdx + 1) % cycleOrder.length];
    setWeather(nextMode);
  };

  if (btn) {
    btn.onclick = (e) => {
      e.preventDefault();
      const ctx = getDawnAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      playTactileButtonClick();
      cycleWeather();
    };
  }

  // Event bus listeners
  window.removeEventListener('dawn:toggle-weather', (window as any).__dawn_weather_toggle_listener);
  (window as any).__dawn_weather_toggle_listener = () => cycleWeather();
  window.addEventListener('dawn:toggle-weather', (window as any).__dawn_weather_toggle_listener);

  window.removeEventListener('dawn:set-weather', (window as any).__dawn_weather_set_listener);
  (window as any).__dawn_weather_set_listener = (e: CustomEvent<{ mode: WeatherMode }>) => {
    if (e.detail?.mode) setWeather(e.detail.mode);
  };
  window.addEventListener('dawn:set-weather', (window as any).__dawn_weather_set_listener as any);

  // Backward-compatibility with legacy rain toggle event
  window.removeEventListener('dawn:toggle-rain', (window as any).__dawn_rain_toggle_listener);
  (window as any).__dawn_rain_toggle_listener = () => {
    setWeather(currentMode === 'rain' ? 'off' : 'rain');
  };
  window.addEventListener('dawn:toggle-rain', (window as any).__dawn_rain_toggle_listener);

  if (currentMode !== 'off') {
    if (activeWeatherModeRunning !== currentMode || weatherAnimId === 0) {
      startWeather(currentMode);
    }
    if (currentMode === 'rain' || currentMode === 'storm') startRainAudio(currentMode);
  } else {
    if (activeWeatherModeRunning !== 'off') {
      stopWeather();
    }
  }
}

// Backward-compatibility alias
export const setupRealRain = setupWeatherEngine;

