/**
 * SimulationRunner — Universal Step & Animation Loop Controller
 * Used across Java Concurrency, SQL MVCC, 2D State Machines, and Pipelines.
 */

export interface SimulationStep<T = unknown> {
  id?: string;
  label?: string;
  data?: T;
  duration?: number;
}

export interface SimulationRunnerOptions<T = unknown> {
  steps: SimulationStep<T>[];
  speed?: number; // 1 = 1x, 2 = 2x, etc.
  loop?: boolean;
  onStepChange?: (index: number, step: SimulationStep<T>) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onComplete?: () => void;
}

export class SimulationRunner<T = unknown> {
  private steps: SimulationStep<T>[];
  private currentIdx: number = 0;
  private isPlaying: boolean = false;
  private speed: number = 1;
  private loop: boolean = false;
  private timer: number | null = null;
  private onStepChange?: (index: number, step: SimulationStep<T>) => void;
  private onPlayStateChange?: (isPlaying: boolean) => void;
  private onComplete?: () => void;

  constructor(options: SimulationRunnerOptions<T>) {
    this.steps = options.steps;
    this.speed = options.speed ?? 1;
    this.loop = options.loop ?? false;
    this.onStepChange = options.onStepChange;
    this.onPlayStateChange = options.onPlayStateChange;
    this.onComplete = options.onComplete;
  }

  get index(): number {
    return this.currentIdx;
  }

  get currentStep(): SimulationStep<T> | undefined {
    return this.steps[this.currentIdx];
  }

  get playing(): boolean {
    return this.isPlaying;
  }

  get total(): number {
    return this.steps.length;
  }

  setSpeed(speed: number): void {
    this.speed = Math.max(0.25, Math.min(speed, 5));
  }

  setSteps(steps: SimulationStep<T>[]): void {
    this.pause();
    this.steps = steps;
    this.currentIdx = 0;
    this.notifyStep();
  }

  goTo(idx: number): void {
    if (idx < 0 || idx >= this.steps.length) return;
    this.currentIdx = idx;
    this.notifyStep();
  }

  next(): boolean {
    if (this.currentIdx < this.steps.length - 1) {
      this.currentIdx++;
      this.notifyStep();
      return true;
    }
    if (this.loop) {
      this.currentIdx = 0;
      this.notifyStep();
      return true;
    }
    this.pause();
    this.onComplete?.();
    return false;
  }

  prev(): boolean {
    if (this.currentIdx > 0) {
      this.currentIdx--;
      this.notifyStep();
      return true;
    }
    return false;
  }

  reset(): void {
    this.pause();
    this.currentIdx = 0;
    this.notifyStep();
  }

  play(): void {
    if (this.isPlaying || this.steps.length === 0) return;
    this.isPlaying = true;
    this.onPlayStateChange?.(true);
    this.scheduleNext();
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.onPlayStateChange?.(false);
  }

  toggle(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  private scheduleNext(): void {
    if (!this.isPlaying) return;
    const current = this.currentStep;
    const baseDuration = current?.duration ?? 1000;
    const delay = Math.max(100, baseDuration / this.speed);

    this.timer = window.setTimeout(() => {
      const hasNext = this.next();
      if (hasNext && this.isPlaying) {
        this.scheduleNext();
      }
    }, delay);
  }

  private notifyStep(): void {
    if (this.steps[this.currentIdx]) {
      this.onStepChange?.(this.currentIdx, this.steps[this.currentIdx]);
    }
  }

  destroy(): void {
    this.pause();
  }
}
