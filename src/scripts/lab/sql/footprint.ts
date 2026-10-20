// Index Footprint Calculator — B-Tree vs BRIN size estimator
export function initFootprintCalc(): void {
  const panel = document.getElementById('fp-panel');
  if (!panel || (panel as any).__fpInit) return;
  (panel as any).__fpInit = true;

  const colSel   = panel.querySelector<HTMLSelectElement>('#fp-col-type')!;
  const rowInput = panel.querySelector<HTMLInputElement>('#fp-rows')!;
  const addBtn   = panel.querySelector<HTMLButtonElement>('#fp-add-col')!;
  const calcBtn  = panel.querySelector<HTMLButtonElement>('#fp-calc')!;
  const colList  = panel.querySelector<HTMLElement>('#fp-col-list')!;
  const result   = panel.querySelector<HTMLElement>('#fp-result')!;

  const COL_SIZES: Record<string, number> = {
    'boolean':1,'smallint':2,'integer':4,'bigint':8,
    'float4':4,'float8':8,'date':4,'timestamp':8,'timestamptz':8,
    'uuid':16,'char(10)':10,'varchar(50)':50,'varchar(255)':255,'numeric(10,2)':10,
  };

  let columns: { label: string; size: number }[] = [{ label: 'bigint', size: 8 }];

  const renderCols = () => {
    colList.innerHTML = columns.map((c, i) =>
      `<span class="fp-tag">${c.label} (${c.size}B)<button data-i="${i}" class="fp-tag-rm">×</button></span>`
    ).join('');
    colList.querySelectorAll<HTMLButtonElement>('[data-i]').forEach(b =>
      b.addEventListener('click', () => { columns.splice(+b.dataset.i!, 1); renderCols(); })
    );
  };
  renderCols();

  addBtn.addEventListener('click', () => {
    const t = colSel.value;
    columns.push({ label: t, size: COL_SIZES[t] ?? 8 });
    renderCols();
  });

  calcBtn.addEventListener('click', () => {
    const rows = Math.max(1, parseInt(rowInput.value) || 1_000_000);
    const keySize = columns.reduce((s, c) => s + c.size, 0);

    const PAGE = 8192, HDR = 24;
    const usable = PAGE - HDR;
    const leafEntry = keySize + 6 + 8; // key + TID(6) + ItemId overhead(8)
    const intEntry  = keySize + 6 + 8;
    const leafPP    = Math.floor(usable / leafEntry);
    const intPP     = Math.floor(usable / intEntry);
    const FILL      = 0.70;

    const leafPages = Math.ceil(rows / (leafPP * FILL));
    let total = leafPages, level = leafPages, depth = 1;
    while (level > 1) { level = Math.ceil(level / intPP); total += level; depth++; }
    total += 1; // meta
    const btreeBytes = total * PAGE;

    const PPR = 128; // BRIN pages_per_range default
    const brinRanges = Math.ceil(rows / PPR);
    const brinEntry  = 2 * keySize + 40;
    const brinPP     = Math.floor(usable / brinEntry);
    const brinPages  = Math.ceil(brinRanges / brinPP) + 2;
    const brinBytes  = brinPages * PAGE;

    const fmt  = (b: number) => b >= 1<<20 ? `${(b/1048576).toFixed(2)} MB` : b >= 1024 ? `${(b/1024).toFixed(0)} KB` : `${b} B`;
    const fmtN = (n: number) => n.toLocaleString();
    const ratio = (btreeBytes / brinBytes).toFixed(1);
    const brinPct = Math.max(2, Math.min(98, 100 / parseFloat(ratio)));

    result.innerHTML = `
      <div class="fp-grid">
        <div class="fp-card" style="border-color:rgb(34 211 238/0.4);background:rgb(34 211 238/0.04)">
          <div class="fp-card-head" style="color:#67e8f9">B-Tree Index</div>
          <div class="fp-row"><span>Size</span><strong style="color:#67e8f9">${fmt(btreeBytes)}</strong></div>
          <div class="fp-row"><span>Pages</span><strong>${fmtN(total)}</strong></div>
          <div class="fp-row"><span>Leaf pages</span><strong>${fmtN(leafPages)}</strong></div>
          <div class="fp-row"><span>Tree depth</span><strong>${depth} level${depth>1?'s':''}</strong></div>
          <div class="fp-row"><span>Entries/leaf</span><strong>~${leafPP}</strong></div>
          <div class="fp-row"><span>Key width</span><strong>${keySize} B + 6 B TID</strong></div>
          <p class="fp-note">70% fill (random keys). Sequential keys → ~100% fill, half the pages.</p>
        </div>
        <div class="fp-card" style="border-color:rgb(251 191 36/0.4);background:rgb(251 191 36/0.04)">
          <div class="fp-card-head" style="color:#fbbf24">BRIN Index</div>
          <div class="fp-row"><span>Size</span><strong style="color:#fbbf24">${fmt(brinBytes)}</strong></div>
          <div class="fp-row"><span>Pages</span><strong>${fmtN(brinPages)}</strong></div>
          <div class="fp-row"><span>Ranges</span><strong>${fmtN(brinRanges)}</strong></div>
          <div class="fp-row"><span>pages_per_range</span><strong>128 (default)</strong></div>
          <div class="fp-row"><span>vs B-Tree</span><strong>${ratio}× smaller</strong></div>
          <p class="fp-note">Only useful when physical row order correlates with key order (sequential IDs, timestamps).</p>
        </div>
      </div>
      <div class="fp-bars">
        <div class="fp-bar-row">
          <span class="fp-bar-lbl">B-Tree</span>
          <div class="fp-bar-track"><div class="fp-bar-fill" style="width:100%;background:rgb(34 211 238/0.5)">${fmt(btreeBytes)}</div></div>
        </div>
        <div class="fp-bar-row">
          <span class="fp-bar-lbl">BRIN</span>
          <div class="fp-bar-track"><div class="fp-bar-fill" style="width:${brinPct}%;background:rgb(251 191 36/0.5)">${fmt(brinBytes)}</div></div>
        </div>
      </div>
      <p class="fp-verdict">${
        parseFloat(ratio) > 100
          ? `BRIN is <strong>${ratio}×</strong> smaller for ${fmtN(rows)} rows — ideal for append-only or time-series workloads. Avoid for random-access point lookups.`
          : `B-Tree adds only ${fmt(btreeBytes)} for ${fmtN(rows)} rows — a good trade for random-access query patterns.`
      }</p>`;
  });
}
