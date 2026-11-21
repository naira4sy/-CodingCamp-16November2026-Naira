# Implementation Plan: To Do List Life Dashboard

## Overview

Build a client-side, zero-dependency SPA using HTML, CSS, and Vanilla JavaScript (ES modules). All state lives in a single in-memory `AppState` object, persisted to `localStorage` on every mutation. Modules are built in dependency order — constants first, then validators, storage, state, render, event handlers, and finally the bootstrap entry point — with features layered on incrementally.

## Tasks

- [x] 1. Scaffold project structure and HTML skeleton
  - Create `index.html` with `<header>`, `<main id="dashboard-grid">`, and `<aside id="modal-overlay">` sections
  - Add `<script type="module" src="js/app.js">` and `<link rel="stylesheet" href="css/styles.css">` to `index.html`
  - Create empty files: `css/styles.css`, `js/app.js`, `js/state.js`, `js/storage.js`, `js/render.js`, `js/eventHandlers.js`, `js/validators.js`, `js/constants.js`
  - Verify the app opens from the filesystem (`file://`) without a local server
  - _Requirements: 12.3_

- [x] 2. Implement `constants.js`
  - Export `STORAGE_KEY = 'todoLifeDashboard_v1'`
  - Export `DEFAULT_LIFE_CATEGORIES = ['Personal', 'Work', 'Health', 'Finance']`
  - Export `MAX_TASK_TITLE_LENGTH = 255`, `MAX_LIST_NAME_LENGTH = 100`, `MAX_CATEGORY_NAME_LENGTH = 50`
  - _Requirements: 5.7, 8.4_

- [x] 3. Implement `validators.js`
  - [x] 3.1 Implement `validateTaskTitle(title)` — returns `{ valid, message }`; rejects empty strings and titles exceeding 255 characters
    - _Requirements: 1.1, 1.2_
  - [x] 3.2 Implement `validateDueDate(dateStr)` — returns `{ valid, message }`; accepts `null`/empty (optional field) or a string matching `YYYY-MM-DD` that resolves to a valid calendar date; rejects all other formats
    - _Requirements: 1.3, 1.4_
  - [x] 3.3 Implement `validateListName(name)` — returns `{ valid, message }`; rejects empty strings and names exceeding 100 characters
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  - [x] 3.4 Implement `validateCategoryName(name)` — returns `{ valid, message }`; rejects empty strings and names exceeding 50 characters
    - _Requirements: 5.3, 5.4_
  - [x] 3.5 Write unit tests for all four validator functions
    - Cover empty string, boundary lengths (exactly at and one over the limit), valid inputs, and invalid date formats
    - _Requirements: 1.2, 1.4, 4.2, 4.4, 5.4_

- [x] 4. Implement `storage.js`
  - [x] 4.1 Implement `isAvailable()` — probe write/read/delete to detect `SecurityError` or quota issues; return `boolean`
    - _Requirements: 2.5, 8.3_
  - [x] 4.2 Implement `load()` — read and `JSON.parse` from `STORAGE_KEY`; return `AppState | null`; catch parse errors and return `null`
    - _Requirements: 8.2, 8.3_
  - [x] 4.3 Implement `save(state)` — `JSON.stringify` and write to `STORAGE_KEY`; catch `QuotaExceededError` and other errors; return `{ ok: boolean, error?: string }`
    - _Requirements: 8.1, 2.5, 3.4, 3.7_
  - [x] 4.4 Write unit tests for `storage.js`
    - Test `load()` returning `null` on missing key, `null` on malformed JSON, and a parsed object on valid data
    - Test `save()` returning `{ ok: true }` on success and `{ ok: false, error }` on simulated quota failure
    - _Requirements: 8.1, 8.2, 8.3_

- [x] 5. Implement `state.js` — core data mutations
  - [x] 5.1 Initialise module-level `_state` and `_uiState`; implement `getState()` returning a deep clone
    - _Requirements: 8.2_
  - [x] 5.2 Implement Life Category mutations: `createCategory(name)` and `deleteCategory(id)`
    - Prevent deletion of default categories (`isDefault: true`)
    - Call `storage.save()` on every mutation; propagate storage errors in return value
    - _Requirements: 5.3, 5.5, 5.6, 5.7_
  - [x] 5.3 Implement Task List mutations: `createTaskList(name, categoryId)`, `renameTaskList(id, name)`, `deleteTaskList(id)` (cascades to tasks)
    - Reject `createTaskList` if `categoryId` does not reference an existing category
    - _Requirements: 4.1, 4.3, 4.5, 4.6_
  - [x] 5.4 Implement Task mutations: `createTask(title, dueDate, listId)`, `updateTask(id, title, dueDate)`, `toggleTask(id)`, `deleteTask(id)`
    - `createTask` must reject if `listId` does not reference an existing Task_List
    - Assign `createdAt: Date.now()` on creation; generate IDs with `crypto.randomUUID()`
    - _Requirements: 1.1, 1.3, 1.5, 1.6, 2.1, 2.2, 2.4, 3.1, 3.2, 3.5, 3.6_
  - [x] 5.5 Implement UI state helpers: `setFilter(listId, filter)` and `setSort(listId, sort)` (in-memory only, not persisted)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 5.6 Write unit tests for `state.js` mutations
    - Test cascade deletion (deleting a category removes its lists and tasks)
    - Test that `deleteCategory` rejects default categories
    - Test that `createTask` rejects when no Task_List exists
    - Test that `toggleTask` flips `completed` and that a second call restores it
    - _Requirements: 1.6, 2.1, 2.2, 5.6, 5.7_

