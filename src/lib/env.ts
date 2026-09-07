// Astro/Vite loads .env* into import.meta.env, not process.env. This helper
// prefers import.meta.env (Astro's .env* vars), then process.env (real
// shell/runtime vars like VERCEL_* injected by the platform).
export function env(name: string): string | undefined {
  return (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
}