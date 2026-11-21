/**
 * render.test.mjs
 * Unit tests for render.js helper functions.
 *
 * Run with: node js/render.test.mjs
 *
 * Uses a minimal DOM mock (no external dependencies) to simulate the browser
 * APIs that render.js relies on.
 */

// ─── 1. Minimal DOM Mock ──────────────────────────────────────────────────────

class MockStyle {
  constructor() {
    this._data = {};
  }
  set width(v)  { this._data.width = v; }
  get width()   { return this._data.width ?? ''; }
}

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(...names)      { names.forEach(n => this._classes.add(n)); }
  remove(...names)   { names.forEach(n => this._classes.delete(n)); }
  contains(name)     { return this._classes.has(name); }
  get value()        { return [...this._classes].join(' '); }
}

class MockElement {
  constructor(tag) {
    this.tagName      = tag.toUpperCase();
    this.children     = [];            // child MockElements
    this._attrs       = {};
    this.classList    = new MockClassList();
    this.style        = new MockStyle();
    this.dataset      = {};
    this.textContent  = '';
    this.id           = '';
    this.type         = '';
    this.checked      = false;
    this.value        = '';
    this.selected     = false;
    this.maxLength    = undefined;
    this.placeholder  = '';
    this.name         = '';
    this.innerHTML    = '';
    this.htmlFor      = '';
  }

  // Attribute helpers
  setAttribute(name, value) { this._attrs[name] = String(value); }
  getAttribute(name)        { return this._attrs[name] ?? null; }
  removeAttribute(name)     { delete this._attrs[name]; }

  // className convenience (mirrors classList.value)
  set className(v) {
    this.classList._classes.clear();
    v.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
  }
  get className() { return this.classList.value; }

  // Child management
  appendChild(child) {
    this.children.push(child);
    return child;
  }

  // insertAdjacentElement('afterend', el) — used by showInlineError
  insertAdjacentElement(position, el) {
    if (position === 'afterend') {
      // Find this element in its parent's children and insert after it.
      // For test purposes we just record the sibling relationship.
      this._nextSibling = el;
    }
  }

  // nextElementSibling — used by clearInlineError / showInlineError
  get nextElementSibling() {
    return this._nextSibling ?? null;
  }
  set nextElementSibling(el) { this._nextSibling = el; }

  // remove() — used by clearInlineError
  remove() {
    // No-op for standalone elements in tests; correctness verified by assertion.
  }
}

// Global document mock — use defineProperty for read-only globals in Node 20+
const mockDocument = {
  createElement(tag) { return new MockElement(tag); },
  getElementById(id) { return null; },   // override per-test where needed
  body: new MockElement('body'),
};
Object.defineProperty(globalThis, 'document', { value: mockDocument, writable: true, configurable: true });

const mockWindow = { _pendingModalConfirm: null, _pendingModalCancel: null };
Object.defineProperty(globalThis, 'window', { value: mockWindow, writable: true, configurable: true });

// crypto.randomUUID is already available in Node 15+ — no override needed.

// ─── 2. Mock state.js and storage.js ─────────────────────────────────────────
// render.js does: import { getUiState, getState } from './state.js'
//                 import { save }               from './storage.js'
// We intercept via import maps by patching Node's module loading through a
// custom loader — but that requires flags.  The simpler zero-flag approach is
// to mock localStorage so state.js / storage.js work without crashing.

const mockLocalStorage = (() => {
  const store = {};
  return {
    getItem(k)      { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v)   { store[k] = String(v); },
    removeItem(k)   { delete store[k]; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: mockLocalStorage, writable: true, configurable: true });

// ─── 3. Import render.js functions ───────────────────────────────────────────

const { renderProgressBar, renderTask, renderTaskList } =
  await import('./render.js');

// ─── 4. Tiny test harness ─────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓  ${message}`);
  } else {
    failed++;
    failures.push(message);
    console.error(`  ✗  ${message}`);
  }
}

function describe(suiteName, fn) {
  console.log(`\n${suiteName}`);
  fn();
}

// ─── 5. Tests ────────────────────────────────────────────────────────────────

