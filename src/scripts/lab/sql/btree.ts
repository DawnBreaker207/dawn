// B-Tree (order 3) interactive visualizer — insert, search, page-split animation
// Each node holds max 2 keys (t=2 min-degree, so max keys = 2t-1 = 3... using order 3 = max 2 keys)

interface BNode {
  id: number;
  keys: number[];
  children: BNode[];
}

let _idSeq = 0;
const mkNode = (): BNode => ({ id: _idSeq++, keys: [], children: [] });
const isLeaf  = (n: BNode) => n.children.length === 0;
const ORDER   = 3; // max 2 keys, splits when 3 keys

export function initBTreeSimulator(): void {
  const panel = document.getElementById('btree-panel');
  if (!panel || (panel as any).__btreeInit) return;
  (panel as any).__btreeInit = true;

  const insertInput = panel.querySelector<HTMLInputElement>('#bt-insert-val')!;
  const searchInput = panel.querySelector<HTMLInputElement>('#bt-search-val')!;
  const insertBtn   = panel.querySelector<HTMLButtonElement>('#bt-insert')!;
  const searchBtn   = panel.querySelector<HTMLButtonElement>('#bt-search')!;
  const resetBtn    = panel.querySelector<HTMLButtonElement>('#bt-reset')!;
  const bulkBtn     = panel.querySelector<HTMLButtonElement>('#bt-bulk')!;
  const svg         = panel.querySelector<SVGSVGElement>('#bt-svg')!;
  const logEl       = panel.querySelector<HTMLElement>('#bt-log')!;

  let root: BNode = mkNode();
  let highlighted: Set<number> = new Set(); // node ids to highlight
  let highlightColor: 'search' | 'insert' = 'insert';

  const log = (msg: string, cls = '') => {
    const d = document.createElement('div');
    d.className = `bt-log-line ${cls}`;
    d.textContent = msg;
    logEl.prepend(d);
    if (logEl.children.length > 20) logEl.lastElementChild?.remove();
  };

  // ── B-tree core operations ───────────────────────────────────────────────

  // Returns [overflowed, median, rightNode] if split happened at this level
  function insertNonFull(node: BNode, key: number): void {
    if (isLeaf(node)) {
      node.keys.push(key);
      node.keys.sort((a, b) => a - b);
    } else {
      let i = node.keys.length - 1;
      while (i >= 0 && key < node.keys[i]) i--;
      i++;
      insertNonFull(node.children[i], key);
      if (node.children[i].keys.length >= ORDER) {
        splitChild(node, i);
      }
    }
  }

  function splitChild(parent: BNode, idx: number): void {
    const full = parent.children[idx];
    const mid  = Math.floor(full.keys.length / 2);
    const medianKey = full.keys[mid];

    const right = mkNode();
    right.keys    = full.keys.splice(mid + 1);
    right.children = isLeaf(full) ? [] : full.children.splice(mid + 1);
    full.keys.splice(mid, 1); // remove median from left child

    parent.keys.splice(idx, 0, medianKey);
    parent.children.splice(idx + 1, 0, right);
  }

  function insert(key: number): void {
    if (contains(root, key)) { log(`⚠ key ${key} already exists`, 'bt-log-warn'); return; }
    insertNonFull(root, key);
    if (root.keys.length >= ORDER) {
      const oldRoot = root;
      root = mkNode();
      root.children = [oldRoot];
      splitChild(root, 0);
      log(`Root split → new root with key ${root.keys[0]}`, 'bt-log-split');
    }
    highlighted = new Set([/* will highlight all on render */]);
    highlightColor = 'insert';
    log(`Insert ${key} ✓`, 'bt-log-ok');
    render([], 'insert');
  }

  function contains(node: BNode, key: number): boolean {
    const i = node.keys.findIndex(k => k >= key);
    if (i !== -1 && node.keys[i] === key) return true;
    if (isLeaf(node)) return false;
    return contains(node.children[i === -1 ? node.children.length - 1 : i], key);
  }

  function search(node: BNode, key: number, path: number[]): number[] | null {
    path.push(node.id);
    const i = node.keys.findIndex(k => k >= key);
    if (i !== -1 && node.keys[i] === key) return path;
    if (isLeaf(node)) return null;
    return search(node.children[i === -1 ? node.children.length - 1 : i], key, path);
  }

  // ── SVG layout & rendering ───────────────────────────────────────────────

  interface LayoutNode { node: BNode; x: number; y: number; w: number; }

  function layout(node: BNode, depth: number, xOffset: number): { nodes: LayoutNode[]; width: number } {
    const BOX_W = Math.max(40, node.keys.length * 28 + 16);
    const H_GAP = 18;

    if (isLeaf(node)) {
      return { nodes: [{ node, x: xOffset, y: depth * 70, w: BOX_W }], width: BOX_W + H_GAP };
    }

    const childLayouts = node.children.map(c => layout(c, depth + 1, 0));
    let totalW = childLayouts.reduce((s, l) => s + l.width, 0);
    let cx = xOffset;
    const allNodes: LayoutNode[] = [];

    childLayouts.forEach(cl => {
      cl.nodes.forEach(n => { allNodes.push({ ...n, x: n.x + cx }); });
      cx += cl.width;
    });

    // center this node over its children
    const myX = xOffset + (totalW - BOX_W) / 2;
    allNodes.push({ node, x: myX, y: depth * 70, w: BOX_W });
    return { nodes: allNodes, width: Math.max(totalW, BOX_W + H_GAP) };
  }

  function render(searchPath: number[] = [], mode: 'search' | 'insert' = 'insert'): void {
    const { nodes, width } = layout(root, 0, 20);
    const maxY = Math.max(...nodes.map(n => n.y));
    const svgW = Math.max(400, width + 40);
    const svgH = maxY + 60;
    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('width',  String(svgW));
    svg.setAttribute('height', String(svgH));

    // Build lookup: node id → layout info
    const byId = new Map(nodes.map(n => [n.node.id, n]));

    // Draw edges
    let edgesSvg = '';
    nodes.forEach(({ node, x, y, w }) => {
      node.children.forEach(child => {
        const cl = byId.get(child.id)!;
        const x1 = x + w / 2, y1 = y + 26;
        const x2 = cl.x + cl.w / 2, y2 = cl.y;
        edgesSvg += `<path d="M${x1},${y1} C${x1},${(y1+y2)/2} ${x2},${(y1+y2)/2} ${x2},${y2}"
          fill="none" stroke="rgb(148 163 184/0.4)" stroke-width="1.5"/>`;
      });
    });

    // Draw nodes — adapt colors to dark/light mode
    const isDark = document.documentElement.classList.contains('dark');
    let nodesSvg = '';
    nodes.forEach(({ node, x, y, w }) => {
      const inPath = searchPath.includes(node.id);
      const fill   = inPath && mode === 'search'
        ? (isDark ? 'rgb(34 211 238 / 0.18)' : 'rgb(8 145 178 / 0.12)')
        : (isDark ? 'rgb(15 23 42 / 0.85)'   : 'rgb(241 245 249 / 0.9)');
      const stroke = inPath && mode === 'search'
        ? (isDark ? '#67e8f9' : '#0369a1')
        : (isDark ? 'rgb(148 163 184 / 0.35)' : 'rgb(100 116 139 / 0.4)');
      const H = 26;
      const r = 5;
      nodesSvg += `<rect x="${x}" y="${y}" width="${w}" height="${H}" rx="${r}" ry="${r}"
        fill="${fill}" stroke="${stroke}" stroke-width="${inPath?2:1}"/>`;

      // key cells with dividers
      const cellW = w / Math.max(1, node.keys.length);
      const textColor = inPath && mode === 'search'
        ? (isDark ? '#67e8f9' : '#0369a1')
        : (isDark ? '#e2e8f0' : '#1e293b');
      node.keys.forEach((k, i) => {
        const kx = x + i * cellW + cellW / 2;
        const ky = y + H / 2 + 4.5;
        if (i > 0) nodesSvg += `<line x1="${x+i*cellW}" y1="${y+4}" x2="${x+i*cellW}" y2="${y+H-4}"
          stroke="${isDark ? 'rgb(148 163 184/0.25)' : 'rgb(100 116 139/0.2)'}" stroke-width="1"/>`;
        nodesSvg += `<text x="${kx}" y="${ky}" text-anchor="middle" font-size="11"
          font-family="monospace" fill="${textColor}"
          font-weight="${inPath?'700':'400'}">${k}</text>`;
      });
      if (node.keys.length === 0) {
        nodesSvg += `<text x="${x+w/2}" y="${y+H/2+4}" text-anchor="middle" font-size="9"
          font-family="monospace" fill="${isDark ? 'rgb(148 163 184/0.5)' : 'rgb(100 116 139/0.6)'}">(empty)</text>`;
      }
    });

    svg.innerHTML = edgesSvg + nodesSvg;
  }

  // ── Event handlers ───────────────────────────────────────────────────────

  insertBtn.addEventListener('click', () => {
    const v = parseInt(insertInput.value.trim());
    if (isNaN(v) || v < 0 || v > 9999) { log('Enter a number 0–9999', 'bt-log-warn'); return; }
    insert(v);
    insertInput.value = '';
  });
  insertInput.addEventListener('keydown', e => { if (e.key === 'Enter') insertBtn.click(); });

  searchBtn.addEventListener('click', () => {
    const v = parseInt(searchInput.value.trim());
    if (isNaN(v)) { log('Enter a number to search', 'bt-log-warn'); return; }
    const path = search(root, v, []);
    if (path) {
      log(`Found ${v} — path length: ${path.length} level${path.length>1?'s':''}`, 'bt-log-ok');
      render(path, 'search');
    } else {
      log(`${v} not found in tree`, 'bt-log-warn');
      render([], 'search');
    }
    searchInput.value = '';
  });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchBtn.click(); });

  resetBtn.addEventListener('click', () => {
    _idSeq = 0; root = mkNode();
    logEl.innerHTML = '';
    log('Tree cleared.', '');
    render();
  });

  bulkBtn.addEventListener('click', () => {
    const vals = [10, 20, 5, 15, 30, 25, 35, 7, 3, 18, 40, 22, 12, 28, 45];
    _idSeq = 0; root = mkNode();
    vals.forEach(v => {
      insertNonFull(root, v);
      if (root.keys.length >= ORDER) {
        const old = root; root = mkNode(); root.children = [old]; splitChild(root, 0);
      }
    });
    logEl.innerHTML = '';
    log(`Loaded demo tree with ${vals.length} keys: [${vals.sort((a,b)=>a-b).join(', ')}]`, 'bt-log-ok');
    render();
  });

  render();
  log('B-Tree ready. Insert keys to build the tree.', '');
}
