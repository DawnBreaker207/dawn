import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

interface PaletteEntry {
  kind: 'cmd' | 'txt' | 'jsx' | 'err';
  text?: string;
  node?: ReactNode;
}

interface PaletteItem {
  title: string;
  desc: string;
  route: string;
}

interface Sugg {
  text: string;
  desc: string;
  type: 'cmd' | 'arg' | 'id' | 'go';
  route?: string;
}

interface PaletteProps {
  blogPosts: PaletteItem[];
  projects: PaletteItem[];
}

const ShellPrompt = (): React.JSX.Element => (
  <span className="pal-ps1" aria-hidden="true">
    <span className="pal-ps1-user">dawn</span>@<span className="pal-ps1-host">blog</span>:
    <span className="pal-ps1-path">~</span>
    <span className="pal-ps1-dollar">$</span>
  </span>
);

const career = [
  {
    org: 'FPT Software',
    role: 'Intern Web Developer',
    period: 'Aug 2025 – Jan 2026',
    details: [
      'Developed and maintained a web-based healthcare system to manage patient records, appointments, and medical reports for a Japan-based client.',
      'Supported the development of web features using Angular, Spring, and SQL Server.',
      'Participated in Agile methodologies processes to improve team efficiency and project delivery.',
    ],
  },
  {
    org: 'University of Transport and Communications',
    role: 'Undergraduate Student at UTC',
    period: 'Sep 2022 – Present',
    details: ['Undergraduate student.'],
  },
];

const techStack = [
  'Astro v5 + Node adapter — static posts & SSR endpoints',
  'TypeScript + MDX content collection',
  'Tailwind CSS + CSS custom properties for theming',
  'Umami website analytics',
  'Giscus comments',
  'Dark mode inspired by Tokyonight Neovim Theme',
];

type HelpCmd = readonly [cmd: string, usage: string];

const HELP_CMDS: HelpCmd[] = [
  ['help', 'show this manual'],
  ['blog list', 'list all posts (id + title)'],
  ['blog go <id>', 'open a post by its id'],
  ['projects list', 'list all projects'],
  ['projects go <id>', 'open a project by its id'],
  ['about', 'about the author'],
  ['theme <dark | light | system>', 'switch color scheme'],
  ['clear', 'clear the terminal'],
  ['exit', 'close the terminal'],
];

