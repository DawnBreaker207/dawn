import { TYPING_SNIPPETS, type TypingLang, type TypingSnippet } from '@/data/typing-snippets';

type LangFilter = TypingLang | 'all';

const BEST_KEY = 'dawn_typing_best_v1';

let controller: AbortController | null = null;
let timer = 0;

function stopLab(): void {
  controller?.abort();
  controller = null;
  window.clearInterval(timer);
  timer = 0;
}

function readBest(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BEST_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object') return parsed as Record<string, number>; // only this page writes the key
  } catch {
    /* storage unavailable or corrupt: start fresh */
  }
  return {};
}

function writeBest(best: Record<string, number>): void {
  try {
    localStorage.setItem(BEST_KEY, JSON.stringify(best));
  } catch {
    /* private mode: the best score just is not kept */
  }
}

const escapeChar = (ch: string): string => (ch === '&' ? '&amp;' : ch === '<' ? '&lt;' : ch === '>' ? '&gt;' : ch);

function initTypingLab(): void {
  stopLab();

  const root = document.getElementById('typing-root');
  const textEl = document.getElementById('typing-text');
  const input = document.getElementById('typing-input') as HTMLTextAreaElement | null; // id is fixed in typing.astro
  const wpmEl = document.getElementById('typing-wpm');
  const accEl = document.getElementById('typing-acc');
  const timeEl = document.getElementById('typing-time');
  const bestEl = document.getElementById('typing-best');
  const titleEl = document.getElementById('typing-title');
  const hintEl = document.getElementById('typing-hint');
  const resultEl = document.getElementById('typing-result');
  const resultTextEl = document.getElementById('typing-result-text');
  if (!root || !textEl || !input || !wpmEl || !accEl || !timeEl || !bestEl || !titleEl || !hintEl || !resultEl || !resultTextEl) return;

  controller = new AbortController();
  const { signal } = controller;

  let filter: LangFilter = 'all';
  let snippet: TypingSnippet = TYPING_SNIPPETS[0];
  let startedAt = 0;
  let totalKeys = 0;
  let wrongKeys = 0;
  let lastLen = 0;
  let done = false;

  const pickSnippet = (): TypingSnippet => {
    const pool = TYPING_SNIPPETS.filter((s) => (filter === 'all' || s.lang === filter) && s.id !== snippet.id);
    const from = pool.length > 0 ? pool : TYPING_SNIPPETS.filter((s) => filter === 'all' || s.lang === filter);
    return from[Math.floor(Math.random() * from.length)] ?? TYPING_SNIPPETS[0];
  };

  const correctCount = (): number => {
    const typed = input.value;
    let n = 0;
    for (let i = 0; i < typed.length; i++) if (typed[i] === snippet.code[i]) n++;
    return n;
  };

  const elapsedMs = (end: number): number => (startedAt ? Math.max(end - startedAt, 0) : 0);
  const wpmAt = (end: number): number => {
    const minutes = Math.max(elapsedMs(end), 2000) / 60000; // avoids a huge number in the first second
    return startedAt ? Math.round(correctCount() / 5 / minutes) : 0;
  };
  const accuracy = (): number => (totalKeys === 0 ? 100 : Math.round((100 * (totalKeys - wrongKeys)) / totalKeys));

  const renderBest = (): void => {
    const best = readBest()[filter];
    bestEl.textContent = best ? String(best) : '-';
  };

  const renderStats = (end = performance.now()): void => {
    wpmEl.textContent = String(wpmAt(end));
    accEl.textContent = `${accuracy()}%`;
    timeEl.textContent = `${(elapsedMs(end) / 1000).toFixed(1)}s`;
  };

  const renderText = (): void => {
    const typed = input.value;
    const code = snippet.code;
    let html = '';
    for (let i = 0; i < code.length; i++) {
      const ch = code[i];
      const state = i < typed.length ? (typed[i] === ch ? 'is-correct' : 'is-wrong') : 'is-pending';
      const cur = i === typed.length && !done ? ' is-current' : '';
      if (ch === '\n') html += `<span class="typing-ch typing-nl ${state}${cur}">↵</span>\n`;
      else html += `<span class="typing-ch ${state}${cur}">${escapeChar(ch)}</span>`;
    }
    textEl.innerHTML = html;
  };

  const resetRound = (): void => {
    window.clearInterval(timer);
    timer = 0;
    input.value = '';
    lastLen = 0;
    startedAt = 0;
    totalKeys = 0;
    wrongKeys = 0;
    done = false;
    root.dataset.state = 'idle';
    resultEl.classList.add('hidden');
    titleEl.textContent = `${snippet.lang} · ${snippet.title}`;
    hintEl.textContent = 'Click here and start typing';
    renderText();
    renderStats();
    renderBest();
    input.focus({ preventScroll: true });
  };

  const nextSnippet = (): void => {
    snippet = pickSnippet();
    resetRound();
  };

  const finish = (): void => {
    done = true;
    window.clearInterval(timer);
    timer = 0;
    const end = performance.now();
    const wpm = wpmAt(end);
    const acc = accuracy();
    const seconds = (elapsedMs(end) / 1000).toFixed(1);

    const best = readBest();
    let record = false;
    for (const key of [snippet.lang, 'all']) {
      if (wpm > (best[key] ?? 0)) {
        best[key] = wpm;
        if (key === filter) record = true;
      }
    }
    writeBest(best);

    root.dataset.state = 'done';
    renderText();
    renderStats(end);
    renderBest();
    resultTextEl.textContent = `${wpm} WPM at ${acc}% accuracy in ${seconds}s${record ? ' — new personal best!' : ''}`;
    resultEl.classList.remove('hidden');
    hintEl.textContent = 'Done';
    window.umami?.track('typing-finish', { lang: snippet.lang, wpm, accuracy: acc });
  };

  input.addEventListener(
    'input',
    () => {
      if (done) {
        input.value = input.value.slice(0, snippet.code.length);
        return;
      }
      const code = snippet.code;
      let value = input.value.replace(/\r/g, '');
      if (value.length > code.length) value = value.slice(0, code.length);

      if (value.length > lastLen) {
        if (!startedAt) {
          startedAt = performance.now();
          root.dataset.state = 'running';
          hintEl.textContent = 'Keep going';
          timer = window.setInterval(() => renderStats(), 250);
        }
        for (let i = lastLen; i < value.length; i++) {
          totalKeys++;
          if (value[i] !== code[i]) wrongKeys++;
        }
        // After a correct Enter the next line's indentation is typed for you.
        if (value.endsWith('\n') && code[value.length - 1] === '\n') {
          let j = value.length;
          while (code[j] === ' ') j++;
          if (j > value.length) value += ' '.repeat(j - value.length);
        }
      }

      input.value = value;
      lastLen = value.length;
      renderText();
      renderStats();
      if (value.length >= code.length) finish();
    },
    { signal },
  );

  input.addEventListener('paste', (e) => e.preventDefault(), { signal });

  input.addEventListener(
    'keydown',
    (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        nextSnippet();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        resetRound();
      } else if (e.key === 'Enter' && done) {
        e.preventDefault();
        nextSnippet();
      }
    },
    { signal },
  );

  document.getElementById('typing-next')?.addEventListener('click', nextSnippet, { signal });
  document.getElementById('typing-restart')?.addEventListener('click', resetRound, { signal });

  const chips = root.querySelectorAll<HTMLButtonElement>('[data-typing-lang]');
  chips.forEach((chip) =>
    chip.addEventListener(
      'click',
      () => {
        filter = (chip.dataset.typingLang ?? 'all') as LangFilter; // values come from TYPING_LANGS in typing.astro
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
        nextSnippet();
      },
      { signal },
    ),
  );

  snippet = pickSnippet();
  resetRound();
}

initTypingLab();
document.addEventListener('astro:page-load', initTypingLab);
document.addEventListener('astro:before-swap', stopLab);
