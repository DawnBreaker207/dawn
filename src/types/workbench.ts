export interface WorkbenchStep {
  title: string;
  short: string;
  body: string[];
  why?: string;
  metrics?: Record<string, string>;
}

export interface WorkbenchLesson {
  title: string;
  subtitle?: string;
  minutes?: number;
  level?: string;
  steps: WorkbenchStep[];
  goals: { text: string; step: number }[];
}
