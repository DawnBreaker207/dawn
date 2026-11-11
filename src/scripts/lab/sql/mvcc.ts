// MVCC (Multi-Version Concurrency Control) step-through simulator
// Models PostgreSQL's snapshot isolation: xmin/xmax version chains + visibility rules.

interface TxnState { id: number; xid: number; snapshot: number[]; status: 'active'|'committed'|'aborted'; startedAt: number; }
interface RowVersion { xmin: number; xmax: number | null; data: string; visible?: boolean; }
interface TimelineEvent { t: number; txn: 'A' | 'B'; label: string; action: string; }

type IsoLevel = 'read_committed' | 'repeatable_read';

export function initMvccSimulator(): void {
  const panel = document.getElementById('mvcc-panel');
  if (!panel || (panel as any).__mvccInit) return;
  (panel as any).__mvccInit = true;

  const isoSel      = panel.querySelector<HTMLSelectElement>('#mvcc-iso')!;
  const logEl       = panel.querySelector<HTMLElement>('#mvcc-log')!;
  const tableEl     = panel.querySelector<HTMLElement>('#mvcc-table')!;
  const resetBtn    = panel.querySelector<HTMLButtonElement>('#mvcc-reset')!;
  const laneAEl     = panel.querySelector<HTMLElement>('#mvcc-lane-a')!;
  const laneBEl     = panel.querySelector<HTMLElement>('#mvcc-lane-b')!;
  const badgeAEl    = panel.querySelector<HTMLElement>('#mvcc-badge-a')!;
  const badgeBEl    = panel.querySelector<HTMLElement>('#mvcc-badge-b')!;
  const snapBadgeEl = panel.querySelector<HTMLElement>('#mvcc-snapshot-badge')!;

  const presetRcBtn = panel.querySelector<HTMLButtonElement>('#mvcc-preset-rc');
  const presetRrBtn = panel.querySelector<HTMLButtonElement>('#mvcc-preset-rr');

  // Transaction buttons
  const btnBeginA   = panel.querySelector<HTMLButtonElement>('#mvcc-begin-a')!;
  const btnBeginB   = panel.querySelector<HTMLButtonElement>('#mvcc-begin-b')!;
  const btnUpdateA  = panel.querySelector<HTMLButtonElement>('#mvcc-update-a')!;
  const btnCommitA  = panel.querySelector<HTMLButtonElement>('#mvcc-commit-a')!;
  const btnAbortA   = panel.querySelector<HTMLButtonElement>('#mvcc-abort-a')!;
  const btnSelectB  = panel.querySelector<HTMLButtonElement>('#mvcc-select-b')!;
  const btnCommitB  = panel.querySelector<HTMLButtonElement>('#mvcc-commit-b')!;

  // State
  let xidCounter = 100;
  let txnA: TxnState | null = null;
  let txnB: TxnState | null = null;
  let timeline: TimelineEvent[] = [];
  let timeStep = 0;

  // committed XIDs at any given moment
  let committedXids: Set<number> = new Set([99]); // xid 99 = "bootstrap" for initial row
  let versions: RowVersion[] = [{ xmin: 99, xmax: null, data: 'Alice — balance: 1000' }];
  let stepCount = 0;

  const log = (msg: string, cls = '') => {
    stepCount++;
    const el = document.createElement('div');
    el.className = `mvcc-log-line ${cls}`;
    el.innerHTML = `<span class="mvcc-step font-mono text-(--fg-faint) mr-1.5">[#${String(stepCount).padStart(2,'0')}]</span>${msg}`;
    logEl.appendChild(el);
    logEl.scrollTop = logEl.scrollHeight;
  };

  const isVisible = (v: RowVersion, snap: number[], txnXid: number, iso: IsoLevel): boolean => {
    // xmin must be committed and in snapshot (or own write)
    const xminOk = v.xmin === txnXid || (committedXids.has(v.xmin) && !snap.includes(v.xmin));
    if (!xminOk) return false;
    // xmax must be null, or not committed, or not in snapshot
    if (v.xmax === null) return true;
    if (v.xmax === txnXid) return false; // own delete
    return !committedXids.has(v.xmax) || snap.includes(v.xmax);
  };

  // snapshot = set of active XIDs at statement/txn start
  const takeSnapshot = (): number[] => {
    const active: number[] = [];
    if (txnA && txnA.status === 'active') active.push(txnA.xid);
    if (txnB && txnB.status === 'active') active.push(txnB.xid);
    return active;
  };

  const renderTimeline = () => {
    if (!laneAEl || !laneBEl) return;

    const eventsA = timeline.filter(e => e.txn === 'A');
    const eventsB = timeline.filter(e => e.txn === 'B');

    laneAEl.innerHTML = eventsA.length === 0
      ? '<span class="rounded border border-dashed border-(--border) px-2 py-0.5 text-[10px] text-(--fg-faint)">No actions yet</span>'
      : eventsA.map(e => `
        <span class="inline-flex items-center gap-1 rounded bg-cyan-950/40 border border-cyan-500/40 px-2 py-0.5 text-[10px] text-cyan-300 whitespace-nowrap">
          <strong class="text-cyan-400">t${e.t}:</strong> ${e.label}
        </span>
      `).join('<span class="text-(--fg-faint) text-[10px]">➔</span>');

    laneBEl.innerHTML = eventsB.length === 0
      ? '<span class="rounded border border-dashed border-(--border) px-2 py-0.5 text-[10px] text-(--fg-faint)">No actions yet</span>'
      : eventsB.map(e => `
        <span class="inline-flex items-center gap-1 rounded bg-violet-950/40 border border-violet-500/40 px-2 py-0.5 text-[10px] text-violet-300 whitespace-nowrap">
          <strong class="text-violet-400">t${e.t}:</strong> ${e.label}
        </span>
      `).join('<span class="text-(--fg-faint) text-[10px]">➔</span>');
  };

  const renderTable = (highlightTxn?: 'A'|'B') => {
    const iso: IsoLevel = isoSel.value as IsoLevel;

    const getSnap = (txn: TxnState | null): number[] => {
      if (!txn) return [];
      if (iso === 'repeatable_read') return txn.snapshot;
      return takeSnapshot().filter(x => x !== txn.xid);
    };

    tableEl.innerHTML = `
      <table class="w-full text-left font-mono text-[11px] border-collapse">
        <thead>
          <tr class="border-b border-(--border) bg-(--bg) text-(--fg-faint) text-[10px] uppercase">
            <th class="p-2.5">xmin (Created)</th>
            <th class="p-2.5">xmax (Deleted)</th>
            <th class="p-2.5">Tuple Data</th>
            <th class="p-2.5 text-center text-cyan-400" title="Visible to Txn A?">Txn A Visible?</th>
            <th class="p-2.5 text-center text-violet-400" title="Visible to Txn B?">Txn B Visible?</th>
          </tr>
        </thead>
        <tbody>
          ${versions.map(v => {
            const visA = txnA ? isVisible(v, getSnap(txnA), txnA.xid, iso) : null;
            const visB = txnB ? isVisible(v, getSnap(txnB), txnB.xid, iso) : null;
            const isLive = v.xmax === null;
            return `<tr class="border-b border-(--border)/60 ${isLive ? 'bg-emerald-950/5' : 'bg-red-950/5 text-(--fg-faint)'}">
              <td class="p-2.5 font-bold text-cyan-400">${v.xmin}</td>
              <td class="p-2.5 font-bold ${v.xmax ? 'text-rose-400' : 'text-(--fg-faint)'}">${v.xmax ?? '∞ (Live)'}</td>
              <td class="p-2.5 ${isLive ? 'text-(--fg) font-semibold' : 'line-through text-(--fg-faint)'}">${v.data}</td>
              <td class="p-2.5 text-center font-bold">${visA === null ? '—' : visA ? '<span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">✓ Visible</span>' : '<span class="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">✗ Hidden</span>'}</td>
              <td class="p-2.5 text-center font-bold">${visB === null ? '—' : visB ? '<span class="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">✓ Visible</span>' : '<span class="text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">✗ Hidden</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

    if (badgeAEl) {
      badgeAEl.textContent = txnA ? `[XID ${txnA.xid}] ${txnA.status.toUpperCase()}` : 'IDLE';
      badgeAEl.className = `rounded px-1.5 py-0.5 text-[9px] font-bold ${txnA?.status === 'active' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-gray-500/20 text-(--fg-faint)'}`;
    }
    if (badgeBEl) {
      badgeBEl.textContent = txnB ? `[XID ${txnB.xid}] ${txnB.status.toUpperCase()}` : 'IDLE';
      badgeBEl.className = `rounded px-1.5 py-0.5 text-[9px] font-bold ${txnB?.status === 'active' ? 'bg-violet-500/20 text-violet-300' : 'bg-gray-500/20 text-(--fg-faint)'}`;
    }
    if (snapBadgeEl) {
      snapBadgeEl.innerHTML = `
        <span class="text-(--fg-faint)">Snapshot Status:</span>
        <span class="rounded bg-(--bg-alt) px-2 py-0.5 font-mono text-(--accent) border border-(--border)">
          ${iso === 'repeatable_read' ? 'Frozen at Txn Start' : 'Fresh per Statement'}
        </span>`;
    }

    renderTimeline();
  };

  const reset = () => {
    xidCounter = 100; txnA = null; txnB = null; stepCount = 0; timeStep = 0;
    timeline = [];
    committedXids = new Set([99]);
    versions = [{ xmin: 99, xmax: null, data: 'Alice — balance: 1000' }];
    logEl.innerHTML = '';
    renderTable();
    updateButtons();
    log('Initialized table: 1 live tuple (xmin=99, xmax=∞, Alice: 1000).', 'text-cyan-400 font-semibold');
  };

  const updateButtons = () => {
    const aActive = txnA?.status === 'active';
    const bActive = txnB?.status === 'active';
    btnBeginA.disabled  = !!txnA;
    btnBeginB.disabled  = !!txnB;
    btnUpdateA.disabled = !aActive;
    btnCommitA.disabled = !aActive;
    btnAbortA.disabled  = !aActive;
    btnSelectB.disabled = !bActive;
    btnCommitB.disabled = !bActive;

    [btnBeginA, btnBeginB, btnUpdateA, btnCommitA, btnAbortA, btnSelectB, btnCommitB].forEach(b => {
      b.classList.toggle('opacity-40', b.disabled);
      b.classList.toggle('cursor-not-allowed', b.disabled);
    });
  };

  btnBeginA.addEventListener('click', () => {
    xidCounter++;
    timeStep++;
    txnA = { id: 1, xid: xidCounter, snapshot: takeSnapshot(), status: 'active', startedAt: Date.now() };
    timeline.push({ t: timeStep, txn: 'A', label: `BEGIN (xid=${txnA.xid})`, action: 'begin' });
    log(`BEGIN Txn A [xid=${txnA.xid}] — snapshot=[${txnA.snapshot.join(',')||'empty'}]`, 'text-cyan-400 font-bold');
    renderTable('A'); updateButtons();
  });

  btnBeginB.addEventListener('click', () => {
    xidCounter++;
    timeStep++;
    txnB = { id: 2, xid: xidCounter, snapshot: takeSnapshot(), status: 'active', startedAt: Date.now() };
    timeline.push({ t: timeStep, txn: 'B', label: `BEGIN (xid=${txnB.xid})`, action: 'begin' });
    log(`BEGIN Txn B [xid=${txnB.xid}] — snapshot=[${txnB.snapshot.join(',')||'empty'}]`, 'text-violet-400 font-bold');
    renderTable('B'); updateButtons();
  });

  btnUpdateA.addEventListener('click', () => {
    if (!txnA) return;
    timeStep++;
    // Mark old live version as deleted by txnA
    const live = versions.find(v => v.xmax === null);
    if (live) live.xmax = txnA.xid;
    // Insert new version owned by txnA
    versions.push({ xmin: txnA.xid, xmax: null, data: 'Alice — balance: 500 (updated by A)' });
    timeline.push({ t: timeStep, txn: 'A', label: `UPDATE Alice=500`, action: 'update' });
    log(`UPDATE (Txn A): Tagged xmax=${txnA.xid} on old row, inserted new version xmin=${txnA.xid}`, 'text-amber-400');
    renderTable('A'); updateButtons();
  });

  btnCommitA.addEventListener('click', () => {
    if (!txnA) return;
    timeStep++;
    committedXids.add(txnA.xid);
    txnA.status = 'committed';
    timeline.push({ t: timeStep, txn: 'A', label: `COMMIT`, action: 'commit' });
    log(`COMMIT Txn A [xid=${txnA.xid}] — Added ${txnA.xid} to committed set`, 'text-emerald-400 font-bold');
    renderTable(); updateButtons();
  });

  btnAbortA.addEventListener('click', () => {
    if (!txnA) return;
    timeStep++;
    versions = versions.filter(v => v.xmin !== txnA!.xid);
    versions.forEach(v => { if (v.xmax === txnA!.xid) v.xmax = null; });
    txnA.status = 'aborted';
    timeline.push({ t: timeStep, txn: 'A', label: `ROLLBACK`, action: 'rollback' });
    log(`ROLLBACK Txn A [xid=${txnA.xid}] — Restored old tuple, purged uncommitted tuple`, 'text-rose-400 font-bold');
    renderTable(); updateButtons();
  });

  btnSelectB.addEventListener('click', () => {
    if (!txnB) return;
    timeStep++;
    const iso: IsoLevel = isoSel.value as IsoLevel;
    const snap = iso === 'repeatable_read' ? txnB.snapshot : takeSnapshot().filter(x => x !== txnB!.xid);
    const visible = versions.filter(v => isVisible(v, snap, txnB!.xid, iso));
    const resultStr = visible.map(v => v.data).join('; ');
    timeline.push({ t: timeStep, txn: 'B', label: `SELECT ➔ "${visible[0]?.data.split(' ')[2] || 'none'}"`, action: 'select' });
    if (visible.length === 0) {
      log(`SELECT (Txn B) [${iso}]: No visible tuples`, 'text-rose-400');
    } else {
      visible.forEach(v => log(`SELECT (Txn B) [${iso}]: Sees ➔ "${v.data}"`, 'text-violet-300 font-semibold'));
    }
    log(`  ↪ Snapshot filter: [${snap.join(',')||'none'}] · Committed XIDs: [${[...committedXids].join(',')}]`, 'text-(--fg-faint)');
    renderTable('B'); updateButtons();
  });

  btnCommitB.addEventListener('click', () => {
    if (!txnB) return;
    timeStep++;
    committedXids.add(txnB.xid);
    txnB.status = 'committed';
    timeline.push({ t: timeStep, txn: 'B', label: `COMMIT`, action: 'commit' });
    log(`COMMIT Txn B [xid=${txnB.xid}]`, 'text-emerald-400 font-bold');
    renderTable(); updateButtons();
  });

  resetBtn.addEventListener('click', reset);
  isoSel.addEventListener('change', () => {
    renderTable();
    log(`Changed isolation level to: ${isoSel.value.toUpperCase()}`, 'text-cyan-400 font-semibold');
  });

  // Guided scenarios
  if (presetRcBtn) {
    presetRcBtn.addEventListener('click', async () => {
      reset();
      isoSel.value = 'read_committed';
      log('--- START SCENARIO: NON-REPEATABLE READ (READ COMMITTED) ---', 'text-amber-400 font-bold');
      await new Promise(r => setTimeout(r, 200));
      btnBeginB.click();
      await new Promise(r => setTimeout(r, 300));
      btnSelectB.click(); // reads 1000
      await new Promise(r => setTimeout(r, 300));
      btnBeginA.click();
      await new Promise(r => setTimeout(r, 300));
      btnUpdateA.click(); // updates to 500
      await new Promise(r => setTimeout(r, 300));
      btnCommitA.click(); // commits
      await new Promise(r => setTimeout(r, 300));
      btnSelectB.click(); // reads 500! -> Non repeatable read observed!
      log('💡 RESULT: Txn B read two distinct values (1000 then 500) within the same transaction!', 'text-amber-300 font-bold');
    });
  }

  if (presetRrBtn) {
    presetRrBtn.addEventListener('click', async () => {
      reset();
      isoSel.value = 'repeatable_read';
      log('--- START SCENARIO: SNAPSHOT ISOLATION (REPEATABLE READ) ---', 'text-cyan-400 font-bold');
      await new Promise(r => setTimeout(r, 200));
      btnBeginB.click();
      await new Promise(r => setTimeout(r, 300));
      btnSelectB.click(); // reads 1000
      await new Promise(r => setTimeout(r, 300));
      btnBeginA.click();
      await new Promise(r => setTimeout(r, 300));
      btnUpdateA.click(); // updates to 500
      await new Promise(r => setTimeout(r, 300));
      btnCommitA.click(); // commits
      await new Promise(r => setTimeout(r, 300));
      btnSelectB.click(); // STILL reads 1000! Snapshot isolation protected!
      log('🛡️ RESULT: Txn B still reads 1000 because its snapshot was frozen at transaction start!', 'text-emerald-400 font-bold');
    });
  }

  reset();
}
