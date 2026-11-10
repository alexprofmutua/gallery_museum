import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";
// Node 26's native storage getter conflicts with this jsdom test environment.
// Use a standard in-memory Storage here; Playwright checks real browser persistence.
const entries = new Map<string, string>();
const storage: Storage = {
  get length() {
    return entries.size;
  },
  clear: () => entries.clear(),
  getItem: (key) => entries.get(key) ?? null,
  key: (index) => [...entries.keys()][index] ?? null,
  removeItem: (key) => {
    entries.delete(key);
  },
  setItem: (key, value) => {
    entries.set(String(key), String(value));
  },
};
vi.stubGlobal("localStorage", storage);
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: storage,
});
