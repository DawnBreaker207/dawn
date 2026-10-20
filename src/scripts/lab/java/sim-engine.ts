/**
 * Java Lab simulation engine.
 *
 * Pure TypeScript — no Astro syntax, no document access at module level.
 * Exports:
 *   registerTab  — called by each *.data.ts side-effect import
 *   bootEngine   — wires tab-switching + per-card simulation (call on astro:page-load)
 *   initJVMVisualizer — JVM heap simulator (call on astro:page-load)
 */

export interface SimStep {
  log: string;
  explain: string;
  tone?: 'info' | 'warn' | 'error';
}

export interface SimCase {
  label: string;
  steps: SimStep[];
}

export interface VizCfg {
  code: string;
  line: number[];
  track: string[];
  at: number[];
}

export interface TabData {
  cases: SimCase[];
  viz: VizCfg[];
}

// Client-side registry — populated by side-effect imports in the page <script>.
export const registry = new Map<string, TabData>();

export function registerTab(id: string, data: TabData): void {
  registry.set(id, data);
}

// ─── Tab-switching + per-card simulation engine ───────────────────────────────

export function bootEngine(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>('[data-jx-tab]'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-jx-panel]'));

  const paint = (on: boolean, btn: HTMLElement) => {
    const base =
      'jx-btn cursor-pointer rounded-lg border px-3 py-1.5 font-semibold transition-colors ';
    const tone = btn.dataset.jxTone ?? 'text-(--fg-dim)';
    btn.className = on
      ? base + 'border-(--fg) bg-(--fg) text-(--bg)'
      : base + `border-(--border) bg-(--bg) ${tone} hover:border-(--fg-dim)`;
  };

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.jxTab;
      tabs.forEach((btn) => paint(btn === tab, btn));
      panels.forEach((panel) => {
        panel.hidden = panel.dataset.jxPanel !== id;
      });
      const mirror = document.querySelector<HTMLElement>('[data-jx-current]');
      if (mirror) mirror.textContent = tab.textContent ?? '';
      tab.closest('details')?.removeAttribute('open');
    });
  });

  // Inject case buttons and wire each sim-card from the registry.
  document.querySelectorAll<HTMLElement>('[data-sim-card]').forEach((card) => {
    const topic = card.dataset.simCard ?? '';
    const entry = registry.get(topic);
    const cases = entry?.cases ?? [];

    // Inject case buttons if the card has a button container and no buttons yet.
    const btnContainer = card.querySelector<HTMLElement>('[data-sim-cases]');
    if (btnContainer && btnContainer.children.length === 0 && cases.length > 0) {
      cases.forEach((c, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.dataset.caseRun = String(i);
        btn.textContent = c.label;
        btn.className =
          'cursor-pointer rounded-lg border border-(--border) bg-(--bg) px-3 py-1.5 font-mono text-[11px] text-(--fg-dim) transition-colors hover:border-(--fg-dim) hover:text-(--fg)';
        btnContainer.appendChild(btn);
      });
    }

    const logEl = card.querySelector<HTMLElement>('[data-sim-log]');
    const banner = card.querySelector<HTMLElement>('[data-sim-banner]');
    const nextBtn = card.querySelector<HTMLButtonElement>('[data-sim-next]');
    let resume: (() => void) | null = null;
    let currentRunId = 0;

    nextBtn?.addEventListener('click', () => {
      resume?.();
      resume = null;
    });

    const stepWait = (runId: number) => {
      const mode =
        card.querySelector<HTMLInputElement>('[data-step-mode]')?.checked ?? false;
      if (mode && nextBtn) {
        nextBtn.classList.remove('hidden');
        return new Promise<void>((resolve) => {
          resume = resolve;
        }).then(() => nextBtn.classList.add('hidden'));
      }
      const delay = Math.max(
        60,
        Number(card.querySelector<HTMLInputElement>('[data-sim-delay]')?.value) || 350,
      );
      return new Promise<void>((resolve) => setTimeout(resolve, delay));
    };

    const showBanner = (step: SimStep) => {
      if (!banner) return;
      banner.textContent = step.explain;
      banner.className =
        'mt-2 rounded-lg border px-4 py-2 font-mono text-xs ' +
        (step.tone === 'error'
          ? 'border-rose-500 bg-rose-950/40 text-rose-600 dark:text-rose-300'
          : step.tone === 'warn'
            ? 'border-amber-500 bg-amber-950/40 text-amber-700 dark:text-amber-300'
            : 'border-sky-500 bg-sky-950/30 text-sky-700 dark:text-sky-300');
    };

    const runCase = async (c?: SimCase, cfg?: VizCfg) => {
      if (!c || !logEl) return;
      // Cancel previous run: unblock any pending stepWait, then assign new runId
      if (resume) { resume(); resume = null; }
      nextBtn?.classList.add('hidden');
      const myRunId = ++currentRunId;
      card.dataset.busy = '1';
      logEl.textContent = '';

      const trackEl = card.querySelector<HTMLElement>('[data-sim-track]');
      const BOX_BASE =
        'rounded-lg border px-2 py-1.5 font-mono text-[10px] leading-none transition-all duration-300 ';
      const boxes: HTMLElement[] = [];
      if (trackEl && cfg?.track?.length) {
        trackEl.classList.remove('hidden');
        trackEl.replaceChildren();
        cfg.track.forEach((name, ti) => {
          if (ti > 0) {
            const arrow = document.createElement('span');
            arrow.textContent = '→';
            arrow.className = 'font-mono text-[10px] text-(--fg-faint)';
            trackEl.appendChild(arrow);
          }
          const box = document.createElement('span');
          box.textContent = name;
          box.className = BOX_BASE + 'border-(--border) bg-(--bg) text-(--fg-faint)';
          boxes.push(box);
          trackEl.appendChild(box);
        });
      } else if (trackEl) {
        trackEl.classList.add('hidden');
        trackEl.replaceChildren();
      }

      let lastAt = -1;
      const codeEl = card.querySelector<HTMLElement>('[data-sim-code]');
      const codeRows: HTMLElement[] = [];
      if (codeEl && cfg?.code) {
        codeEl.classList.remove('hidden');
        codeEl.replaceChildren();
        cfg.code.split('\n').forEach((text, li) => {
          const row = document.createElement('div');
          row.textContent = String(li + 1).padStart(2, '0') + ' │ ' + text;
          codeRows.push(row);
          codeEl.appendChild(row);
        });
      } else if (codeEl) {
        codeEl.classList.add('hidden');
        codeEl.replaceChildren();
      }

      for (let i = 0; i < c.steps.length; i++) {
        if (currentRunId !== myRunId) return; // cancelled by a newer run
        const step = c.steps[i];
        showBanner(step);
        const at = cfg?.at?.[i] ?? -1;
        if (at >= 0) lastAt = at;
        boxes.forEach((box, bi) => {
          box.className =
            BOX_BASE +
            (bi === at
              ? step.tone === 'error'
                ? 'border-rose-500 bg-rose-950/40 text-rose-600 dark:text-rose-300'
                : 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300'
              : bi < lastAt
                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                : 'border-(--border) bg-(--bg) text-(--fg-faint)');
        });
        const ln = cfg?.line?.[i] ?? -1;
        codeRows.forEach((row, li) => {
          row.className =
            'px-1 ' + (li === ln - 1 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'text-(--fg-faint)');
        });
        const row = document.createElement('div');
        row.textContent = `[${String(i + 1).padStart(2, '0')}] ${step.log}`;
        row.className = i === c.steps.length - 1 ? 'text-amber-700 dark:text-amber-300' : 'text-slate-600 dark:text-slate-400';
        logEl.appendChild(row);
        logEl.scrollTop = logEl.scrollHeight;
        await stepWait(myRunId);
      }
      if (currentRunId === myRunId) delete card.dataset.busy;
    };

    let lastIdx = 0;
    const run = (idx: number) => {
      lastIdx = idx;
      const entry2 = registry.get(topic);
      runCase(entry2?.cases[idx], entry2?.viz[idx]);
    };

    card.querySelectorAll<HTMLButtonElement>('[data-case-run]').forEach((btn) => {
      btn.addEventListener('click', () => {
        run(Number(btn.dataset.caseRun ?? 0));
      });
    });

    card.querySelector<HTMLButtonElement>('[data-sim-replay]')?.addEventListener('click', () => {
      run(lastIdx);
    });
  });

  // Sub-topic select for the concurrency tab.
  const sel = document.querySelector<HTMLSelectElement>('[data-conc-select]');
  sel?.addEventListener('change', () => {
    const id = sel.value;
    document.querySelectorAll<HTMLElement>('[data-conc-sub]').forEach((p) => {
      p.hidden = p.dataset.concSub !== id;
    });
    const btn = document.querySelector<HTMLButtonElement>(
      `[data-conc-sub="${id}"] [data-case-run]`,
    );
    btn?.click();
  });
}