describe('renderProgressBar', () => {

  describe('renderProgressBar(0, 0) — zero total', () => {
    const bar = renderProgressBar(0, 0);
    const fill = bar.children[0];

    assert(
      bar.getAttribute('aria-valuenow') === '0',
      'aria-valuenow is "0"',
    );
    assert(
      fill.style.width === '0%',
      'fill width is "0%"',
    );
  });

  describe('renderProgressBar(0, 5) — none completed', () => {
    const bar = renderProgressBar(0, 5);
    const fill = bar.children[0];

    assert(
      bar.getAttribute('aria-valuenow') === '0',
      'aria-valuenow is "0"',
    );
    assert(
      fill.style.width === '0%',
      'fill width is "0%"',
    );
  });

  describe('renderProgressBar(3, 5) — partial completion', () => {
    const bar = renderProgressBar(3, 5);
    const fill = bar.children[0];

    assert(
      bar.getAttribute('aria-valuenow') === '60',
      'aria-valuenow is "60"',
    );
    assert(
      fill.style.width === '60%',
      'fill width is "60%"',
    );
  });

  describe('renderProgressBar(5, 5) — all completed', () => {
    const bar = renderProgressBar(5, 5);
    const fill = bar.children[0];

    assert(
      bar.getAttribute('aria-valuenow') === '100',
      'aria-valuenow is "100"',
    );
    assert(
      fill.style.width === '100%',
      'fill width is "100%"',
    );
  });

  describe('renderProgressBar — structure', () => {
    const bar = renderProgressBar(1, 4);
    assert(
      bar.getAttribute('role') === 'progressbar',
      'container has role="progressbar"',
    );
    assert(
      bar.classList.contains('progress-bar'),
      'container has class "progress-bar"',
    );
    const fill  = bar.children[0];
    const label = bar.children[1];
    assert(
      fill.classList.contains('progress-bar__fill'),
      'first child has class "progress-bar__fill"',
    );
    assert(
      label.classList.contains('progress-bar__label'),
      'second child has class "progress-bar__label"',
    );
    assert(
      label.textContent === '1/4 tasks',
      'label text is "1/4 tasks"',
    );
  });

});

describe('renderTask', () => {

  const baseTask = {
    id:        'task-1',
    title:     'Buy groceries',
    dueDate:   null,
    completed: false,
    createdAt: 1000,
    listId:    'list-1',
  };

  describe('renderTask — incomplete task', () => {
    const li = renderTask({ ...baseTask, completed: false });

    assert(
      li.tagName === 'LI',
      'returns an <li> element',
    );
    assert(
      li.classList.contains('task-item'),
      'li has class "task-item"',
    );
    assert(
      !li.classList.contains('task-item--completed'),
      'li does NOT have class "task-item--completed"',
    );

    // Checkbox is the first child
    const checkbox = li.children[0];
    assert(
      checkbox.type === 'checkbox',
      'first child is a checkbox input',
    );
    assert(
      checkbox.checked === false,
      'checkbox is NOT checked',
    );
    assert(
      checkbox.dataset.taskId === 'task-1',
      'checkbox dataset.taskId matches task id',
    );
  });

  describe('renderTask — completed task', () => {
    const li = renderTask({ ...baseTask, completed: true });

    assert(
      li.classList.contains('task-item--completed'),
      'li has class "task-item--completed"',
    );

    const checkbox = li.children[0];
    assert(
      checkbox.checked === true,
      'checkbox IS checked',
    );
  });

  describe('renderTask — task with due date', () => {
    const li = renderTask({ ...baseTask, dueDate: '2026-11-16' });
    // children: [checkbox, titleSpan, dueDateSpan, editBtn, deleteBtn]
    const dueDateSpan = li.children[2];

    assert(
      dueDateSpan.classList.contains('task-item__due-date'),
      'due-date span is rendered when dueDate is set',
    );
    assert(
      dueDateSpan.textContent === '2026-11-16',
      'due-date span contains the date string',
    );
  });

  describe('renderTask — task without due date', () => {
    const li = renderTask({ ...baseTask, dueDate: null });
    // children: [checkbox, titleSpan, editBtn, deleteBtn]  (no due date span)
    assert(
      li.children.length === 4,
      'renders 4 children when no dueDate (no due-date span)',
    );
  });

  describe('renderTask — title text', () => {
    const li = renderTask({ ...baseTask, title: 'Walk the dog' });
    const titleSpan = li.children[1];

    assert(
      titleSpan.classList.contains('task-item__title'),
      'title span has class "task-item__title"',
    );
    assert(
      titleSpan.textContent === 'Walk the dog',
      'title span textContent matches task title',
    );
  });

  describe('renderTask — edit/delete buttons', () => {
    const li = renderTask({ ...baseTask, id: 'task-99' });
    // No dueDate: [checkbox, titleSpan, editBtn, deleteBtn]
    const editBtn   = li.children[2];
    const deleteBtn = li.children[3];

    assert(
      editBtn.dataset.action === 'edit-task',
      'edit button has dataset.action="edit-task"',
    );
    assert(
      editBtn.dataset.taskId === 'task-99',
      'edit button dataset.taskId matches task id',
    );
    assert(
      deleteBtn.dataset.action === 'delete-task',
      'delete button has dataset.action="delete-task"',
    );
    assert(
      deleteBtn.dataset.taskId === 'task-99',
      'delete button dataset.taskId matches task id',
    );
  });

});

