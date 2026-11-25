/**
 * 2048 Studio Edition — Pure TypeScript game engine with smooth CSS transform
 * slide animations, merge pop, and spawn animations.
 */

type Direction = 'up' | 'down' | 'left' | 'right';

interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  mergedFrom?: [Tile, Tile];
}

const GRID_SIZE = 4;
const BEST_KEY = 'dawn_2048_best';
const SLIDE_MS = 135;

const TILE_STYLES: Record<number, string> = {
  2: 'bg-(--bg-alt) text-(--fg) border-(--border) shadow-xs',
  4: 'bg-(--bg-subtle) text-(--fg) border-(--border) shadow-xs',
  8: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/40',
  16: 'bg-orange-500/25 text-orange-700 dark:text-orange-300 border-orange-500/45',
  32: 'bg-rose-500/25 text-rose-700 dark:text-rose-300 border-rose-500/45',
  64: 'bg-rose-600 text-white border-rose-600',
  128: 'bg-pink-600 text-white border-pink-600',
  256: 'bg-fuchsia-600 text-white border-fuchsia-600',
  512: 'bg-violet-600 text-white border-violet-600',
  1024: 'bg-indigo-600 text-white border-indigo-600',
  2048: 'bg-emerald-600 text-white border-emerald-500',
};

let nextTileId = 1;

function createEmptyGrid(): (Tile | null)[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));
}

function cloneValues(grid: (Tile | null)[][]): number[][] {
  return grid.map((row) => row.map((t) => (t ? t.value : 0)));
}

function valuesToGrid(values: number[][]): (Tile | null)[][] {
  const grid = createEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (values[r][c] > 0) {
        grid[r][c] = { id: nextTileId++, value: values[r][c], row: r, col: c };
      }
    }
  }
  return grid;
}

function addRandomTile(grid: (Tile | null)[][]): boolean {
  const empty: Array<[number, number]> = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!grid[r][c]) empty.push([r, c]);
    }
  }
  if (empty.length === 0) return false;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  grid[r][c] = {
    id: nextTileId++,
    value: Math.random() < 0.9 ? 2 : 4,
    row: r,
    col: c,
    isNew: true,
  };
  return true;
}

function hasMoves(grid: (Tile | null)[][]): boolean {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = grid[r][c];
      if (!t) return true;
      if (r + 1 < GRID_SIZE && grid[r + 1][c]?.value === t.value) return true;
      if (c + 1 < GRID_SIZE && grid[r][c + 1]?.value === t.value) return true;
    }
  }
  return false;
}

function moveGrid(grid: (Tile | null)[][], dir: Direction): { gained: number; moved: boolean } {
  const dr = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
  const dc = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;

  const rows = [0, 1, 2, 3];
  const cols = [0, 1, 2, 3];
  if (dir === 'down') rows.reverse();
  if (dir === 'right') cols.reverse();

  // Clear previous transient animation flags
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const t = grid[r][c];
      if (t) {
        t.isNew = false;
        t.mergedFrom = undefined;
      }
    }
  }

  let gained = 0;
  let moved = false;
  const mergedThisTurn = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));

  for (const r of rows) {
    for (const c of cols) {
      const tile = grid[r][c];
      if (!tile) continue;

      let nr = r;
      let nc = c;
      while (true) {
        const tr = nr + dr;
        const tc = nc + dc;
        if (tr < 0 || tr >= GRID_SIZE || tc < 0 || tc >= GRID_SIZE) break;
        if (grid[tr][tc] !== null) break;
        nr = tr;
        nc = tc;
      }

      const mergeR = nr + dr;
      const mergeC = nc + dc;
      const target =
        mergeR >= 0 && mergeR < GRID_SIZE && mergeC >= 0 && mergeC < GRID_SIZE
          ? grid[mergeR][mergeC]
          : null;

      if (target && target.value === tile.value && !mergedThisTurn[mergeR][mergeC]) {
        const merged: Tile = {
          id: nextTileId++,
          value: tile.value * 2,
          row: mergeR,
          col: mergeC,
          mergedFrom: [
            { ...tile, row: mergeR, col: mergeC },
            { ...target, row: mergeR, col: mergeC },
          ],
        };
        grid[r][c] = null;
        grid[mergeR][mergeC] = merged;
        mergedThisTurn[mergeR][mergeC] = true;
        gained += merged.value;
        moved = true;
      } else if (nr !== r || nc !== c) {
        grid[r][c] = null;
        tile.row = nr;
        tile.col = nc;
        grid[nr][nc] = tile;
        moved = true;
      }
    }
  }

  return { gained, moved };
}

