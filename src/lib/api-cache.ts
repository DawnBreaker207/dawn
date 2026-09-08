import { ttlCache } from '@/lib/ttl-cache';

export interface ApiCacheOptions {
  ttlMs: number;
  maxAge: number;
  sMaxAge: number;
  stale: number;
}

export function apiCache<V>(options: ApiCacheOptions) {
  const store = ttlCache<V>(options.ttlMs);
  return async (key: string, load: () => Promise<V>): Promise<Response> => {
    const cached = store.get(key);
    if (cached !== undefined) return respond(cached, true);
    try {
      const value = await load();
      if (value == null) return respond(null, false, 502);
      if (value instanceof Object && 'ok' in value && value.ok === false) return respond(value, false);
      store.set(key, value);
      return respond(value, false);
    } catch {
      return respond(null, false, 502);
    }
  };

  function respond(value: V | null, cached: boolean, status = 200) {
    return new Response(JSON.stringify(value), {
      status,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': cached
          ? `public, max-age=${options.maxAge}, s-maxage=${options.sMaxAge}, stale-while-revalidate=${options.stale}`
          : 'no-cache',
      },
    });
  }
}