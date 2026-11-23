import { useEffect, useRef } from 'react';
import type { Lesson } from '@/lib/simulator/types';
import { StageEngine } from '@/lib/simulator/stage-engine';

interface Props {
  lesson: Lesson;
}

export default function SceneRenderer({ lesson }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<StageEngine | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Clean previous children if any
    el.innerHTML = '';

    let engine: StageEngine | null = null;
    try {
      engine = new StageEngine(el);
      engineRef.current = engine;
      (window as any).__ap_native = engine;

      const scenes = lesson.steps?.map((s) => s.scene) ?? [];
      if (scenes.length > 0) {
        engine.frame(scenes);
        engine.goTo(scenes[0], { instant: true });
      }
    } catch (err) {
      console.error('[SceneRenderer] Failed to initialize StageEngine:', err);
    }

    // Step change listener
    const root = el.closest<HTMLElement>('.body') ?? document;
    let currentIdx = 0;

    // Tools
    const fitBtn = document.getElementById('fit') as HTMLElement | null;
    const replayBtn = document.getElementById('replay') as HTMLElement | null;
    const pauseBtn = document.getElementById('pause') as HTMLElement | null;

    const updatePauseUI = (isPaused: boolean) => {
      if (!pauseBtn) return;
      pauseBtn.classList.toggle('is-paused', isPaused);
      pauseBtn.setAttribute('title', isPaused ? 'Resume traffic (Space)' : 'Pause traffic (Space)');
      const pauseIcon = pauseBtn.querySelector<SVGElement>('.icon-pause');
      const playIcon = pauseBtn.querySelector<SVGElement>('.icon-play');
      const pauseLabel = pauseBtn.querySelector<HTMLElement>('.label-pause');
      const playLabel = pauseBtn.querySelector<HTMLElement>('.label-play');

      if (pauseIcon && playIcon && pauseLabel && playLabel) {
        if (isPaused) {
          pauseIcon.classList.add('hidden');
          playIcon.classList.remove('hidden');
          pauseLabel.classList.add('hidden');
          playLabel.classList.remove('hidden');
        } else {
          pauseIcon.classList.remove('hidden');
          playIcon.classList.add('hidden');
          pauseLabel.classList.remove('hidden');
          playLabel.classList.add('hidden');
        }
      } else {
        const span = pauseBtn.querySelector('span');
        if (span) span.textContent = isPaused ? 'Play' : 'Pause';
        const svg = pauseBtn.querySelector('svg');
        if (svg) {
          svg.innerHTML = isPaused
            ? '<polygon points="5 3 19 12 5 21 5 3" fill="currentColor"></polygon>'
            : '<rect x="14" y="3" width="5" height="18" rx="1"></rect><rect x="5" y="3" width="5" height="18" rx="1"></rect>';
        }
      }
    };

    updatePauseUI(false);

    const handleStepChange = (e: Event) => {
      const detail = (e as CustomEvent<{ idx?: number; index?: number }>).detail;
      const idx = detail?.idx ?? detail?.index;
      if (typeof idx === 'number' && engine && lesson.steps?.[idx]) {
        currentIdx = idx;
        engine.goTo(lesson.steps[idx].scene);
        updatePauseUI(false);
      }
    };
    root.addEventListener('wb:step-change', handleStepChange);

    if (engine && fitBtn) {
      engine.onView = (zoomed: boolean) => {
        fitBtn.hidden = !zoomed;
      };
    }

    const handleFit = () => {
      (window as any).umami?.track('workbench-fit', { lesson: lesson.id });
      engine?.fit();
    };
    const handleReplay = () => {
      if (engine && lesson.steps?.[currentIdx]) {
        (window as any).umami?.track('workbench-replay', { lesson: lesson.id, step: currentIdx + 1 });
        engine.goTo(lesson.steps[currentIdx].scene, { instant: true });
        updatePauseUI(false);
      }
    };
    const handlePause = () => {
      if (!engine) return;
      engine.paused = !engine.paused;
      (window as any).umami?.track('workbench-pause', { lesson: lesson.id, paused: engine.paused, step: currentIdx + 1 });
      updatePauseUI(engine.paused);
    };

    fitBtn?.addEventListener('click', handleFit);
    replayBtn?.addEventListener('click', handleReplay);
    pauseBtn?.addEventListener('click', handlePause);

    // Theme sync
    const observer = new MutationObserver(() => engine?.retheme());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme'],
    });

    return () => {
      root.removeEventListener('wb:step-change', handleStepChange);
      fitBtn?.removeEventListener('click', handleFit);
      replayBtn?.removeEventListener('click', handleReplay);
      pauseBtn?.removeEventListener('click', handlePause);
      observer.disconnect();
      if (engine) {
        try {
          engine.destroy();
        } catch {
          try {
            engine.clear();
          } catch {}
        }
      }
      el.innerHTML = '';
    };
  }, [lesson]);

  return (
    <div
      ref={containerRef}
      className="stage__canvas-host"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'relative',
        overflow: 'visible',
      }}
    />
  );
}
