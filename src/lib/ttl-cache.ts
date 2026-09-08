export function ttlCache<V>(ttlMs: number) {
  const store = new Map<string, { value: V; at: number }>();
  return { get, set, clear };

  function get(key: string): V | undefined {
    const hit = store.get(key);
    if (!hit || Date.now() - hit.at >= ttlMs) return undefined;
    return hit.value;
  }

  function set(key: string, value: V) {
    store.set(key, { value, at: Date.now() });
  }

  function clear() {
    store.clear();
  }
}