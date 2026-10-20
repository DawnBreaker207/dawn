// Connection Pool + Token Bucket interactive simulators
export function initInfraTools(): void {
  const panel = document.getElementById('infra-panel');
  if (!panel || (panel as any).__infraInit) return;
  (panel as any).__infraInit = true;

  initConnectionPool(panel);
  initTokenBucket(panel);

  // Tab switching
  panel.querySelectorAll<HTMLButtonElement>('[data-infra-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.infraTab!;
      panel.querySelectorAll('[data-infra-tab]').forEach(b =>
        b.classList.toggle('infra-tab-active', (b as HTMLElement).dataset.infraTab === tab)
      );
      panel.querySelectorAll<HTMLElement>('[data-infra-pane]').forEach(p =>
        p.hidden = p.dataset.infraPane !== tab
      );
    });
  });
}

// ── Connection Pool ──────────────────────────────────────────────────────────
function initConnectionPool(root: HTMLElement): void {
  const poolSizeInput = root.querySelector<HTMLInputElement>('#pool-size')!;
  const workersInput  = root.querySelector<HTMLInputElement>('#pool-workers')!;
  const delayInput    = root.querySelector<HTMLInputElement>('#pool-delay')!;
  const startBtn      = root.querySelector<HTMLButtonElement>('#pool-start')!;
  const stopBtn       = root.querySelector<HTMLButtonElement>('#pool-stop')!;
  const slotsEl       = root.querySelector<HTMLElement>('#pool-slots')!;
  const statsEl       = root.querySelector<HTMLElement>('#pool-stats')!;
  const logEl         = root.querySelector<HTMLElement>('#pool-log')!;

  let running = false;
  let timers: ReturnType<typeof setTimeout>[] = [];

  const log = (msg: string, cls = '') => {
    const line = document.createElement('div');
    line.className = `pool-log-line ${cls}`;
    line.textContent = `[${new Date().toLocaleTimeString('en',{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'})}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 30) logEl.lastElementChild?.remove();
  };

  const renderSlots = (slots: boolean[], queue: number) => {
    const free = slots.filter(s => !s).length;
    slotsEl.innerHTML = slots.map((used, i) =>
      `<div class="pool-slot${used?' pool-slot-used':' pool-slot-free'}" title="Slot ${i+1}: ${used?'in use':'free'}">
        <span>${i+1}</span><span class="pool-slot-dot"></span>
      </div>`
    ).join('');
    statsEl.innerHTML =
      `<span class="pool-stat-ok">Free: ${free}</span> · ` +
      `<span class="pool-stat-busy">Used: ${slots.filter(Boolean).length}</span> · ` +
      `<span class="pool-stat-queue">Queue: ${queue}</span>`;
  };

  startBtn.addEventListener('click', () => {
    const poolSize = Math.min(20, Math.max(1, parseInt(poolSizeInput.value) || 5));
    const workers  = Math.min(30, Math.max(1, parseInt(workersInput.value)  || 8));
    const delay    = Math.min(3000, Math.max(200, parseInt(delayInput.value) || 600));

    timers.forEach(clearTimeout);
    timers = [];
    running = true;
    logEl.innerHTML = '';

    const slots: boolean[] = Array(poolSize).fill(false);
    let queue = 0;
    renderSlots(slots, queue);
    log(`Pool started — size=${poolSize}, workers=${workers}`, 'pool-log-ok');

    const scheduleWorker = (workerIdx: number, offset: number) => {
      if (!running) return;
      const t1 = setTimeout(() => {
        if (!running) return;
        const freeIdx = slots.findIndex(s => !s);
        if (freeIdx === -1) {
          queue++;
          log(`Worker ${workerIdx} → queued (pool exhausted)`, 'pool-log-warn');
          renderSlots(slots, queue);
          const retry = setTimeout(() => {
            if (!running) return;
            const f2 = slots.findIndex(s => !s);
            if (f2 !== -1) { slots[f2] = true; queue = Math.max(0, queue-1); log(`Worker ${workerIdx} → acquired slot ${f2+1} (from queue)`, 'pool-log-ok'); }
            renderSlots(slots, queue);
            const holdMs = 300 + Math.random() * delay;
            const t2 = setTimeout(() => {
              if (!running) return;
              const idx = slots.indexOf(true);
              if (idx !== -1) { slots[idx] = false; log(`Worker ${workerIdx} → released slot`, ''); renderSlots(slots, queue); }
            }, holdMs);
            timers.push(t2);
          }, 400 + Math.random() * 300);
          timers.push(retry);
        } else {
          slots[freeIdx] = true;
          log(`Worker ${workerIdx} → acquired slot ${freeIdx+1}`, 'pool-log-ok');
          renderSlots(slots, queue);
          const holdMs = 200 + Math.random() * delay;
          const t2 = setTimeout(() => {
            if (!running) return;
            slots[freeIdx] = false;
            log(`Worker ${workerIdx} → released slot ${freeIdx+1}`, '');
            renderSlots(slots, queue);
          }, holdMs);
          timers.push(t2);
        }
        scheduleWorker(workerIdx, delay * 0.8 + Math.random() * delay);
      }, offset);
      timers.push(t1);
    };

    for (let w = 1; w <= workers; w++) {
      scheduleWorker(w, Math.random() * delay * 0.5);
    }
    startBtn.disabled = true;
    stopBtn.disabled  = false;
  });

  stopBtn.addEventListener('click', () => {
    running = false;
    timers.forEach(clearTimeout);
    timers = [];
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    log('Pool stopped.', 'pool-log-warn');
  });
  stopBtn.disabled = true;
}

// ── Token Bucket ─────────────────────────────────────────────────────────────
function initTokenBucket(root: HTMLElement): void {
  const capInput  = root.querySelector<HTMLInputElement>('#tb-capacity')!;
  const fillInput = root.querySelector<HTMLInputElement>('#tb-fill-rate')!;
  const reqInput  = root.querySelector<HTMLInputElement>('#tb-req-rate')!;
  const startBtn  = root.querySelector<HTMLButtonElement>('#tb-start')!;
  const stopBtn   = root.querySelector<HTMLButtonElement>('#tb-stop')!;
  const bucketEl  = root.querySelector<HTMLElement>('#tb-bucket')!;
  const statsEl   = root.querySelector<HTMLElement>('#tb-stats')!;
  const logEl     = root.querySelector<HTMLElement>('#tb-log')!;

  let rafId = 0;
  let reqTimerId: ReturnType<typeof setInterval> | null = null;
  let tokens = 0;
  let accepted = 0, rejected = 0;

  const log = (msg: string, cls = '') => {
    const line = document.createElement('div');
    line.className = `pool-log-line ${cls}`;
    line.textContent = `[${new Date().toLocaleTimeString('en',{hour12:false})}] ${msg}`;
    logEl.prepend(line);
    if (logEl.children.length > 30) logEl.lastElementChild?.remove();
  };

  const render = (capacity: number) => {
    const pct = Math.min(100, (tokens / capacity) * 100);
    const color = pct > 60 ? '#4ade80' : pct > 25 ? '#facc15' : '#f87171';
    bucketEl.innerHTML =
      `<div class="tb-bucket-outer">
        <div class="tb-bucket-fill" style="height:${pct}%;background:${color}88;border-top:2px solid ${color}">
          <span class="tb-bucket-count">${Math.floor(tokens)}</span>
        </div>
        <div class="tb-bucket-cap">${capacity}</div>
      </div>`;
    statsEl.innerHTML =
      `<span class="pool-stat-ok">✓ Accepted: ${accepted}</span> · ` +
      `<span style="color:#f87171">✗ Rejected: ${rejected}</span> · ` +
      `<span>Tokens: ${Math.floor(tokens)}/${capacity}</span>`;
  };

  startBtn.addEventListener('click', () => {
    const capacity = Math.min(100, Math.max(1, parseInt(capInput.value)   || 20));
    const fillRate = Math.min(50,  Math.max(0.1, parseFloat(fillInput.value) || 5));
    const reqRate  = Math.min(30,  Math.max(0.1, parseFloat(reqInput.value)  || 8));

    tokens = capacity; accepted = 0; rejected = 0;
    logEl.innerHTML = '';
    log(`Bucket started — capacity=${capacity}, fill=${fillRate}/s, req=${reqRate}/s`, 'pool-log-ok');
    render(capacity);

    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      tokens = Math.min(capacity, tokens + fillRate * dt);
      render(capacity);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    const intervalMs = 1000 / reqRate;
    reqTimerId = setInterval(() => {
      if (tokens >= 1) {
        tokens -= 1;
        accepted++;
        log(`Request allowed (${Math.floor(tokens)} tokens left)`, 'pool-log-ok');
      } else {
        rejected++;
        log(`Request DROPPED — bucket empty`, 'pool-log-warn');
      }
      render(capacity);
    }, intervalMs);

    startBtn.disabled = true;
    stopBtn.disabled  = false;
  });

  stopBtn.addEventListener('click', () => {
    cancelAnimationFrame(rafId);
    if (reqTimerId) clearInterval(reqTimerId);
    reqTimerId = null;
    startBtn.disabled = false;
    stopBtn.disabled  = true;
    log('Stopped.', '');
  });
  stopBtn.disabled = true;
}
