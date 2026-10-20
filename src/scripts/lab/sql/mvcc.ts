// MVCC (Multi-Version Concurrency Control) step-through simulator
// Models PostgreSQL's snapshot isolation: xmin/xmax version chains + visibility rules.

interface TxnState { id: number; xid: number; snapshot: number[]; status: 'active'|'committed'|'aborted'; startedAt: number; }
interface RowVersion { xmin: number; xmax: number | null; data: string; visible?: boolean; }

type IsoLevel = 'read_committed' | 'repeatable_read';

export function initMvccSimulator(): void {
  const panel = document.getElementById('mvcc-panel');
  if (!panel || (panel as any).__mvccInit) return;
  (panel as any).__mvccInit = true;

  const isoSel   = panel.querySelector<HTMLSelectElement>('#mvcc-iso')!;
  const logEl    = panel.querySelector<HTMLElement>('#mvcc-log')!;
  const tableEl  = panel.querySelector<HTMLElement>('#mvcc-table')!;
  const resetBtn = panel.querySelector<HTMLButtonElement>('#mvcc-reset')!;

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
  // committed XIDs at any given moment
  let committedXids: Set<number> = new Set([99]); // xid 99 = "bootstrap" for initial row
  let versions: RowVersion[] = [{ xmin: 99, xmax: null, data: 'Alice — balance: 1000' }];
  let stepCount = 0;

  const log = (msg: string, cls = '') => {
    stepCount++;
    const el = document.createElement('div');
    el.className = `mvcc-log-line ${cls}`;
    el.innerHTML = `<span class="mvcc-step">${String(stepCount).padStart(2,'0')}</span>${msg}`;
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

  const renderTable = (highlightTxn?: 'A'|'B') => {
    const iso: IsoLevel = isoSel.value as IsoLevel;

    const getSnap = (txn: TxnState | null): number[] => {
      if (!txn) return [];
      if (iso === 'repeatable_read') return txn.snapshot;
      return takeSnapshot().filter(x => x !== txn.xid);
    };

    tableEl.innerHTML = `
      <table class="mvcc-tbl">
        <thead>
          <tr>
            <th>xmin</th><th>xmax</th><th>data</th>
            <th title="Visible to Txn A?">Txn A</th>
            <th title="Visible to Txn B?">Txn B</th>
          </tr>
        </thead>
        <tbody>
          ${versions.map(v => {
            const visA = txnA ? isVisible(v, getSnap(txnA), txnA.xid, iso) : null;
            const visB = txnB ? isVisible(v, getSnap(txnB), txnB.xid, iso) : null;
            const rowCls = v.xmax === null ? 'mvcc-row-live' : 'mvcc-row-dead';
            return `<tr class="mvcc-row ${rowCls}${highlightTxn?` mvcc-row-hl-${highlightTxn.toLowerCase()}`:''}">
              <td class="mvcc-xid">${v.xmin}</td>
              <td class="mvcc-xid">${v.xmax ?? '∞'}</td>
              <td class="mvcc-data">${v.data}</td>
              <td class="mvcc-vis">${visA===null?'—':visA?'<span class="mvcc-y">✓</span>':'<span class="mvcc-n">✗</span>'}</td>
              <td class="mvcc-vis">${visB===null?'—':visB?'<span class="mvcc-y">✓</span>':'<span class="mvcc-n">✗</span>'}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
      <div class="mvcc-txn-status">
        ${txnA ? `<span class="mvcc-txn-badge mvcc-txn-a">Txn A [xid=${txnA.xid}] ${txnA.status}</span>` : ''}
        ${txnB ? `<span class="mvcc-txn-badge mvcc-txn-b">Txn B [xid=${txnB.xid}] ${txnB.status}</span>` : ''}
      </div>`;
  };

  const reset = () => {
    xidCounter = 100; txnA = null; txnB = null; stepCount = 0;
    committedXids = new Set([99]);
    versions = [{ xmin: 99, xmax: null, data: 'Alice — balance: 1000' }];
    logEl.innerHTML = '';
    renderTable();
    updateButtons();
    log('Reset. Initial table: one live row (xmin=99, xmax=∞).', 'mvcc-log-init');
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
  };

  btnBeginA.addEventListener('click', () => {
    xidCounter++;
    txnA = { id: 1, xid: xidCounter, snapshot: takeSnapshot(), status: 'active', startedAt: Date.now() };
    log(`BEGIN Txn A — assigned xid=${txnA.xid}, snapshot=[${txnA.snapshot.join(',')||'empty'}]`, 'mvcc-log-a');
    renderTable('A'); updateButtons();
  });

  btnBeginB.addEventListener('click', () => {
    xidCounter++;
    txnB = { id: 2, xid: xidCounter, snapshot: takeSnapshot(), status: 'active', startedAt: Date.now() };
    log(`BEGIN Txn B — assigned xid=${txnB.xid}, snapshot=[${txnB.snapshot.join(',')||'empty'}]`, 'mvcc-log-b');
    renderTable('B'); updateButtons();
  });

  btnUpdateA.addEventListener('click', () => {
    if (!txnA) return;
    // Mark old live version as deleted by txnA
    const live = versions.find(v => v.xmax === null);
    if (live) live.xmax = txnA.xid;
    // Insert new version owned by txnA
    versions.push({ xmin: txnA.xid, xmax: null, data: 'Alice — balance: 500 (updated by A)' });
    log(`UPDATE (Txn A): set xmax=${txnA.xid} on old row, inserted new version xmin=${txnA.xid}`, 'mvcc-log-a');
    renderTable('A'); updateButtons();
  });

  btnCommitA.addEventListener('click', () => {
    if (!txnA) return;
    committedXids.add(txnA.xid);
    txnA.status = 'committed';
    log(`COMMIT Txn A [xid=${txnA.xid}] — xid added to committed set`, 'mvcc-log-a');
    renderTable(); updateButtons();
  });

  btnAbortA.addEventListener('click', () => {
    if (!txnA) return;
    // Undo: remove versions written by txnA, restore xmax on deleted rows
    versions = versions.filter(v => v.xmin !== txnA!.xid);
    versions.forEach(v => { if (v.xmax === txnA!.xid) v.xmax = null; });
    txnA.status = 'aborted';
    log(`ROLLBACK Txn A [xid=${txnA.xid}] — all changes reverted`, 'mvcc-log-warn');
    renderTable(); updateButtons();
  });

  btnSelectB.addEventListener('click', () => {
    if (!txnB) return;
    const iso: IsoLevel = isoSel.value as IsoLevel;
    // For READ COMMITTED, take a fresh snapshot at statement time
    const snap = iso === 'repeatable_read' ? txnB.snapshot : takeSnapshot().filter(x => x !== txnB!.xid);
    const visible = versions.filter(v => isVisible(v, snap, txnB!.xid, iso));
    if (visible.length === 0) {
      log(`SELECT (Txn B) [${iso}]: no visible rows`, 'mvcc-log-b');
    } else {
      visible.forEach(v => log(`SELECT (Txn B) [${iso}]: sees → "${v.data}"`, 'mvcc-log-b'));
    }
    log(`  snapshot used: [${snap.join(',')||'empty'}] | committed: [${[...committedXids].join(',')}]`, 'mvcc-log-dim');
    renderTable('B'); updateButtons();
  });

  btnCommitB.addEventListener('click', () => {
    if (!txnB) return;
    committedXids.add(txnB.xid);
    txnB.status = 'committed';
    log(`COMMIT Txn B [xid=${txnB.xid}]`, 'mvcc-log-b');
    renderTable(); updateButtons();
  });

  resetBtn.addEventListener('click', reset);
  isoSel.addEventListener('change', () => { renderTable(); log(`Isolation level changed to: ${isoSel.value}`, 'mvcc-log-init'); });

  reset();
}
