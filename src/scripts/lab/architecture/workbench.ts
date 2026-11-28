import { CHAPTER_KINDS } from '@/lib/simulator/chapter-kinds';
import { formatMetric } from '@/lib/simulator/metric-format';
import { CURRICULUM_MODULES } from '@/data/curriculum';

/** Latest metric-count animation per chip, so a newer step cancels an older one. */
const chipAnimations = new WeakMap<HTMLElement, object>();

function initSimWorkbench() {
  const root = document.getElementById('sim-body');
  if (!root) return;

  const lessonData = root.getAttribute('data-wb-lesson');
  if (!lessonData) return;
  const lesson = JSON.parse(lessonData);
  const steps = lesson.steps || [];
  const total = steps.length;
  let curIdx = 0;

  const rawNext = root.getAttribute('data-next-lesson');
  const nextLesson = rawNext ? JSON.parse(rawNext) : null;

  const elStepLabel = document.getElementById('guide-step-label');
  const elChapterBadge = document.getElementById('guide-chapter-badge');
  const elGuideTitle = document.getElementById('guide-title');
  const elGuideBody = document.getElementById('guide-body');
  const elGuideCallout = document.getElementById('guide-callout');
  const elGuideCalloutTitle = document.getElementById('guide-callout-title');
  const elGuideCalloutText = document.getElementById('guide-callout-text');
  const elGuideChanges = document.getElementById('guide-changes');
  const elGuideChangesList = document.getElementById('guide-changes-list');
  const elGuideNextLabel = document.getElementById('guide-next-label');
  const elBtnBack = document.getElementById('back') as HTMLButtonElement | null;
  const elBtnNext = document.getElementById('next') as HTMLButtonElement | null;
  const elTimeline = document.getElementById('timeline');
  const elTimelineCount = document.getElementById('tl-count');
  const elTimelineRailFill = document.getElementById('tl-fill');
  const elTimelineSteps = document.getElementById('timeline-steps');
  const elGoalsList = document.getElementById('goals-list');
  const elHud = document.getElementById('hud');

  function checkTimelineTightness() {
    if (!elTimelineSteps || !elTimeline) return;
    const stepWidth = elTimelineSteps.clientWidth / Math.max(1, elTimelineSteps.children.length);
    elTimeline.classList.toggle('is-tight', stepWidth > 0 && stepWidth < 70);
  }

  let isInitialized = false;
  let prevChapter = '';
  const prevMetrics: Record<string, unknown> = {};

  function renderStep(idx: number, force = false) {
    if (idx < 0 || idx >= total) return;
    if (!force && isInitialized && idx === curIdx) return;
    const prevIdx = curIdx;
    curIdx = idx;
    const s = steps[idx];
    if (!s) return;

    // Slide direction for Guide transition (+1 for next, -1 for back, 0 for initial)
    const dir = !isInitialized ? 0 : Math.sign(idx - prevIdx);

    // Clone ghost for sliding out previous guide content
    const guideEl = document.getElementById('guide');
    const contentEl = document.getElementById('guide-content');
    let ghost: HTMLElement | null = null;
    let ghostBounds: { top: number; left: number; width: number; height: number; scroll: number } | null = null;
    if (isInitialized && dir !== 0 && guideEl && contentEl) {
      ghost = contentEl.cloneNode(true) as HTMLElement;
      ghostBounds = {
        top: contentEl.offsetTop,
        left: contentEl.offsetLeft,
        width: contentEl.offsetWidth,
        height: contentEl.offsetHeight,
        scroll: contentEl.scrollTop,
      };
      guideEl.querySelectorAll('.guide__ghost').forEach((e) => e.remove());
    }

    isInitialized = true;

    // Notify SceneRenderer and 2D Deep-Dive Visualizers
    const stepEvtDetail = { idx, step: s, index: idx };
    root?.dispatchEvent(new CustomEvent('wb:step-change', { detail: stepEvtDetail, bubbles: true }));
    window.dispatchEvent(new CustomEvent('wb:step-change', { detail: stepEvtDetail }));
    document.dispatchEvent(new CustomEvent('wb:step-change', { detail: stepEvtDetail }));

    if (isInitialized) {
      window.umami?.track('workbench-step-change', { lesson: lesson.id, step: idx + 1 });
    }

    // Guide meta
    if (elStepLabel) elStepLabel.textContent = `Step ${idx + 1} / ${total}`;
    // Chapter ids are authored in the scene data; an unknown id falls back to a plain badge.
    const knownChapter = s.chapter ? CHAPTER_KINDS[s.chapter as keyof typeof CHAPTER_KINDS] : undefined;
    const chp = knownChapter ?? { label: s.chapter ? s.chapter.toUpperCase() : 'STEP', tone: 'sand' };
    if (elChapterBadge) {
      elChapterBadge.textContent = chp.label;
      elChapterBadge.className = `chapter chapter--${chp.tone}`;
      if (dir !== 0 && prevChapter !== s.chapter) {
        elChapterBadge.style.setProperty('--slide', `${dir * 14}px`);
        elChapterBadge.classList.remove('is-in');
        void elChapterBadge.offsetWidth;
        elChapterBadge.classList.add('is-in');
      }
    }
    prevChapter = s.chapter || '';

    // Guide Title & Body
    if (elGuideTitle) elGuideTitle.textContent = s.title;
    if (elGuideBody) {
      elGuideBody.innerHTML = (s.body || []).map((p: string) => `<p>${p}</p>`).join('');
    }

    // Callout
    if (elGuideCallout) {
      if (s.callout) {
        elGuideCallout.style.display = 'flex';
        elGuideCallout.className = `callout callout--${s.callout.kind || 'insight'}`;
        if (elGuideCalloutTitle) elGuideCalloutTitle.textContent = s.callout.title || 'Key idea';
        if (elGuideCalloutText) elGuideCalloutText.innerHTML = s.callout.text || '';
      } else {
        elGuideCallout.style.display = 'none';
      }
    }

    // Changes ("What changed")
    if (elGuideChanges && elGuideChangesList) {
      if (s.changes && s.changes.length > 0) {
        elGuideChanges.style.display = 'block';
        elGuideChangesList.innerHTML = s.changes.map((chg: string) => {
          const t = chg.startsWith('+') ? 'add' : chg.startsWith('−') || chg.startsWith('-') ? 'del' : 'mod';
          const sym = { add: '+', del: '−', mod: '~' }[t];
          return `<li class="chg chg--${t}"><b>${sym}</b><span>${chg.slice(2)}</span></li>`;
        }).join('');
      } else {
        elGuideChanges.style.display = 'none';
        elGuideChangesList.innerHTML = '';
      }
    }

    // Slide In animation on new guide content
    if (contentEl) {
      contentEl.style.setProperty('--slide', `${dir * 36}px`);
      contentEl.classList.remove('is-in');
      void contentEl.offsetWidth;
      contentEl.classList.add('is-in');
    }

    // Append and remove sliding ghost
    if (ghost && ghostBounds && guideEl) {
      ghost.className = 'guide__content guide__ghost';
      ghost.style.cssText = `top:${ghostBounds.top}px;left:${ghostBounds.left}px;width:${ghostBounds.width}px;height:${ghostBounds.height}px;--slide:${-dir * 36}px;position:absolute;`;
      guideEl.appendChild(ghost);
      ghost.scrollTop = ghostBounds.scroll;
      setTimeout(() => ghost?.remove(), 200);
    }

    // Nav buttons
    if (elBtnBack) elBtnBack.disabled = idx === 0;
    if (elBtnNext) {
      const isLastStep = idx === total - 1;
      if (!isLastStep) {
        elBtnNext.disabled = false;
        elBtnNext.title = '';
        if (elGuideNextLabel) {
          elGuideNextLabel.textContent = `Next: ${steps[idx + 1]?.short || ''}`;
        }
      } else {
        if (nextLesson && nextLesson.href) {
          elBtnNext.disabled = false;
          elBtnNext.title = `Next lesson: ${nextLesson.title}`;
          if (elGuideNextLabel) {
            const displayTitle = nextLesson.title.length <= 18 ? nextLesson.title : `${nextLesson.title.slice(0, 16)}…`;
            elGuideNextLabel.textContent = `Next: ${displayTitle}`;
          }
        } else {
          elBtnNext.disabled = true;
          elBtnNext.title = 'You have completed all lessons in this track';
          if (elGuideNextLabel) {
            elGuideNextLabel.textContent = 'Finish Track ✓';
          }
        }
      }
    }

    // Timeline
    if (elTimelineCount) elTimelineCount.textContent = `Step ${idx + 1} of ${total}`;
    if (elTimelineRailFill) {
      const pct = total > 1 ? (idx / (total - 1)) * 100 : 0;
      elTimelineRailFill.style.width = `${pct}%`;
    }
    if (elTimelineSteps) {
      const lis = elTimelineSteps.querySelectorAll('li');
      lis.forEach((li, i) => {
        li.classList.toggle('is-done', i < idx);
        li.classList.toggle('is-current', i === idx);
      });
    }
    checkTimelineTightness();

    // Goals
    if (elGoalsList) {
      const lis = elGoalsList.querySelectorAll('li');
      lis.forEach((li) => {
        const goalStep = parseInt(li.getAttribute('data-goal-step') || '99', 10);
        const isHit = goalStep <= idx + 1;
        li.classList.toggle('is-hit', isHit);
        const chk = li.querySelector('.check');
        if (chk) chk.classList.toggle('is-on', isHit);
      });
    }

    // HUD Metrics with count-up animation & chip-flash
    if (elHud) {
      // A step that leaves a metric out keeps the last value an earlier step set
      // (an explicit `null` still clears it), so jumping around never blanks the HUD.
      const metrics: Record<string, unknown> = {};
      for (let i = 0; i <= idx; i++) Object.assign(metrics, steps[i]?.metrics || {});
      const allKeys = Array.from(new Set([
        ...(lesson.metrics || []),
        ...Object.keys(metrics),
      ]));

      allKeys.forEach((k) => {
        const valEl = elHud.querySelector(`[data-val="${k}"]`) as HTMLElement | null;
        const chipEl = elHud.querySelector(`[data-k="${k}"]`) as HTMLElement | null;
        if (!valEl || !chipEl) return;

        const oldVal = prevMetrics[k];
        const newVal = metrics[k];
        prevMetrics[k] = newVal;

        const changed = oldVal !== undefined && oldVal !== newVal;
        if (changed && dir !== 0) {
          chipEl.classList.remove('is-changed');
          void chipEl.offsetWidth;
          chipEl.classList.add('is-changed');
        }

        const isTween = dir !== 0 && typeof oldVal === 'number' && typeof newVal === 'number' && oldVal !== newVal;

        if (!isTween) {
          if (changed && dir !== 0) {
            valEl.classList.remove('is-swap');
            void valEl.offsetWidth;
            valEl.classList.add('is-swap');
          }
          valEl.textContent = formatMetric(k, newVal);
          chipEl.setAttribute('data-level', newVal == null || newVal === '—' ? 'none' : 'good');
        } else {
          const startW = chipEl.offsetWidth;
          valEl.textContent = formatMetric(k, newVal);
          const endW = chipEl.offsetWidth;
          valEl.textContent = formatMetric(k, oldVal);
          chipEl.style.width = `${startW}px`;

          const startTime = performance.now();
          const duration = 900;
          const animId = {};
          chipAnimations.set(chipEl, animId);

          const stepAnim = (now: number) => {
            if (chipAnimations.get(chipEl) !== animId) return;
            const p = Math.min(1, (now - startTime) / duration);
            const ease = 1 - (1 - p) ** 3;
            const raw = Number(oldVal) + (Number(newVal) - Number(oldVal)) * ease;
            // Count up in whole steps, or in hundredths when the values are fractional.
            const currentVal = Number.isInteger(oldVal) && Number.isInteger(newVal) ? Math.round(raw) : Math.round(raw * 100) / 100;
            valEl.textContent = formatMetric(k, currentVal);
            chipEl.style.width = `${startW + (endW - startW) * ease}px`;
            if (p < 1) {
              requestAnimationFrame(stepAnim);
            } else {
              chipEl.style.width = '';
              valEl.textContent = formatMetric(k, newVal);
              chipEl.setAttribute('data-level', 'good');
            }
          };
          requestAnimationFrame(stepAnim);
        }
      });
    }
  }

  // Button event handlers
  elBtnBack?.addEventListener('click', () => {
    window.umami?.track('workbench-nav', {
      lesson: lesson.id,
      dir: 'prev',
      fromStep: curIdx + 1,
      toStep: curIdx,
    });
    renderStep(curIdx - 1);
  });

  elBtnNext?.addEventListener('click', () => {
    if (curIdx === total - 1 && nextLesson?.href) {
      window.umami?.track('workbench-lesson-complete', { lesson: lesson.id, next: nextLesson.title });
      window.location.href = nextLesson.href;
      return;
    }
    window.umami?.track('workbench-nav', {
      lesson: lesson.id,
      dir: 'next',
      fromStep: curIdx + 1,
      toStep: curIdx + 2,
    });
    renderStep(curIdx + 1);
  });

  // Random lab sandbox jump
  const elRandomLab = document.getElementById('wb-random-lab');
  elRandomLab?.addEventListener('click', () => {
    try {
      // Every other lesson, taken from the curriculum bundle instead of a per-page data attribute.
      const urls = CURRICULUM_MODULES.flatMap((m) => m.lessons.map((l) => `/lab/${l.id}`)).filter((h) => h !== `/lab/${lesson.id}`);
      if (urls.length > 0) {
        const pick = urls[Math.floor(Math.random() * urls.length)];
        window.location.assign(pick);
      }
    } catch {
      window.location.assign('/lab');
    }
  });

  // Timeline clicks
  elTimeline?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('[data-step]') as HTMLElement | null;
    if (btn) {
      const step = parseInt(btn.getAttribute('data-step') || '0', 10);
      window.umami?.track('workbench-step-select', {
        lesson: lesson.id,
        step: step + 1,
        total,
      });
      renderStep(step);
    }
  });

  // Goal item click to jump directly to step
  elGoalsList?.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li[data-goal-step]');
    if (li) {
      const goalStep = parseInt(li.getAttribute('data-goal-step') || '1', 10);
      window.umami?.track('workbench-goal-jump', {
        lesson: lesson.id,
        goalStep,
        text: (li.textContent || '').trim().slice(0, 60),
      });
      renderStep(goalStep - 1);
    }
  });

  // Metric HUD chip click
  elHud?.addEventListener('click', (e) => {
    const chip = (e.target as HTMLElement).closest('.chip[data-k]') as HTMLElement | null;
    if (chip) {
      const k = chip.dataset.k || '';
      const val = chip.querySelector('.chip__value')?.textContent?.trim() || '';
      window.umami?.track('workbench-metric-click', {
        lesson: lesson.id,
        metric: k,
        value: val,
      });
    }
  });

  // Stage Tools click tracking
  document.getElementById('expand')?.addEventListener('click', () => {
    window.umami?.track('workbench-fullscreen', { lesson: lesson.id });
  });
  document.getElementById('replay')?.addEventListener('click', () => {
    window.umami?.track('workbench-replay', { lesson: lesson.id, step: curIdx + 1 });
  });
  document.getElementById('fit')?.addEventListener('click', () => {
    window.umami?.track('workbench-fit', { lesson: lesson.id });
  });
  document.getElementById('pause')?.addEventListener('click', () => {
    window.umami?.track('workbench-pause', { lesson: lesson.id, step: curIdx + 1 });
  });

  // Window event listeners with cleanup
  if (window.__sim_wb_controller) {
    window.__sim_wb_controller.abort();
  }
  const controller = new AbortController();
  window.__sim_wb_controller = controller;

  // Recalculate timeline tightness on window resize
  window.addEventListener('resize', () => {
    checkTimelineTightness();
  }, { signal: controller.signal });

  // Custom external event wb:navigate
  const onNavigate = (e: Event) => {
    const detail = (e as CustomEvent).detail;
    const step = detail?.idx ?? detail?.step ?? 0;
    renderStep(step);
  };
  root.addEventListener('wb:navigate', onNavigate, { signal: controller.signal });
  window.addEventListener('wb:navigate', onNavigate, { signal: controller.signal });

  // Keyboard shortcuts: ArrowLeft / ArrowRight / R (replay) / Space (pause) / 0 (fit)
  window.addEventListener('keydown', (e) => {
    if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowRight') {
      if (curIdx === total - 1 && nextLesson?.href) {
        window.umami?.track('workbench-lesson-complete', { lesson: lesson.id, next: nextLesson.title });
        window.location.href = nextLesson.href;
        return;
      }
      window.umami?.track('workbench-step-change', { lesson: lesson.id, step: curIdx + 2, trigger: 'key' });
      renderStep(curIdx + 1);
    }
    if (e.key === 'ArrowLeft') {
      window.umami?.track('workbench-step-change', { lesson: lesson.id, step: curIdx, trigger: 'key' });
      renderStep(curIdx - 1);
    }
    if (e.key === 'r' || e.key === 'R') {
      document.getElementById('replay')?.click();
    }
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      document.getElementById('pause')?.click();
    }
    if (e.key === 's' || e.key === 'S') {
      document.getElementById('speed')?.click();
    }
    if (e.key === '0') {
      document.getElementById('fit')?.click();
    }
    if (e.key === 'f' || e.key === 'F') {
      const simView = document.getElementById('sim-view');
      if (simView) {
        if (!document.fullscreenElement) {
          simView.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    }
  }, { signal: controller.signal });

  // Initialize Step 0
  renderStep(0);
}

document.addEventListener('astro:page-load', initSimWorkbench);
