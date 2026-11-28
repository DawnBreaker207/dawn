import { useEffect, useRef } from 'react';
import type { StageScene } from '@/lib/simulator/stage/types';
import { StageEngine } from '@/lib/simulator/stage';

interface Props {
  lessonId: string;
  scenes: StageScene[];
}

export default function SceneRenderer({ lessonId, scenes }: Props) {
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
      window.__ap_native = engine;

      if (scenes && scenes.length > 0) {
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
      if (typeof idx === 'number' && engine && scenes?.[idx]) {
        currentIdx = idx;
        engine.goTo(scenes[idx]);
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
      window.umami?.track('workbench-fit', { lesson: lessonId });
      engine?.fit();
    };
    const handleReplay = () => {
      if (engine && scenes?.[currentIdx]) {
        window.umami?.track('workbench-replay', { lesson: lessonId, step: currentIdx + 1 });
        engine.goTo(scenes[currentIdx], { instant: true });
        updatePauseUI(false);
      }
    };
    const handlePause = () => {
      if (!engine) return;
      engine.paused = !engine.paused;
      window.umami?.track('workbench-pause', { lesson: lessonId, paused: engine.paused, step: currentIdx + 1 });
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
  }, [lessonId, scenes]);

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
