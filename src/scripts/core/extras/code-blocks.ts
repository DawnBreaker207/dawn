// Code blocks: language badge, copy button and collapse toggle on <pre><code>.
// Loaded by extras.ts only on pages that contain a <pre>.

export function addCopyButtons(): void {
  for (const pre of document.querySelectorAll<HTMLPreElement>('pre')) {
    if (!pre.querySelector('code') || pre.querySelector('.copy-btn')) continue;

    const codeEl = pre.querySelector('code');
    const lang =
      pre.dataset.language ??
      codeEl?.getAttribute('data-language') ??
      codeEl?.className.match(/language-([\w#.+-]+)/)?.[1];

    if (lang) {
      const badge = document.createElement('span');
      badge.className = 'code-badge';
      badge.textContent = lang;
      pre.append(badge);
    }

    pre.classList.add('has-copy');

    // Copy Button
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'copy-btn';
    btn.setAttribute('aria-label', 'Copy code to clipboard');
    btn.setAttribute('data-track-event', 'code-copy');
    btn.title = 'Copy';
    btn.innerHTML =
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
      '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    pre.append(btn);

    btn.addEventListener('click', async () => {
      const text = pre.innerText.replace(/(?:Copy|Copied|Expand code.*|Collapse code)$/i, '').trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.append(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      btn.classList.add('is-copied');
      btn.innerHTML =
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">' +
        '<polyline points="20 6 9 17 4 12"/></svg>';
      btn.title = 'Copied!';
      setTimeout(() => {
        btn.classList.remove('is-copied');
        btn.innerHTML =
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
          '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
        btn.title = 'Copy';
      }, 1500);
    });

    // Collapsible Code Block for long code (> 28 lines)
    const lineCount = (codeEl?.textContent || '').split('\n').length;
    if (lineCount > 28) {
      pre.classList.add('code-collapsed');
      const collapseBtn = document.createElement('button');
      collapseBtn.type = 'button';
      collapseBtn.className = 'code-collapse-btn';
      collapseBtn.innerHTML = `<span>Expand code (${lineCount} lines)</span><span aria-hidden="true">↓</span>`;
      collapseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isCollapsed = pre.classList.toggle('code-collapsed');
        if (isCollapsed) {
          collapseBtn.innerHTML = `<span>Expand code (${lineCount} lines)</span><span aria-hidden="true">↓</span>`;
          pre.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
          collapseBtn.innerHTML = `<span>Collapse code</span><span aria-hidden="true">↑</span>`;
        }
      });
      pre.append(collapseBtn);
    }
  }
}
