// Native DTS Simulation Runner
// Bridges Astro Studio Shell with Designed to Scale Engine

// Import DTS if available in context

function initDtsNative() {
  const container = document.getElementById('dts-native-workbench');
  if (!container) return;

  const lessonId = container.dataset.lesson || 'request-lifecycle';

  // Ensure hash is set to the lesson
  if (!window.location.hash || !window.location.hash.includes(lessonId)) {
    window.location.hash = `#/${lessonId}/1`;
  }

  // Theme synchronization
  function syncTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    if (typeof (window as any).__setTheme === 'function') {
      (window as any).__setTheme(isDark ? 'dark' : 'light');
    }
  }

  syncTheme();

  // Watch for theme class changes on <html>
  const observer = new MutationObserver(syncTheme);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });
}

// Run on load and page transitions
initDtsNative();
document.addEventListener('astro:page-load', initDtsNative);
