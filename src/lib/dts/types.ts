export interface BlockEntity {
  type: 'block';
  x: number;
  y: number;
  color?: string;
  glyph?: string;
  label?: string | string[];
  pills?: string;
  [key: string]: unknown;
}

export interface DbEntity {
  type: 'db';
  x: number;
  y: number;
  label?: string | string[];
  [key: string]: unknown;
}

export interface DeviceEntity {
  type: 'device';
  x: number;
  y: number;
  label?: string | string[];
  tags?: unknown[];
  [key: string]: unknown;
}

export interface Link {
  from: string;
  to: string;
  pts: unknown[];
  heads?: string;
  label?: string;
  [key: string]: unknown;
}

export interface LessonGoal {
  text: string;
  step: number;
}

export interface LessonCallout {
  kind: string;
  text: string;
}

export interface LessonStep {
  short: string;
  chapter: string;
  title: string;
  body: string[];
  callout?: LessonCallout;
  metrics?: Record<string, unknown>;
  changes?: string[];
  scene?: {
    entities?: Record<string, unknown>;
    links?: Record<string, unknown>;
    flows?: unknown[];
  };
}

export interface Lesson {
  id: string;
  title: string;
  summary?: string;
  minutes?: number;
  level?: string;
  metrics?: string[];
  legend?: unknown[];
  goals?: LessonGoal[];
  steps: LessonStep[];
}
