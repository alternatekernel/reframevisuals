// ── Minimal browser-storage shims for server-side rendering ────────────────
// A few components read localStorage/sessionStorage inside useState
// initializers. Shim them with in-memory storage so the server render matches
// what a first-time visitor (empty storage) would see. We intentionally do
// NOT shim window/document: libraries use those to detect the server.
// This module must be the FIRST import of entry-server.tsx.

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => store.clear(),
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  } as Storage;
};

const g = globalThis as Record<string, unknown>;
if (typeof g.localStorage === 'undefined') g.localStorage = createMemoryStorage();
if (typeof g.sessionStorage === 'undefined') g.sessionStorage = createMemoryStorage();

export {};