function init2048Lab(): void {
  const gridEl = document.getElementById('g2048-grid');
  const bgEl = document.getElementById('g2048-bg');
  const tilesEl = document.getElementById('g2048-tiles');
  if (!gridEl || !bgEl || !tilesEl || gridEl.dataset.initialized === '1') return;
  gridEl.dataset.initialized = '1';

  const bgCells = Array.from(bgEl.children) as HTMLElement[];
  const scoreEl = document.getElementById('g2048-score');
  const bestEl = document.getElementById('g2048-best');
  const statusEl = document.getElementById('g2048-status');
  const newBtn = document.getElementById('g2048-new');
  const undoBtn = document.getElementById('g2048-undo') as HTMLButtonElement | null;

  let grid = createEmptyGrid();
  let prevValues: number[][] | null = null;
  let score = 0;
  let prevScore = 0;
  let best = Number(localStorage.getItem(BEST_KEY) || '0') || 0;
  let won = false;
  let gameOver = false;

  const domById = new Map<number, HTMLDivElement>();
  let cleanupTimer: number | null = null;

  function cellMetrics(row: number, col: number): { left: number; top: number; size: number } {
    const cell = bgCells[row * GRID_SIZE + col];
    if (!cell) return { left: 0, top: 0, size: 64 };
    return {
      left: cell.offsetLeft,
      top: cell.offsetTop,
      size: cell.offsetWidth,
    };
  }

  function styleTileInner(inner: HTMLElement, value: number, animClass = ''): void {
    const palette = TILE_STYLES[value] ?? 'bg-emerald-700 text-white border-emerald-500';
    const fontSize = value >= 1024 ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl';
    inner.className = `flex h-full w-full items-center justify-center rounded-lg border font-mono font-bold ${fontSize} ${palette} ${animClass}`;
    inner.textContent = String(value);
  }

  function createOrUpdateTileDom(tile: Tile, animClass = ''): HTMLDivElement {
    let wrapper = domById.get(tile.id);
    const { left, top, size } = cellMetrics(tile.row, tile.col);

    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'g2048-tile absolute top-0 left-0';
      wrapper.style.width = `${size}px`;
      wrapper.style.height = `${size}px`;
      wrapper.style.transform = `translate3d(${left}px, ${top}px, 0)`;

      const inner = document.createElement('div');
      styleTileInner(inner, tile.value, animClass);
      wrapper.appendChild(inner);
      tilesEl!.appendChild(wrapper);
      domById.set(tile.id, wrapper);
    } else {
      wrapper.style.width = `${size}px`;
      wrapper.style.height = `${size}px`;
      const inner = wrapper.firstElementChild as HTMLElement | null;
      if (inner) styleTileInner(inner, tile.value, animClass);
      requestAnimationFrame(() => {
        wrapper!.style.transform = `translate3d(${left}px, ${top}px, 0)`;
      });
    }
    return wrapper;
  }

  function render(animate = true): void {
    if (scoreEl) scoreEl.textContent = String(score);
    if (bestEl) bestEl.textContent = String(best);
    if (undoBtn) undoBtn.disabled = !prevValues;
    if (statusEl) {
      if (gameOver) {
        statusEl.textContent = 'Game over — press New Game or Undo.';
      } else if (won) {
        statusEl.textContent = '2048 reached! Keep going or start a new game.';
      } else {
        statusEl.textContent = 'Use Arrow keys, WASD, or swipe.';
      }
    }

    if (cleanupTimer !== null) {
      window.clearTimeout(cleanupTimer);
      cleanupTimer = null;
    }

    const activeIds = new Set<number>();
    const retiringIds: number[] = [];

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const tile = grid[r][c];
        if (!tile) continue;

        if (animate && tile.mergedFrom) {
          for (const src of tile.mergedFrom) {
            activeIds.add(src.id);
            retiringIds.push(src.id);
            createOrUpdateTileDom(src);
          }
          activeIds.add(tile.id);
          const mergedDom = createOrUpdateTileDom(tile, 'g2048-pop');
          mergedDom.style.zIndex = '2';
        } else {
          activeIds.add(tile.id);
          const anim = animate && tile.isNew ? 'g2048-appear' : '';
          const dom = createOrUpdateTileDom(tile, anim);
          dom.style.zIndex = '1';
        }
      }
    }

    for (const [id, el] of domById.entries()) {
      if (!activeIds.has(id)) {
        el.remove();
        domById.delete(id);
      }
    }

    if (retiringIds.length > 0) {
      cleanupTimer = window.setTimeout(() => {
        for (const id of retiringIds) {
          domById.get(id)?.remove();
          domById.delete(id);
        }
        cleanupTimer = null;
      }, SLIDE_MS);
    }
  }

  function startNewGame(): void {
    tilesEl!.innerHTML = '';
    domById.clear();
    grid = createEmptyGrid();
    prevValues = null;
    score = 0;
    prevScore = 0;
    won = false;
    gameOver = false;
    addRandomTile(grid);
    addRandomTile(grid);
    render(true);
  }

  function applyMove(dir: Direction): void {
    if (gameOver) return;
    const snapshot = cloneValues(grid);
    const { gained, moved } = moveGrid(grid, dir);
    if (!moved) return;

    prevValues = snapshot;
    prevScore = score;
    score += gained;
    if (score > best) {
      best = score;
      localStorage.setItem(BEST_KEY, String(best));
    }
    addRandomTile(grid);
    const umami = (window as unknown as { umami?: { track: (name: string, data?: Record<string, unknown>) => void } }).umami;
    if (!won && grid.some((row) => row.some((t) => t && t.value >= 2048))) {
      won = true;
      umami?.track('2048-win', { score });
    }
    if (!hasMoves(grid)) {
      gameOver = true;
      umami?.track('2048-game-over', { score });
    }
    render(true);
  }

  window.addEventListener('keydown', (e) => {
    const target = e.target as HTMLElement | null;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
    const keyMap: Record<string, Direction> = {
      ArrowUp: 'up',
      w: 'up',
      W: 'up',
      ArrowDown: 'down',
      s: 'down',
      S: 'down',
      ArrowLeft: 'left',
      a: 'left',
      A: 'left',
      ArrowRight: 'right',
      d: 'right',
      D: 'right',
    };
    const dir = keyMap[e.key];
    if (!dir) return;
    e.preventDefault();
    applyMove(dir);
  });

  let touchStartX = 0;
  let touchStartY = 0;
  gridEl.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (!t) return;
      touchStartX = t.clientX;
      touchStartY = t.clientY;
    },
    { passive: true }
  );
  gridEl.addEventListener(
    'touchend',
    (e) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        applyMove(dx > 0 ? 'right' : 'left');
      } else {
        applyMove(dy > 0 ? 'down' : 'up');
      }
    },
    { passive: true }
  );

  window.addEventListener('resize', () => render(false));
  newBtn?.addEventListener('click', startNewGame);
  undoBtn?.addEventListener('click', () => {
    if (!prevValues) return;
    tilesEl!.innerHTML = '';
    domById.clear();
    grid = valuesToGrid(prevValues);
    score = prevScore;
    prevValues = null;
    gameOver = false;
    render(false);
  });

  document.querySelectorAll<HTMLButtonElement>('[data-g2048-dir]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const dir = btn.dataset.g2048Dir as Direction | undefined;
      if (dir) applyMove(dir);
    });
  });

  startNewGame();
}

init2048Lab();
document.addEventListener('astro:page-load', init2048Lab);
