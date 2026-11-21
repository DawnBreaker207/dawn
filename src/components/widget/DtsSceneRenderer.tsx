import { useEffect, useRef } from 'react';
import type { Lesson } from '@/lib/dts/types';
import { StageEngine } from '@/lib/dts/stage-engine';

interface Props {
  lesson: Lesson;
}

export default function DtsSceneRenderer({ lesson }: Props) {
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
      console.error('[DtsSceneRenderer] Failed to initialize StageEngine:', err);
    }

    // Step change listener
    const root = el.closest<HTMLElement>('.body') ?? document;
    let currentIdx = 0;

    const handleStepChange = (e: Event) => {
      const detail = (e as CustomEvent<{ idx?: number; index?: number }>).detail;
      const idx = detail?.idx ?? detail?.index;
      if (typeof idx === 'number' && engine && lesson.steps?.[idx]) {
        currentIdx = idx;
        engine.goTo(lesson.steps[idx].scene);
      }
    };
    root.addEventListener('wb:step-change', handleStepChange);

    // Tools
    const fitBtn = document.getElementById('fit') as HTMLElement | null;
    const replayBtn = document.getElementById('replay') as HTMLElement | null;
    const pauseBtn = document.getElementById('pause') as HTMLElement | null;

    if (engine && fitBtn) {
      engine.onView = (zoomed: boolean) => {
        fitBtn.hidden = !zoomed;
      };
    }

    const handleFit = () => engine?.fit();
    const handleReplay = () => {
      if (engine && lesson.steps?.[currentIdx]) {
        engine.goTo(lesson.steps[currentIdx].scene, { instant: true });
      }
    };
    const handlePause = () => {
      if (!engine) return;
      engine.paused = !engine.paused;
      pauseBtn?.classList.toggle('is-paused', engine.paused);
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
          engine.clear();
        } catch {}
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
