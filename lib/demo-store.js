const globalStore = globalThis;

if (!globalStore.__redPetroleumDemoStore) {
  globalStore.__redPetroleumDemoStore = {
    counters: {},
    documents: [],
    requests: []
  };
}

export function getDemoStore() {
  return globalStore.__redPetroleumDemoStore;
}

export function nextDemoNumber(prefix) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const key = `${prefix}-${year}-${month}`;
  const store = getDemoStore();
  store.counters[key] = (store.counters[key] || 0) + 1;

  return `${prefix}-${year}-${String(month).padStart(2, "0")}-${String(store.counters[key]).padStart(4, "0")}`;
}