- [x] 6. Checkpoint — Core data layer complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement `render.js` — DOM builders
  - [x] 7.1 Implement `renderProgressBar(completed, total)` — returns a `<div>` with `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, and a filled inner bar; display 0% without errors when `total === 0`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.4_
  - [x] 7.2 Implement `renderTask(taskData)` — returns a `<li>` element with checkbox (`data-action="toggle-task"`), title span, optional due-date span, and edit/delete buttons with `aria-label` attributes and `data-action` / `data-task-id` attributes; apply strikethrough class when `completed === true`
    - _Requirements: 2.1, 2.2, 3.1, 10.4_
  - [x] 7.3 Implement `renderTaskList(listData, tasks, uiState)` — returns a `.task-list-card` div containing: list header with name, progress bar, rename/delete buttons; filter-sort bar; filtered and sorted `<ul>` of task items; add-task form
    - Apply active/completed/all filter to `tasks` array before rendering
    - Apply creation-date or due-date sort (tasks without due date go last)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 6.1_
  - [x] 7.4 Implement `renderCategory(categoryData, taskLists, tasks, uiState)` — returns a `<section class="life-category-panel">` with category header (name, category-level progress bar, delete button hidden for default categories), and all child task list cards
    - _Requirements: 5.1, 5.7, 6.2_
  - [x] 7.5 Implement `renderDashboard(state)` — clears and rebuilds `#dashboard-grid`; groups task lists by category; renders an "Uncategorised" section for lists with no matching category; seeds default categories on first run
    - _Requirements: 5.1, 5.2_
  - [x] 7.6 Implement utility render helpers: `showInlineError(inputEl, message)`, `clearInlineError(inputEl)`, `showModal(config)`, `hideModal()`, `showStorageWarning(message)`
    - Modal must set focus to confirm button, trap focus within the overlay, use `role="dialog"` with `aria-modal="true"` and `aria-labelledby`
    - _Requirements: 3.5, 8.3, 10.3_
  - [x] 7.7 Write unit tests for render helpers
    - Test `renderProgressBar` at 0/0, 0/5, 3/5, 5/5
    - Test that `renderTask` applies strikethrough class when `completed` is true and removes it when false
    - Test that `renderTaskList` filters correctly for each of the three filter states
    - _Requirements: 2.1, 6.3, 7.1, 7.2, 7.3_

- [x] 8. Implement `eventHandlers.js`
  - [x] 8.1 Implement `onAddTask(event)` — validate title and date with `validators.js`; show inline errors on failure; call `state.createTask`; re-render the affected task list; display storage error if save fails
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 8.2 Implement `onToggleTask(event)` — call `state.toggleTask`; re-render the task item and its progress bar within 100 ms; display storage error if save fails
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 6.4_
  - [x] 8.3 Implement `onEditTask(event)` and `onDeleteTask(event)` — `onEditTask` renders an inline edit form pre-filled with current title and due date; on save, validates and calls `state.updateTask`; `onDeleteTask` calls `showModal` for confirmation before calling `state.deleteTask`; both display storage errors on failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 8.4 Implement `onAddTaskList(event)`, `onRenameTaskList(event)`, `onDeleteTaskList(event)` — validate names; show inline errors; confirm deletion via modal; re-render affected category panel
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  - [x] 8.5 Implement `onAddCategory(event)` and `onDeleteCategory(event)` — validate name; confirm deletion with message noting all contained lists and tasks will be deleted; block deletion of default categories; full dashboard re-render after category changes
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 8.6 Implement `onFilterChange(event)` and `onSortChange(event)` — call `state.setFilter`/`state.setSort`; re-render the affected task list
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  - [x] 8.7 Implement `onConfirmModal(event)` and `onCancelModal(event)` — execute or discard the pending destructive action; call `hideModal()`
    - _Requirements: 3.5, 4.5, 5.5_

