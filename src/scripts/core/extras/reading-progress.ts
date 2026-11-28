// Reading progress bar for blog posts.
// Loaded by extras.ts on the first post page; afterwards it also handles cleanup on other pages.

/** Removes the listeners installed for the previous page (View Transitions keep `window` alive). */
let cleanup: null | (() => void) = null;

export function setupReadingProgress(): void {
  cleanup?.();
  cleanup = null;

  if (!document.querySelector('[data-post-page]')) {
    document.getElementById('reading-progress')?.remove();
    return;
  }

  const scroller = document.querySelector<HTMLElement>('.studio-content');
  if (!scroller) return;

  let bar = document.getElementById('reading-progress');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    scroller.prepend(bar);
  }

  let milestone50Fired = false;
  let milestone100Fired = false;

  let raf = 0;
  const update = (): void => {
    const scrollable =
      scroller.scrollHeight > scroller.clientHeight ? scroller : document.documentElement;
    const max = scrollable.scrollHeight - scrollable.clientHeight;
    const ratio = max > 0 ? scrollable.scrollTop / max : 0;
    bar!.style.transform = `scaleX(${Math.min(1, Math.max(0, ratio)).toFixed(4)})`;

    if (max > 200) {
      if (!milestone50Fired && ratio >= 0.5) {
        milestone50Fired = true;
        try {
          window.umami?.track('reading-milestone', { depth: '50%', path: window.location.pathname });
        } catch {}
      }
      if (!milestone100Fired && ratio >= 0.9) {
        milestone100Fired = true;
        try {
          window.umami?.track('reading-milestone', { depth: '100%', path: window.location.pathname });
        } catch {}
      }
    }
  };

  const onScroll = (): void => {
    if (raf) return;
    raf = window.requestAnimationFrame(() => {
      raf = 0;
      update();
    });
  };

  scroller.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  cleanup = () => {
    scroller.removeEventListener('scroll', onScroll);
    window.removeEventListener('scroll', onScroll);
    if (raf) window.cancelAnimationFrame(raf);
  };
  update();
}