describe('renderTaskList — filter behaviour', () => {

  const listData = { id: 'list-a', name: 'Test List', categoryId: 'cat-1' };

  const tasks = [
    { id: 't1', title: 'Active 1',   dueDate: null, completed: false, createdAt: 1, listId: 'list-a' },
    { id: 't2', title: 'Active 2',   dueDate: null, completed: false, createdAt: 2, listId: 'list-a' },
    { id: 't3', title: 'Completed 1',dueDate: null, completed: true,  createdAt: 3, listId: 'list-a' },
    // task from a different list — must NEVER appear
    { id: 't4', title: 'Other list', dueDate: null, completed: false, createdAt: 4, listId: 'list-b' },
  ];

  function countRenderedTasks(card) {
    // The <ul class="task-list-card__tasks"> is the 4th child of card
    // (header, progressBar, filterSortBar, ul, form)
    // We find it by class name
    const ul = card.children.find(c => c.classList.contains('task-list-card__tasks'));
    return ul ? ul.children.length : 0;
  }

  describe('filter = "all"', () => {
    const card = renderTaskList(listData, tasks, { 'list-a': { filter: 'all', sort: 'created' } });
    const count = countRenderedTasks(card);
    assert(count === 3, `filter "all" renders 3 tasks (got ${count})`);
  });

  describe('filter = "active"', () => {
    const card = renderTaskList(listData, tasks, { 'list-a': { filter: 'active', sort: 'created' } });
    const count = countRenderedTasks(card);
    assert(count === 2, `filter "active" renders 2 tasks (got ${count})`);
  });

  describe('filter = "completed"', () => {
    const card = renderTaskList(listData, tasks, { 'list-a': { filter: 'completed', sort: 'created' } });
    const count = countRenderedTasks(card);
    assert(count === 1, `filter "completed" renders 1 task (got ${count})`);
  });

  describe('renderTaskList — card structure', () => {
    const card = renderTaskList(listData, tasks, {});

    assert(
      card.classList.contains('task-list-card'),
      'root element has class "task-list-card"',
    );

    const header = card.children[0];
    assert(
      header.classList.contains('task-list-card__header'),
      'first child is the header',
    );

    // heading inside header
    const h3 = header.children[0];
    assert(
      h3.tagName === 'H3' && h3.textContent === 'Test List',
      'header h3 shows list name',
    );
  });

  describe('renderTaskList — progress bar in card', () => {
    const card = renderTaskList(listData, tasks, {});
    // progress bar is 2nd child of card
    const progressBar = card.children[1];

    assert(
      progressBar.getAttribute('role') === 'progressbar',
      'second child is a progress bar',
    );
    // 1 out of 3 tasks in list-a are completed
    assert(
      progressBar.getAttribute('aria-valuenow') === '33',
      'progress bar reflects 1/3 completed tasks (33%)',
    );
  });

});

// ─── 6. Summary ──────────────────────────────────────────────────────────────

console.log('\n─────────────────────────────────────────────');
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failures.length > 0) {
  console.error('\nFailed assertions:');
  failures.forEach(f => console.error(`  • ${f}`));
  process.exit(1);
} else {
  console.log('All tests passed ✓');
  process.exit(0);
}
