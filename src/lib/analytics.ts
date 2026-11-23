import type { UmamiEventData } from '@/types/umami';

/**
 * Safe client-side event tracking via Umami.
 * No-ops during SSR or if Umami is not loaded / blocked.
 */
export function trackEvent(name: string, data?: UmamiEventData): void {
  if (typeof window === 'undefined') return;
  try {
    window.umami?.track(name, data);
  } catch {
    // Fail silently in development or when blocked by adblockers
  }
}
