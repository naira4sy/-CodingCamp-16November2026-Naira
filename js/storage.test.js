// storage.test.js — unit tests for storage.js
// Run with: node js/storage.test.js
// No npm dependencies required.

// ─── 1. In-memory localStorage stub ──────────────────────────────────────────

function makeLocalStorageStub() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    // Expose the backing Map so tests can inspect or seed it directly.
    _store: store,
  };
}

// Install the stub as a global so storage.js picks it up.
global.localStorage = makeLocalStorageStub();

// ─── 2. Dynamic import of the module under test ───────────────────────────────
// storage.js uses ES module syntax, so we load it via dynamic import after the
// stub is in place.

const { load, save } = await import('./storage.js');

// ─── 3. Minimal test harness ──────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) {
    console.error(`  ✗  ${message}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       received: ${JSON.stringify(actual)}`);
    failed++;
  } else {
    console.log(`  ✓  ${message}`);
    passed++;
  }
}

// ─── 4. Tests ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'todoLifeDashboard_v1';

// --- load() ------------------------------------------------------------------

console.log('\nload()');

// 4.1 Missing key → null
localStorage.clear();
assertEqual(load(), null, 'returns null when the key is absent');

// 4.2 Malformed JSON → null
localStorage._store.set(STORAGE_KEY, 'not-json');
assertEqual(load(), null, 'returns null on malformed JSON');

// 4.3 Valid JSON → parsed object
const sample = { lists: [], version: 1 };
localStorage._store.set(STORAGE_KEY, JSON.stringify(sample));
assertEqual(load(), sample, 'returns the parsed object for valid JSON');

// --- save() ------------------------------------------------------------------

console.log('\nsave()');

// 4.4 Successful write → { ok: true }
localStorage.clear();
const result = save({ lists: [] });
assertEqual(result, { ok: true }, 'returns { ok: true } on success');
assert(localStorage.getItem(STORAGE_KEY) !== null, 'actually writes to localStorage');

// 4.5 Quota failure → { ok: false, error: string }
const originalSetItem = localStorage.setItem.bind(localStorage);
localStorage.setItem = (_key, _value) => {
  throw new DOMException('QuotaExceededError', 'QuotaExceededError');
};

const failResult = save({ lists: [] });
assert(failResult.ok === false, 'returns ok: false when setItem throws');
assert(typeof failResult.error === 'string' && failResult.error.length > 0,
  'error field is a non-empty string');

// Restore original setItem.
localStorage.setItem = originalSetItem;

// ─── 5. Summary ───────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
