export type UmamiEventData = Record<string, string | number | boolean>;

export interface UmamiTracker {
  track: {
    (eventName: string, data?: UmamiEventData): void;
    (data: UmamiEventData): void;
  };
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}
