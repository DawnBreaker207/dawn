// ==========================================================================
// DAWN STUDIO — DTS IFRAME BRIDGE & THEME SYNCHRONIZATION
// ==========================================================================

(function initDTSBridge() {
  const urlParams = new URLSearchParams(window.location.search);
  const isEmbedded = window.self !== window.top || urlParams.get('embed') === '1';

  if (isEmbedded) {
    document.documentElement.classList.add('is-embedded');
  }

  // Pre-render theme initialization to prevent flash
  const initialTheme =
    urlParams.get('theme') ||
    (window.parent && window.parent.document && window.parent.document.documentElement.classList.contains('dark')
      ? 'dark'
      : null);

  if (initialTheme) {
    document.documentElement.dataset.theme = initialTheme;
    if (initialTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }

  // Bi-directional parent-child theme synchronization
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SET_THEME') {
      const theme = event.data.theme === 'dark' ? 'dark' : 'light';
      if (typeof window.__setTheme === 'function') {
        window.__setTheme(theme);
      } else {
        document.documentElement.dataset.theme = theme;
        document.documentElement.classList.toggle('dark', theme === 'dark');
      }
    }
  });
})();
