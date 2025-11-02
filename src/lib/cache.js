// src/lib/cache.js  (ESM)
const _store = new Map();

/**
 * Set a value with optional TTL (ms). Default 30s.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlMs
 */
export function set(key, value, ttlMs = 30_000) {
  const expiresAt = ttlMs > 0 ? Date.now() + ttlMs : 0;
  _store.set(key, { value, expiresAt });
}

/**
 * Get a value; returns undefined if missing or expired.
 * @param {string} key
 */
export function get(key) {
  const item = _store.get(key);
  if (!item) return undefined;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    _store.delete(key);
    return undefined;
  }
  return item.value;
}

export function del(key) { _store.delete(key); }
export function clear() { _store.clear(); }

/**
 * Convenience helper: get, otherwise compute->set->return.
 * @param {string} key
 * @param {() => Promise<any> | any} compute
 * @param {number} ttlMs
 */
export async function getOrSet(key, compute, ttlMs = 30_000) {
  const existing = get(key);
  if (existing !== undefined) return existing;
  const value = await compute();
  set(key, value, ttlMs);
  return value;
}

export default { get, set, del, clear, getOrSet };

