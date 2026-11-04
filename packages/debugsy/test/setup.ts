// Node 25+ has its own localStorage global, undefined unless Node runs with
// --localstorage-file, and it hides happy-dom's. Debugsy saves its settings
// there, so give the tests an in-memory one.
if (typeof globalThis.localStorage === "undefined") {
  const items = new Map<string, string>();
  const storage: Storage = {
    getItem: (key) => items.get(key) ?? null,
    setItem: (key, value) => void items.set(key, String(value)),
    removeItem: (key) => void items.delete(key),
    clear: () => items.clear(),
    key: (index) => Array.from(items.keys())[index] ?? null,
    get length() {
      return items.size;
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}