- [x] 9. Implement `app.js` — bootstrap and event wiring
  - Load state from `storage.load()`; if `null` or parse error, initialise empty state and seed default categories; display `showStorageWarning` if storage unavailable
  - Call `renderDashboard(state)` for initial render
  - Attach a single delegated `click` listener on `#app` that dispatches to handlers via `e.target.closest('[data-action]')?.dataset.action`
  - Attach a delegated `submit` listener on `#app` for form submissions using `data-form` attributes
  - Attach `change` listeners for filter selects and sort selects
  - _Requirements: 8.2, 8.3, 11.1_

- [x] 10. Checkpoint — Full feature wiring complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. Apply CSS — base styles, layout, and components
  - [x] 11.1 Define CSS custom properties for colour palette; ensure all text/background pairs meet WCAG 2.1 AA 4.5:1 contrast ratio
    - _Requirements: 10.2_
  - [x] 11.2 Set `font-size: 1rem` (inherits browser default 16 px) on `body`; set `line-height: 1.5` for task and label text; use `rem` and `%` for all font sizes and spacing
    - _Requirements: 10.1, 9.4_
  - [x] 11.3 Implement responsive `#dashboard-grid` using CSS Grid: single-column default; `repeat(auto-fill, minmax(320px, 1fr))` at `min-width: 768px`; `repeat(auto-fill, minmax(400px, 1fr))` at `min-width: 1200px`
    - _Requirements: 9.1, 9.2, 9.3_
  - [x] 11.4 Style `.task-list-card`, `.life-category-panel`, `.task-item`, `.filter-sort-bar`, `.add-task-form`, and progress bar components
    - _Requirements: 9.1_
  - [x] 11.5 Add `:focus-visible` outlines (2 px solid, 2 px offset) on all interactive elements: buttons, inputs, checkboxes, and select elements
    - _Requirements: 10.3_
  - [x] 11.6 Style the modal overlay — centred dialog, backdrop, focus trap visible state; style inline error messages and the storage warning banner
    - _Requirements: 3.5, 8.3_

- [x] 12. Accessibility and ARIA wiring
  - Verify all icon-only buttons in `render.js` carry `aria-label` attributes
  - Verify all `<input>` and `<select>` elements are associated with `<label>` elements via `for`/`id` pairs in generated markup
  - Verify progress bars use `role="progressbar"` with `aria-valuenow` updated on every re-render
  - Verify modal uses `role="dialog"`, `aria-modal="true"`, and `aria-labelledby`
  - _Requirements: 10.3, 10.4_

- [ ] 13. Cross-browser and performance validation
  - [ ] 13.1 Verify no JavaScript console errors appear during normal operation (add, complete, delete, filter, sort, rename, reload) — test in Chrome, Firefox, Edge, and Safari
    - _Requirements: 11.3, 12.1_
  - [~] 13.2 Write a manual test checklist covering: initial load with empty storage, reload with existing storage data, storage unavailability simulation (private browsing), and all filter/sort combinations
    - _Requirements: 7.1–7.5, 8.2, 8.3, 11.1_

- [~] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- JS modules are built in strict dependency order: `constants` → `validators` → `storage` → `state` → `render` → `eventHandlers` → `app`
- No build step, no package manager, no external dependencies — the app must open directly from the filesystem
- Checkpoints at tasks 6, 10, and 14 ensure each major layer is verified before the next is built

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "3.4"] },
    { "id": 3, "tasks": ["3.5", "4.1", "4.2", "4.3"] },
    { "id": 4, "tasks": ["4.4", "5.1"] },
    { "id": 5, "tasks": ["5.2", "5.3", "5.4", "5.5"] },
    { "id": 6, "tasks": ["5.6"] },
    { "id": 7, "tasks": ["6"] },
    { "id": 8, "tasks": ["7.1", "7.2"] },
    { "id": 9, "tasks": ["7.3", "7.4"] },
    { "id": 10, "tasks": ["7.5", "7.6"] },
    { "id": 11, "tasks": ["7.7", "8.1", "8.2"] },
    { "id": 12, "tasks": ["8.3", "8.4", "8.5", "8.6", "8.7"] },
    { "id": 13, "tasks": ["9"] },
    { "id": 14, "tasks": ["10"] },
    { "id": 15, "tasks": ["11.1", "11.2"] },
    { "id": 16, "tasks": ["11.3", "11.4"] },
    { "id": 17, "tasks": ["11.5", "11.6"] },
    { "id": 18, "tasks": ["12"] },
    { "id": 19, "tasks": ["13.1"] },
    { "id": 20, "tasks": ["13.2"] },
    { "id": 21, "tasks": ["14"] }
  ]
}
```
