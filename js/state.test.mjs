// state.test.mjs — unit tests for state.js mutations
// Run with: node js/state.test.mjs

// ─── 1. In-memory localStorage stub ──────────────────────────────────────────

function makeLocalStorageStub() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    _store: store,
  };
}

// Install globals before any module import so storage.js picks them up.
global.localStorage = makeLocalStorageStub();

// Node 15+ exposes crypto.randomUUID() on globalThis.crypto; re-export so the
// module's bare `crypto.randomUUID()` calls resolve without a browser context.
import { randomUUID } from 'crypto';
if (!global.crypto) global.crypto = {};
if (!global.crypto.randomUUID) global.crypto.randomUUID = randomUUID;

// ─── 2. Import module under test ─────────────────────────────────────────────

import {
  createCategory,
  deleteCategory,
  createTaskList,
  deleteTaskList,
  createTask,
  toggleTask,
  initState,
  getState,
} from './state.js';

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
  if (ok) {
    console.log(`  ✓  ${message}`);
    passed++;
  } else {
    console.error(`  ✗  ${message}`);
    console.error(`       expected: ${JSON.stringify(expected)}`);
    console.error(`       received: ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ─── 4. Helper: reset state to a known blank slate ───────────────────────────

function resetState() {
  localStorage.clear();
  initState({ categories: [], taskLists: [], tasks: [] });
}

// ─── 5. Tests ─────────────────────────────────────────────────────────────────

// ── 5.1  Cascade deletion ─────────────────────────────────────────────────────
console.log('\ncascade deletion — deleteCategory removes lists and tasks');

resetState();
const cat = createCategory('Work').category;
const list1 = createTaskList('Inbox', cat.id).taskList;
const list2 = createTaskList('Projects', cat.id).taskList;
createTask('Task A', null, list1.id);
createTask('Task B', null, list1.id);
createTask('Task C', null, list2.id);

const delResult = deleteCategory(cat.id);
assert(delResult.ok === true, 'deleteCategory returns ok: true');

const afterDel = getState();
assertEqual(afterDel.categories.length, 0, 'category is removed');
assertEqual(afterDel.taskLists.length, 0, 'all task lists in that category are removed');
assertEqual(afterDel.tasks.length, 0, 'all tasks belonging to those lists are removed');

// ── 5.2  deleteCategory rejects default categories ───────────────────────────
console.log('\ndeleteCategory rejects default categories');

resetState();
// Seed state with a default category directly
initState({
  categories: [{ id: 'default-1', name: 'Personal', isDefault: true }],
  taskLists: [],
  tasks: [],
});

const rejectResult = deleteCategory('default-1');
assert(rejectResult.ok === false, 'returns ok: false for a default category');
assert(typeof rejectResult.error === 'string' && rejectResult.error.length > 0,
  'error field is a non-empty string');
assertEqual(getState().categories.length, 1, 'default category is NOT removed from state');

// ── 5.3  createTask rejects when listId does not exist ───────────────────────
console.log('\ncreateTask rejects when no matching Task_List exists');

resetState();
const badResult = createTask('Ghost task', null, 'nonexistent-list-id');
assert(badResult.ok === false, 'returns ok: false when listId does not exist');
assert(typeof badResult.error === 'string' && badResult.error.length > 0,
  'error field is a non-empty string');
assertEqual(getState().tasks.length, 0, 'no task is added to state');

// ── 5.4  toggleTask flips `completed` ────────────────────────────────────────
console.log('\ntoggleTask flips completed');

resetState();
const cat2 = createCategory('Health').category;
const list3 = createTaskList('Exercise', cat2.id).taskList;
const task = createTask('Run 5k', null, list3.id).task;

assert(task.completed === false, 'task starts as not completed');

const toggle1 = toggleTask(task.id);
assert(toggle1.ok === true, 'first toggle returns ok: true');
assert(toggle1.task.completed === true, 'first toggle sets completed to true');

const toggle2 = toggleTask(task.id);
assert(toggle2.ok === true, 'second toggle returns ok: true');
assert(toggle2.task.completed === false, 'second toggle restores completed to false');

// ── 5.5  createTaskList rejects when categoryId does not exist ───────────────
console.log('\ncreateTaskList rejects when categoryId does not exist');

resetState();
const badList = createTaskList('Orphan', 'nonexistent-cat-id');
assert(badList.ok === false, 'returns ok: false when categoryId does not exist');
assert(typeof badList.error === 'string' && badList.error.length > 0,
  'error field is a non-empty string');
assertEqual(getState().taskLists.length, 0, 'no task list is added to state');

// ── 5.6  deleteTaskList cascades to remove its tasks ─────────────────────────
console.log('\ndeleteTaskList cascades — removes all tasks in the list');

resetState();
const cat3 = createCategory('Finance').category;
const listA = createTaskList('Bills', cat3.id).taskList;
const listB = createTaskList('Savings', cat3.id).taskList;
createTask('Pay rent', null, listA.id);
createTask('Pay internet', null, listA.id);
createTask('Open ISA', null, listB.id);

const delList = deleteTaskList(listA.id);
assert(delList.ok === true, 'deleteTaskList returns ok: true');

const afterListDel = getState();
assertEqual(afterListDel.taskLists.length, 1, 'only the target list is removed');
assert(
  afterListDel.taskLists[0].id === listB.id,
  'the other list is unaffected',
);
assertEqual(afterListDel.tasks.length, 1, 'tasks belonging to the deleted list are removed');
assert(
  afterListDel.tasks[0].listId === listB.id,
  'the surviving task belongs to the remaining list',
);

// ─── 6. Summary ───────────────────────────────────────────────────────────────

console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