// ─── JVM Heap Visualizer ──────────────────────────────────────────────────────

interface SimulatedObject {
  id: number;
  sizeMb: number;
  age: number;
  isLeaked: boolean;
  isAlive?: boolean;
}

export function initJVMVisualizer(): void {
  let nextId = 1;
  let eden: SimulatedObject[] = [];
  let s0: SimulatedObject[] = [];
  let s1: SimulatedObject[] = [];
  let tenured: SimulatedObject[] = [];

  let activeSurvivorIndex = 0;
  let minorCount = 0;
  let majorCount = 0;
  let totalStwMs = 0;
  let isProcessing = false;

  const EDEN_CAP_MB = 64;
  const SURVIVOR_CAP_MB = 16;
  const TENURED_CAP_MB = 128;
  const MAX_HEAP_MB = EDEN_CAP_MB + SURVIVOR_CAP_MB * 2 + TENURED_CAP_MB;
  const sumSize = (arr: SimulatedObject[]) => arr.reduce((acc, o) => acc + o.sizeMb, 0);

  let resumeStep: (() => void) | null = null;
  const nextBtn = document.getElementById('jvm-next');
  const stepMode = () =>
    (document.getElementById('jvm-step-mode') as HTMLInputElement | null)?.checked ?? false;
  const stepDelay = () =>
    Math.max(
      60,
      Number((document.getElementById('jvm-delay') as HTMLInputElement | null)?.value) || 600,
    );
  const stepWait = () => {
    if (!nextBtn) return Promise.resolve();
    if (stepMode()) {
      nextBtn.classList.remove('hidden');
      return new Promise<void>((resolve) => {
        resumeStep = resolve;
      }).then(() => nextBtn.classList.add('hidden'));
    }
    return new Promise<void>((resolve) => setTimeout(resolve, stepDelay()));
  };
  const advanceStep = () => {
    resumeStep?.();
    resumeStep = null;
  };

  const showBanner = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
    const banner = document.getElementById('gc-status-banner');
    const text = document.getElementById('gc-status-msg');
    if (!banner || !text) return;
    text.textContent = msg;
    banner.className =
      type === 'error'
        ? 'rounded-lg border border-rose-500 bg-rose-950/40 px-4 py-2 font-mono text-xs text-rose-300'
        : type === 'warn'
          ? 'rounded-lg border border-amber-500 bg-amber-950/40 px-4 py-2 font-mono text-xs text-amber-300'
          : 'rounded-lg border border-sky-500 bg-sky-950/30 px-4 py-2 font-mono text-xs text-sky-300';
  };

  const updateMetrics = () => {
    const edenUsed = sumSize(eden);
    const s0Used = sumSize(s0);
    const s1Used = sumSize(s1);
    const tenuredUsed = sumSize(tenured);
    const totalUsed = edenUsed + s0Used + s1Used + tenuredUsed;

    const set = (id: string, v: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    const bar = (id: string, used: number, cap: number) => {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.min(100, (used / cap) * 100)}%`;
    };

    set('metric-heap-pct', `${Math.min(100, Math.round((totalUsed / MAX_HEAP_MB) * 100))}%`);
    set('metric-heap-bytes', `${totalUsed} / ${MAX_HEAP_MB} MB`);
    set('metric-minor-count', `${minorCount}`);
    set('metric-minor-time', `${minorCount * 4} ms pause`);
    set('metric-major-count', `${majorCount}`);
    set('metric-major-time', `${majorCount * 18} ms pause`);
    set('metric-stw-total', `${totalStwMs.toFixed(1)} ms`);
    set(
      'metric-live-objects',
      `${eden.length + s0.length + s1.length + tenured.length} objects`,
    );

    bar('bar-eden', edenUsed, EDEN_CAP_MB);
    bar('bar-s0', s0Used, SURVIVOR_CAP_MB);
    bar('bar-s1', s1Used, SURVIVOR_CAP_MB);
    bar('bar-tenured', tenuredUsed, TENURED_CAP_MB);
    set('label-eden', `${edenUsed} / ${EDEN_CAP_MB} MB`);
    set('label-s0', `${s0Used} / ${SURVIVOR_CAP_MB} MB`);
    set('label-s1', `${s1Used} / ${SURVIVOR_CAP_MB} MB`);
    set('label-tenured', `${tenuredUsed} / ${TENURED_CAP_MB} MB`);

    renderObjectBadges();
  };

  const renderObjectBadges = () => {
    const renderList = (elId: string, items: SimulatedObject[], colorCls: string) => {
      const el = document.getElementById(elId);
      if (!el) return;
      el.innerHTML = items
        .slice(0, 36)
        .map((o) => {
          let borderCls = o.isLeaked
            ? 'border-rose-500 bg-rose-500/20 text-rose-300'
            : colorCls;
          if (o.isAlive === false)
            borderCls =
              'border-slate-700 bg-slate-900/60 text-slate-500 line-through opacity-40';
          else if (o.isAlive === true)
            borderCls =
              'border-emerald-400 bg-emerald-500/30 text-emerald-300 shadow-[0_0_8px_#34d399]';
          return `<span class="inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[9px] ${borderCls}" title="Object #${o.id} | Size: ${o.sizeMb}MB | Age: ${o.age}">
            #${o.id}<sub class="text-[8px] opacity-75">${o.age}</sub>
          </span>`;
        })
        .join('');
    };

    renderList('eden-objects', eden, 'border-sky-500/50 bg-sky-500/10 text-sky-300');
    renderList('s0-objects', s0, 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300');
    renderList('s1-objects', s1, 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300');
    renderList(
      'tenured-objects',
      tenured,
      'border-amber-500/50 bg-amber-500/10 text-amber-300',
    );
  };

  const allocateObjects = (count: number, isLeaked = false) => {
    for (let i = 0; i < count; i++) {
      eden.push({ id: nextId++, sizeMb: 1, age: 0, isLeaked });
    }
    showBanner(
      `Allocated ${count} objects into Eden — ${eden.length} MB/${EDEN_CAP_MB} MB${isLeaked ? ' (leaked: pinned root, never collected)' : ''}.`,
      isLeaked ? 'warn' : 'info',
    );
    updateMetrics();

    if (sumSize(eden) >= EDEN_CAP_MB * 0.85 && !isProcessing) {
      showBanner('Eden crossed the 85% threshold — Minor GC auto-triggered…', 'warn');
      setTimeout(runMinorGC, 400);
    }
  };

  const runMinorGC = async () => {
    if (isProcessing) return;
    isProcessing = true;

    const stwPause = 3.5 + Math.random() * 2.5;
    totalStwMs += stwPause;
    showBanner(
      `Minor GC #${minorCount + 1}: Stop-The-World — paused ${stwPause.toFixed(1)} ms. Scanning roots…`,
      'warn',
    );
    await stepWait();

    eden.forEach((o) => {
      o.isAlive = o.isLeaked || Math.random() < 0.2;
    });
    const activeSurvivor = activeSurvivorIndex === 0 ? s0 : s1;
    activeSurvivor.forEach((o) => {
      o.isAlive = o.isLeaked || Math.random() < 0.6;
    });
    showBanner(
      'Root tracing: struck-through cards = dead objects, glowing borders = still alive.',
    );
    updateMetrics();
    await stepWait();

    const toSpace = activeSurvivorIndex === 0 ? s1 : s0;
    eden.filter((o) => o.isAlive).forEach((o) => {
      o.age += 1;
      o.isAlive = undefined;
      toSpace.push(o);
    });
    activeSurvivor.filter((o) => o.isAlive).forEach((o) => {
      o.age += 1;
      o.isAlive = undefined;
      toSpace.push(o);
    });
    eden = [];
    if (activeSurvivorIndex === 0) s0 = [];
    else s1 = [];
    showBanner('Copying surviving objects to To Space (age++). Eden is now empty.');
    updateMetrics();
    await stepWait();

    const promoted: SimulatedObject[] = [];
    const keepInSurvivor: SimulatedObject[] = [];
    toSpace.forEach((o) => {
      if (o.age >= 3 || o.isLeaked) promoted.push(o);
      else keepInSurvivor.push(o);
    });
    tenured.push(...promoted);
    if (activeSurvivorIndex === 0) s1 = keepInSurvivor;
    else s0 = keepInSurvivor;

    activeSurvivorIndex = activeSurvivorIndex === 0 ? 1 : 0;
    minorCount++;
    updateMetrics();

    showBanner(
      `Minor GC #${minorCount} done: promoted ${promoted.length} objects to Old Gen, total STW ${totalStwMs.toFixed(1)} ms.`,
    );
    isProcessing = false;

    if (sumSize(tenured) >= TENURED_CAP_MB * 0.88) {
      showBanner('Old Gen full (>88%) — Full GC auto-triggered…', 'warn');
      setTimeout(runFullGC, 600);
    }
  };

  const runFullGC = async () => {
    if (isProcessing) return;
    isProcessing = true;

    const stwPause = 14.5 + Math.random() * 8.5;
    totalStwMs += stwPause;
    majorCount++;

    showBanner(
      `FULL GC: Stop-The-World froze the entire system ${stwPause.toFixed(1)} ms! Scanning Old + Young…`,
      'warn',
    );
    await stepWait();

    tenured = tenured.filter((o) => o.isLeaked);
    eden = [];
    s0 = [];
    s1 = [];

    updateMetrics();
    if (sumSize(tenured) >= TENURED_CAP_MB * 0.9) {
      showBanner(
        'java.lang.OutOfMemoryError: Java heap space — leaked objects cannot be freed!',
        'error',
      );
    } else {
      showBanner(
        `Full GC #${majorCount} done: Young + Old reclaimed, compacted. Total STW ${totalStwMs.toFixed(1)} ms.`,
      );
    }
    isProcessing = false;
  };

  const bind = (id: string, fn: () => void) =>
    document.getElementById(id)?.addEventListener('click', fn);
  bind('btn-alloc-10', () => allocateObjects(10));
  bind('btn-alloc-50', () => allocateObjects(50));
  bind('btn-minor-gc', runMinorGC);
  bind('btn-major-gc', runFullGC);
  bind('btn-leak-sim', () => allocateObjects(20, true));
  document.getElementById('jvm-next')?.addEventListener('click', advanceStep);
  bind('btn-reset-heap', () => {
    eden = [];
    s0 = [];
    s1 = [];
    tenured = [];
    minorCount = 0;
    majorCount = 0;
    totalStwMs = 0;
    activeSurvivorIndex = 0;
    showBanner('JVM heap reset to its initial state.');
    advanceStep();
    nextBtn?.classList.add('hidden');
    updateMetrics();
  });

  updateMetrics();
}