export default function CommandPalette({
  blogPosts,
  projects,
}: PaletteProps): React.JSX.Element | null {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [entries, setEntries] = useState<PaletteEntry[]>([]);
  const [historyPos, setHistoryPos] = useState(-1);
  const [sel, setSel] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const outRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const restoreRef = useRef<HTMLElement | null>(null);
  const historyRef = useRef<string[]>([]);
  const greetedRef = useRef(false);
  const suggestionsRef = useRef<Sugg[]>([]);

  openRef.current = open;

  const push = useCallback((entry: PaletteEntry) => {
    setEntries((prev) => [...prev, entry]);
  }, []);

  const openShortcut = useCallback(() => {
    const ae = document.activeElement;
    restoreRef.current = ae instanceof HTMLElement && ae !== document.body ? ae : null;
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setInput('');
    setSel(-1);
    const el = restoreRef.current;
    restoreRef.current = null;
    if (el && el.isConnected) el.focus();
  }, []);

  const openFromFooter = useCallback((footer: HTMLElement) => {
    footer.setAttribute('tabindex', '-1');
    restoreRef.current = footer;
    footer.focus();
    setOpen(true);
  }, []);

  const welcomeNode = (
    <div className="pal-welcome">
      <p>Welcome to dawn's blog.</p>
      <p>
        Type <code>help</code> for the manual — or just start typing (e.g.{' '}
        <code>angular</code>) to search posts, pages, and projects.
      </p>
    </div>
  );

  const aboutNode = (
    <div className="pal-about">
      <p className="pal-about-greet">
        Hello, folks! I'm <span className="pal-hl">Tung Anh</span>
      </p>
      <p>Tung Anh Ngo · Learner | Builder · Student · Ha Noi, Vietnam</p>
      <p>
        I have a passion for <strong>Java</strong>, <strong>TypeScript</strong>, and web
        development. I'm currently <strong>starting my journey</strong> as a{' '}
        <span className="pal-hl-alt">software engineer</span>. I mainly work with{' '}
        <strong>Angular</strong> and <strong>Spring</strong>.
      </p>
      <p>
        I created this blog to share insights, best practices, and lessons learned throughout my
        journey as a software engineering.
      </p>
      <p>
        I believe that writing is one of the best ways to learn, and I hope what you find something
        here that helps you on your own journey as a developer.
      </p>
      <p>I'd love to hear your thoughts and feedback on my posts.</p>

      <p className="pal-about-h">Career</p>
      {career.map((c) => (
        <div key={c.org} className="pal-about-block">
          <p className="pal-about-title">
            {c.org} — {c.role}
          </p>
          <p className="pal-about-meta">{c.period}</p>
          <ul className="pal-list">
            {c.details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      ))}

      <p className="pal-about-h">Tech stack</p>
      <p>
        This blog is built with <strong>Astro</strong> (SSR on Node), <strong>TypeScript</strong>,
        and <strong>Tailwind CSS</strong>, styled as an <em>editor-shell</em>.
      </p>
      <ul className="pal-list">
        {techStack.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <p>
        First launched with the Tailwind Nextjs Starter Blog template; since migrated to Astro. The
        layout takes inspiration from karhdo.dev and leohuynh.dev. I appreciate Khanh Do, Leo Huynh,
        and Timothy Lin for their contributions to this minimal, lightweight, and highly
        customizable blog starter.
      </p>
      <p>
        Check out the{' '}
        <a
          className="pal-link"
          href="https://github.com/DawnBreaker207/dawn"
          target="_blank"
          rel="noopener noreferrer"
        >
          repository
        </a>{' '}
        for this blog.
      </p>
      {/* resume disabled until static/resume.pdf is back
      <p>
        <a
          className="pal-link"
          href="/static/resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
        >
          View resume
        </a>
      </p>
      */}
      <p>
        <a className="pal-link" href="/about">
          → About (full version)
        </a>
      </p>
    </div>
  );

  const listOrGo = (kind: 'blog' | 'projects', items: PaletteItem[], args: string[]): void => {
    if (args.length === 0) {
      push({
        kind: 'jsx',
        node: (
          <div>
            <ol className="pal-vhist">
              {items.map((it, i) => (
                <li key={it.route}>
                  <span className="pal-item-title">{it.title}</span>
                  {it.desc && <span className="pal-item-desc">{it.desc}</span>}
                </li>
              ))}
            </ol>
            <p className="pal-usage">
              Usage: {kind} go &lt;id&gt;
            </p>
          </div>
        ),
      });
      return;
    }
    const [verb, idRaw] = args;
    const id = Number(idRaw);
    const idx = args.length === 2 && verb === 'go' && Number.isInteger(id) ? id - 1 : -1;
    const item = idx >= 0 && idx < items.length ? items[idx] : undefined;
    if (item) {
      window.location.assign(item.route);
    } else {
      push({
        kind: 'txt',
        text: `Usage: ${kind} go <id>, where <id> is one of: ${items.map((_, i) => i + 1).join(', ')}`,
      });
    }
  };

  const commands: Record<string, { desc: string; run: (args: string[]) => void }> = {
    about: {
      desc: 'view the about page',
      run: () => push({ kind: 'jsx', node: aboutNode }),
    },
    blog: {
      desc: 'list posts, use "blog go <id>" to open one',
      run: (args) => listOrGo('blog', blogPosts, args),
    },
    projects: {
      desc: 'list projects, use "projects go <id>" to open one',
      run: (args) => listOrGo('projects', projects, args),
    },
    clear: { desc: 'clear the output', run: () => {} },
    exit: {
      desc: 'close this terminal',
      run: () => close(),
    },
    theme: {
      desc: 'set the theme: theme <dark | light | system>',
      run: (args) => {
        const t = (args[0] || '').toLowerCase();
        if (t !== 'dark' && t !== 'light' && t !== 'system') {
          push({
            kind: 'txt',
            text: 'Usage: theme <dark | light | system>',
          });
          return;
        }
        localStorage.setItem('theme', t);
        const resolved =
          t === 'dark' ||
          (t !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        document.documentElement.classList.toggle('dark', resolved);
        document
          .querySelectorAll<HTMLElement>('[data-theme-sun]')
          .forEach((el) => el.classList.toggle('hidden', resolved));
        document
          .querySelectorAll<HTMLElement>('[data-theme-moon]')
          .forEach((el) => el.classList.toggle('hidden', !resolved));
        const giscus = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame');
        giscus?.contentWindow?.postMessage(
          { giscus: { setConfig: { theme: resolved ? 'transparent_dark' : 'light' } } },
          'https://giscus.app'
        );
        push({ kind: 'txt', text: `Theme set to ${t}${resolved ? ' (dark)' : ' (light)'}.` });
      },
    },
    help: {
      desc: 'show this manual',
      run: () =>
        push({
          kind: 'jsx',
          node: (
            <div className="pal-help">
              <p>
                Hi! This is <code>dawn</code>'s blog shell. Two ways to use it — type a{' '}
                <strong>command</strong> below, or just start typing to{' '}
                <strong>search</strong> the site (pages, posts, projects). Suggestions pop up as
                you type: <kbd>Tab</kbd> accepts the highlighted one, <kbd>↑</kbd>/
                <kbd>↓</kbd> move through the list, <kbd>Enter</kbd> runs the command or opens the
                highlighted result.
              </p>
              <p className="pal-h">Commands</p>
              <ul className="pal-list">
                {HELP_CMDS.map(([cmd, usage]) => (
                  <li key={cmd}>
                    <span className="pal-help-cmd">{cmd}</span>
                    <span>{usage}</span>
                  </li>
                ))}
              </ul>
              <p className="pal-h">Shortcuts</p>
              <ul className="pal-list">
                <li>
                  <kbd>Ctrl/⌘ K</kbd> open · <kbd>Esc</kbd> close this terminal
                </li>
                <li>
                  <kbd>/</kbd> open the terminal to search
                </li>
                <li>
                  <kbd>t</kbd> toggle light / dark theme
                </li>
                <li>
                  <kbd>g</kbd> then <kbd>h</kbd>/<kbd>b</kbd>/<kbd>p</kbd> → home / blog /
                  projects
                </li>
              </ul>
              <p className="pal-h">Examples</p>
              <ul className="pal-list">
                <li>
                  <code>blog go 3</code> → open the 3rd post
                </li>
                <li>
                  <code>theme dark</code> → switch to dark mode
                </li>
                <li>
                  type <code>angular</code> → search results instead of commands
                </li>
              </ul>
            </div>
          ),
        }),
    },
  };

  const arrays: Record<string, PaletteItem[]> = { blog: blogPosts, projects };
  const pages: PaletteItem[] = [
    { title: 'Home', desc: 'home page', route: '/' },
    { title: 'Blog index', desc: 'all posts', route: '/blog' },
    { title: 'Projects', desc: 'projects page', route: '/projects' },
    { title: 'Lab', desc: 'experiments index', route: '/lab' },
    { title: 'Lab · Terminal', desc: 'terminal playground', route: '/lab/terminal' },
    { title: 'About', desc: 'about page', route: '/about' },
    { title: 'Books', desc: 'books list', route: '/books' },
    { title: 'Heatmap', desc: 'activity heatmap', route: '/heatmap' },
    { title: 'Topics', desc: 'topic index', route: '/topics' },
    { title: 'Help', desc: 'site manual', route: '/help' },
  ];
  const searchPool = [...pages, ...blogPosts, ...projects];
  const suggestFor = (raw: string): Sugg[] => {
    const input0 = raw.trim();
    if (!input0) return [];
    const words = input0.split(/\s+/);
    const last = words[words.length - 1];
    if (words.length === 1) {
      const cmds = Object.keys(commands);
      const hits = cmds
        .filter((n) => n.startsWith(last) && n !== last)
        .map((n) => ({ text: n, desc: commands[n].desc, type: 'cmd' as const }));
      if (hits.length) return hits;
      if (cmds.includes(last)) return [];
      const q = last.toLowerCase();
      return searchPool
        .filter((p) => `${p.title} ${p.desc ?? ''}`.toLowerCase().includes(q))
        .slice(0, 6)
        .map((p) => ({ text: p.title, desc: p.route, type: 'go' as const, route: p.route }));
    }
    const cmd = words[0];
    if (cmd === 'theme' && words.length === 2) {
      return ['dark', 'light', 'system']
        .filter((t) => t.startsWith(last) && t !== last)
        .map((t) => ({ text: t, desc: `theme: ${t} scheme`, type: 'arg' as const }));
    }
    if (cmd === 'blog' || cmd === 'projects') {
      if (words.length === 2) {
        const pool = [
          { text: 'list', desc: `list ${cmd} (ids + titles)`, type: 'arg' as const },
          { text: 'go', desc: `open ${cmd} by <id>`, type: 'arg' as const },
        ];
        return pool.filter((p) => p.text.startsWith(last) && p.text !== last);
      }
      if (words.length === 3 && words[1] === 'go') {
        return (arrays[cmd] ?? [])
          .map((it, i) => ({ text: String(i + 1), desc: `#${i + 1} — ${it.title}`, type: 'id' as const }))
          .filter((s) => s.text.startsWith(last) && s.text !== last)
          .slice(0, 10);
      }
    }
    return [];
  };

  const acceptSugg = (item: Sugg): void => {
    if (item.route) {
      close();
      location.assign(item.route);
      return;
    }
    const trimmed = input.trimEnd();
    const idx = trimmed.lastIndexOf(' ');
    const next = idx === -1 ? item.text : trimmed.slice(0, idx + 1) + item.text;
    setInput(item.type === 'id' ? next : next + ' ');
    setSel(-1);
    inputRef.current?.focus();
  };

  const execute = (): void => {
    const cmd = input.trim();
    if (!cmd) return;
    const tokens = cmd.split(/\s+/);
    const key = tokens[0].toLowerCase();
    const args = tokens.slice(1);
    const h = historyRef.current;
    if (h[h.length - 1] !== key) h.push(key);
    setHistoryPos(-1);
    setInput('');
    setEntries((prev) => [...prev, { kind: 'cmd', text: cmd }]);
    if (key === 'clear') {
      setEntries([]);
      return;
    }
    const c = commands[key];
    if (c) c.run(args);
    else setEntries((prev) => [...prev, { kind: 'err', text: `command not found: ${cmd}` }]);
  };

  const goHistory = (dir: 1 | -1): void => {
    const h = historyRef.current;
    if (!h.length) return;
    let pos = historyPos;
    if (dir === -1) {
      pos = pos === -1 ? h.length - 1 : Math.max(0, pos - 1);
    } else {
      if (pos === -1) return;
      pos += 1;
      if (pos >= h.length) pos = -1;
    }
    setHistoryPos(pos);
    setInput(pos === -1 ? '' : h[pos]);
    requestAnimationFrame(() =>
      inputRef.current?.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length)
    );
  };

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    const k = e.key.toLowerCase();
    if (e.key === 'Tab' || ((e.ctrlKey || e.metaKey) && k === 'i')) {
      e.preventDefault();
      const its = suggestionsRef.current;
      if (!its.length) return;
      const idx = sel === -1 || sel >= its.length ? 0 : sel;
      acceptSugg(its[idx]);
      setSel(its.length > 1 ? (idx + 1) % its.length : -1);
      return;
    }
    if (e.ctrlKey && k === 'l') {
      e.preventDefault();
      setInput('');
      setHistoryPos(-1);
      setEntries([]);
      return;
    }
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (suggestionsRef.current.length) {
          setSel((s) => (s <= 0 ? suggestionsRef.current.length - 1 : s - 1));
        } else {
          goHistory(-1);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (suggestionsRef.current.length) {
          setSel((s) => (s === suggestionsRef.current.length - 1 ? 0 : s + 1));
        } else {
          goHistory(1);
        }
        break;
      case 'Enter':
        e.preventDefault();
        {
          const its = suggestionsRef.current;
          const goItem = its.length
            ? its[sel === -1 || sel >= its.length ? 0 : sel]
            : null;
          if (goItem?.route) {
            close();
            location.assign(goItem.route);
            return;
          }
          execute();
        }
        break;
    }
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setHistoryPos(-1);
    setSel(-1);
    setInput(e.target.value);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (e.repeat) return;
        e.preventDefault();
        if (openRef.current) close();
        else openShortcut();
        return;
      }
      if (e.key !== 'Escape' && e.key !== 'Tab') return;
      if (!openRef.current) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      const panelEl = panelRef.current as HTMLDivElement;
      if (!panelEl) return;
      const focusables = Array.from(
        panelEl.querySelectorAll<HTMLElement>('a[href], input, button, [tabindex]:not([tabindex="-1"])')
      ).filter((el) => el === panelEl || el.offsetParent !== null);
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = panelEl.contains(active);
      if (!inside) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    const onFooterClick = (e: MouseEvent): void => {
      if (openRef.current) return;
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest('[data-open-terminal]')) {
        openFromFooter(document.body as HTMLElement);
        return;
      }
      if (t.closest('a, button')) return;
      const foot = t.closest('footer.studio-statusbar');
      if (foot instanceof HTMLElement) openFromFooter(foot);
    };

    const onOpenSearch = (): void => openShortcut();

    // astro:page-load: rebind after every (future view-transition) navigation.
    const install = (): void => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onFooterClick);
      document.removeEventListener('dawn:open-search', onOpenSearch);
      document.addEventListener('keydown', onKey);
      document.addEventListener('click', onFooterClick);
      document.addEventListener('dawn:open-search', onOpenSearch);
    };

    install();
    document.addEventListener('astro:page-load', install);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onFooterClick);
      document.removeEventListener('dawn:open-search', onOpenSearch);
      document.removeEventListener('astro:page-load', install);
    };
  }, [close, openShortcut, openFromFooter]);

  useEffect(() => {
    const shell = document.getElementById('studio-shell');
    if (!shell) return;
    if (open) shell.setAttribute('inert', '');
    else shell.removeAttribute('inert');
    return () => shell.removeAttribute('inert');
  }, [open]);

  useEffect(() => {
    if (!open || greetedRef.current) return;
    greetedRef.current = true;
    setEntries([{ kind: 'jsx', node: welcomeNode }]);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const out = outRef.current;
    if (out) out.scrollTop = out.scrollHeight;
  }, [entries]);

  if (!open) return null;

  const suggestions = suggestFor(input);
  suggestionsRef.current = suggestions;

  const selIdx = sel === -1 || sel >= suggestions.length ? 0 : sel;
  const currentWord =
    input && !/\s$/.test(input) ? input.trim().split(/\s+/).pop()! : '';
  const ghost = suggestions[selIdx] && suggestions[selIdx].type !== 'go'
    ? suggestions[selIdx].text.slice(currentWord.length)
    : '';

  const entryLine = (e: PaletteEntry, i: number): React.JSX.Element => {
    if (e.kind === 'cmd') {
      return (
        <div className="pal-line" key={i}>
          <ShellPrompt />
          <span>{e.text}</span>
        </div>
      );
    }
    if (e.kind === 'err') {
      return (
        <div className="pal-out pal-out--err" key={i}>
          {e.text}
        </div>
      );
    }
    if (e.kind === 'jsx') {
      return (
        <div className="pal-out" key={i}>
          {e.node}
        </div>
      );
    }
    return (
      <div className="pal-out" key={i}>
        {e.text}
      </div>
    );
  };

  return (
    <>
      <div className="pal-backdrop" aria-hidden="true" onClick={close}></div>
      <div
        className="pal-window"
        role="dialog"
        aria-modal="true"
        aria-label="Terminal command"
        ref={panelRef}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="pal-output" role="log" aria-live="polite" ref={outRef} tabIndex={-1}>
          {entries.map((e, i) => entryLine(e, i))}
        </div>
        {suggestions.length > 0 && (
          <div className="pal-autoc" role="listbox" aria-label="Command suggestions">
            {suggestions.map((s, i) => (
              <button
                key={s.text}
                type="button"
                role="option"
                aria-selected={i === selIdx}
                className={`pal-autoc-row${i === selIdx ? ' pal-autoc-row--sel' : ''}`}
                onMouseOver={() => setSel(i)}
                onClick={() => acceptSugg(s)}
              >
                <span className="pal-autoc-id">
                  <span className="pal-autoc-type" aria-hidden="true">
                    {s.type}
                  </span>
                  <span className="pal-autoc-cmd">{s.text}</span>
                </span>
                <span className="pal-autoc-desc">{s.desc}</span>
              </button>
            ))}
          </div>
        )}
        <div className="pal-input-row">
          <ShellPrompt />
          <div className="pal-input-wrap">
            {ghost && (
              <span className="pal-ghost" aria-hidden="true">
                {input}
                <span className="pal-ghost-rest">{ghost}</span>
              </span>
            )}
            <input
              ref={inputRef}
              className="pal-input"
              type="text"
              value={input}
              onChange={onInputChange}
              onKeyDown={onInputKeyDown}
              aria-label="Type a command"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}