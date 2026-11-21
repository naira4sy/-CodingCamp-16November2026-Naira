// render.js — DOM rendering functions (stateless: data in → DOM out)

import { getUiState, getState } from './state.js';

/**
 * Renders a progress bar element.
 *
 * @param {number} completed - Number of completed tasks
 * @param {number} total     - Total number of tasks
 * @returns {HTMLDivElement} Outer container with role="progressbar"
 */
export function renderProgressBar(completed, total) {
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Outer container
  const container = document.createElement('div');
  container.className = 'progress-bar';
  container.setAttribute('role', 'progressbar');
  container.setAttribute('aria-valuenow', String(percentage));
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', '100');

  // Fill bar
  const fill = document.createElement('div');
  fill.className = 'progress-bar__fill';
  fill.style.width = `${percentage}%`;

  // Label
  const label = document.createElement('span');
  label.className = 'progress-bar__label';
  label.textContent = `${completed}/${total} tasks`;

  container.appendChild(fill);
  container.appendChild(label);

  return container;
}

/**
 * Renders a single task as a <li class="task-item"> element.
 *
 * @param {{ id: string, title: string, dueDate: string|null, completed: boolean, createdAt: string, listId: string }} taskData
 * @returns {HTMLLIElement}
 */
export function renderTask(taskData) {
  const { id, title, dueDate, completed } = taskData;

  // Container
  const li = document.createElement('li');
  li.classList.add('task-item');
  if (completed) {
    li.classList.add('task-item--completed');
  }

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.dataset.action = 'toggle-task';
  checkbox.dataset.taskId = id;
  checkbox.checked = completed === true;
  li.appendChild(checkbox);

  // Title
  const titleSpan = document.createElement('span');
  titleSpan.classList.add('task-item__title');
  titleSpan.textContent = title;
  li.appendChild(titleSpan);

  // Due date (optional)
  if (dueDate) {
    const dueDateSpan = document.createElement('span');
    dueDateSpan.classList.add('task-item__due-date');
    dueDateSpan.textContent = dueDate;
    li.appendChild(dueDateSpan);
  }

  // Edit button
  const editBtn = document.createElement('button');
  editBtn.dataset.action = 'edit-task';
  editBtn.dataset.taskId = id;
  editBtn.setAttribute('aria-label', `Edit task: ${title}`);
  editBtn.textContent = 'Edit';
  li.appendChild(editBtn);

  // Delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.dataset.action = 'delete-task';
  deleteBtn.dataset.taskId = id;
  deleteBtn.setAttribute('aria-label', `Delete task: ${title}`);
  deleteBtn.textContent = 'Delete';
  li.appendChild(deleteBtn);

  return li;
}

/**
 * Renders a full task-list card.
 *
 * @param {{ id: string, name: string, categoryId: string }} listData
 * @param {Array<Object>} tasks   - All tasks; function filters to this list's tasks.
 * @param {Object} uiState        - Full _uiState map; per-list state read via uiState[listData.id].
 * @returns {HTMLDivElement}      <div class="task-list-card">
 */
export function renderTaskList(listData, tasks, uiState) {
  const { id, name } = listData;
  const { filter = 'all', sort = 'created' } = uiState[id] || {};

  // ── Root card ────────────────────────────────────────────────────────────
  const card = document.createElement('div');
  card.className = 'task-list-card';

  // ── 1. Header ────────────────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'task-list-card__header';

  const heading = document.createElement('h3');
  heading.className = 'task-list-card__name';
  heading.textContent = name;
  header.appendChild(heading);

  const renameBtn = document.createElement('button');
  renameBtn.dataset.action = 'rename-task-list';
  renameBtn.dataset.listId = id;
  renameBtn.setAttribute('aria-label', `Rename list: ${name}`);
  renameBtn.textContent = 'Rename';
  header.appendChild(renameBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.dataset.action = 'delete-task-list';
  deleteBtn.dataset.listId = id;
  deleteBtn.setAttribute('aria-label', `Delete list: ${name}`);
  deleteBtn.textContent = 'Delete';
  header.appendChild(deleteBtn);

  card.appendChild(header);

  // ── 2. Progress bar ──────────────────────────────────────────────────────
  const listTasks = tasks.filter(t => t.listId === id);
  const completedCount = listTasks.filter(t => t.completed === true).length;
  card.appendChild(renderProgressBar(completedCount, listTasks.length));

  // ── 3. Filter-sort bar ───────────────────────────────────────────────────
  const filterSortBar = document.createElement('div');
  filterSortBar.className = 'filter-sort-bar';

  // Filter label + select
  const filterLabel = document.createElement('label');
  filterLabel.setAttribute('for', `filter-${id}`);
  filterLabel.textContent = 'Filter:';
  filterSortBar.appendChild(filterLabel);

  const filterSelect = document.createElement('select');
  filterSelect.id = `filter-${id}`;
  filterSelect.dataset.action = 'filter-change';
  filterSelect.dataset.listId = id;
  [
    { value: 'all',       label: 'All' },
    { value: 'active',    label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === filter) opt.selected = true;
    filterSelect.appendChild(opt);
  });
  filterSortBar.appendChild(filterSelect);

  // Sort label + select
  const sortLabel = document.createElement('label');
  sortLabel.setAttribute('for', `sort-${id}`);
  sortLabel.textContent = 'Sort:';
  filterSortBar.appendChild(sortLabel);

  const sortSelect = document.createElement('select');
  sortSelect.id = `sort-${id}`;
  sortSelect.dataset.action = 'sort-change';
  sortSelect.dataset.listId = id;
  [
    { value: 'created', label: 'Date created' },
    { value: 'due',     label: 'Due date' },
  ].forEach(({ value, label }) => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    if (value === sort) opt.selected = true;
    sortSelect.appendChild(opt);
  });
  filterSortBar.appendChild(sortSelect);

  card.appendChild(filterSortBar);

  // ── 4. Task list (filtered + sorted) ────────────────────────────────────
  // Filter
  let visibleTasks = listTasks.filter(t => {
    if (filter === 'active')    return !t.completed;
    if (filter === 'completed') return t.completed === true;
    return true; // 'all'
  });

  // Sort
  visibleTasks = [...visibleTasks].sort((a, b) => {
    if (sort === 'due') {
      const aHas = Boolean(a.dueDate);
      const bHas = Boolean(b.dueDate);
      if (!aHas && !bHas) return 0;
      if (!aHas) return 1;   // a goes last
      if (!bHas) return -1;  // b goes last
      return a.dueDate < b.dueDate ? -1 : a.dueDate > b.dueDate ? 1 : 0;
    }
    // default: 'created' — sort by createdAt ascending
    return a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : 0;
  });

  const ul = document.createElement('ul');
  ul.className = 'task-list-card__tasks';
  visibleTasks.forEach(t => ul.appendChild(renderTask(t)));
  card.appendChild(ul);

  // ── 5. Add-task form ─────────────────────────────────────────────────────
  const form = document.createElement('form');
  form.className = 'add-task-form';
  form.dataset.form = 'add-task';
  form.dataset.listId = id;

  const titleLabel = document.createElement('label');
  titleLabel.setAttribute('for', `task-title-${id}`);
  titleLabel.textContent = 'New task:';
  form.appendChild(titleLabel);

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.id = `task-title-${id}`;
  titleInput.name = 'title';
  titleInput.placeholder = 'Task title';
  titleInput.maxLength = 255;
  form.appendChild(titleInput);

  const dueLabel = document.createElement('label');
  dueLabel.setAttribute('for', `task-due-${id}`);
  dueLabel.textContent = 'Due date (optional):';
  form.appendChild(dueLabel);

  const dueInput = document.createElement('input');
  dueInput.type = 'date';
  dueInput.id = `task-due-${id}`;
  dueInput.name = 'dueDate';
  form.appendChild(dueInput);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Task';
  form.appendChild(submitBtn);

  card.appendChild(form);

  return card;
}

/**
 * Renders a life-category panel containing all task list cards for one category.
 *
 * @param {{ id: string, name: string, isDefault: boolean }} categoryData
 * @param {Array<{ id: string, name: string, categoryId: string }>} taskLists - ALL task lists (filtered internally)
 * @param {Array} tasks - ALL tasks
 * @param {Object} uiState - Full _uiState object
 * @returns {HTMLElement} <section class="life-category-panel">
 */
export function renderCategory(categoryData, taskLists, tasks, uiState) {
  const { id, name, isDefault } = categoryData;

  // Filter to only the lists that belong to this category
  const categoryLists = taskLists.filter(list => list.categoryId === id);

  // Compute category-level task counts across all lists in this category
  const categoryListIds = new Set(categoryLists.map(list => list.id));
  const categoryTasks = tasks.filter(task => categoryListIds.has(task.listId));
  const totalTasksInCategory = categoryTasks.length;
  const completedTasksInCategory = categoryTasks.filter(task => task.completed).length;

  // Root section
  const section = document.createElement('section');
  section.className = 'life-category-panel';
  section.dataset.categoryId = id;

  // ── 1. Category header ──────────────────────────────────────────────────
  const header = document.createElement('div');
  header.className = 'life-category-panel__header';

  // Category name
  const heading = document.createElement('h2');
  heading.className = 'life-category-panel__name';
  heading.textContent = name;
  header.appendChild(heading);

  // Category-level progress bar
  const progressBar = renderProgressBar(completedTasksInCategory, totalTasksInCategory);
  header.appendChild(progressBar);

  // Delete button — only for non-default categories
  if (isDefault === false) {
    const deleteBtn = document.createElement('button');
    deleteBtn.dataset.action = 'delete-category';
    deleteBtn.dataset.categoryId = id;
    deleteBtn.setAttribute('aria-label', `Delete category: ${name}`);
    deleteBtn.textContent = 'Delete';
    header.appendChild(deleteBtn);
  }

  section.appendChild(header);

  // ── 2. Task list cards container ────────────────────────────────────────
  const listsContainer = document.createElement('div');
  listsContainer.className = 'life-category-panel__lists';

  for (const list of categoryLists) {
    const card = renderTaskList(list, tasks, uiState);
    listsContainer.appendChild(card);
  }

  section.appendChild(listsContainer);

  // ── 3. Add task list form ───────────────────────────────────────────────
  const form = document.createElement('form');
  form.className = 'add-list-form';
  form.dataset.form = 'add-task-list';
  form.dataset.categoryId = id;

  const label = document.createElement('label');
  label.htmlFor = `new-list-name-${id}`;
  label.textContent = 'New list name:';
  form.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `new-list-name-${id}`;
  input.name = 'name';
  input.placeholder = 'List name';
  input.maxLength = 100;
  form.appendChild(input);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add List';
  form.appendChild(submitBtn);

  section.appendChild(form);

  return section;
}

/**
 * Shows an inline validation error next to an input element.
 *
 * @param {HTMLElement} inputEl - The input to annotate
 * @param {string} message      - Error text to display
 */
export function showInlineError(inputEl, message) {
  // Find or create the sibling error span
  let errorSpan = inputEl.nextElementSibling;
  if (!errorSpan || !errorSpan.classList.contains('inline-error')) {
    errorSpan = document.createElement('span');
    errorSpan.className = 'inline-error';
    errorSpan.setAttribute('role', 'alert');
    inputEl.insertAdjacentElement('afterend', errorSpan);
  }
  errorSpan.textContent = message;
  inputEl.setAttribute('aria-invalid', 'true');
  inputEl.classList.add('input--error');
}

/**
 * Clears any inline validation error on an input element.
 *
 * @param {HTMLElement} inputEl - The input to clear
 */
export function clearInlineError(inputEl) {
  const sibling = inputEl.nextElementSibling;
  if (sibling && sibling.classList.contains('inline-error')) {
    sibling.remove();
  }
  inputEl.removeAttribute('aria-invalid');
  inputEl.classList.remove('input--error');
}

/**
 * Shows a confirmation modal.
 *
 * @param {{ title: string, message: string, confirmText: string, cancelText: string, onConfirm: function, onCancel: function }} config
 */
export function showModal(config) {
  const { title, message, confirmText, cancelText, onConfirm, onCancel } = config;

  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  // Clear previous content
  overlay.innerHTML = '';

  // Build modal structure
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-title');

  const heading = document.createElement('h2');
  heading.id = 'modal-title';
  heading.textContent = title;
  modal.appendChild(heading);

  const msgPara = document.createElement('p');
  msgPara.className = 'modal__message';
  msgPara.textContent = message;
  modal.appendChild(msgPara);

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'modal__confirm';
  confirmBtn.dataset.action = 'confirm-modal';
  confirmBtn.textContent = confirmText;
  modal.appendChild(confirmBtn);

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'modal__cancel';
  cancelBtn.dataset.action = 'cancel-modal';
  cancelBtn.textContent = cancelText;
  modal.appendChild(cancelBtn);

  overlay.appendChild(modal);

  // Store callbacks on window for the event handler to pick up
  window._pendingModalConfirm = onConfirm;
  window._pendingModalCancel = onCancel;

  // Show the overlay
  overlay.removeAttribute('hidden');

  // Focus the confirm button after the browser has rendered
  setTimeout(() => confirmBtn.focus(), 0);
}

/**
 * Hides the confirmation modal and clears pending callbacks.
 */
export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (!overlay) return;

  overlay.setAttribute('hidden', '');
  window._pendingModalConfirm = null;
  window._pendingModalCancel = null;
  overlay.innerHTML = '';
}

/**
 * Shows (or updates) a storage-warning banner at the top of the page.
 *
 * @param {string} message - Warning text to display
 */
export function showStorageWarning(message) {
  let warning = document.getElementById('storage-warning');

  if (!warning) {
    warning = document.createElement('div');
    warning.id = 'storage-warning';
    warning.setAttribute('role', 'alert');
    warning.className = 'storage-warning';
    document.body.insertBefore(warning, document.body.firstChild);
  }

  warning.textContent = message;
}

/**
 * Renders the full dashboard into #dashboard-grid.
 * Seeds default categories if none exist yet.
 *
 * @param {{ categories: Array, taskLists: Array, tasks: Array }} state
 */
export function renderDashboard(state) {
  const grid = document.getElementById('dashboard-grid');
  if (!grid) return;

  grid.innerHTML = '';

  const uiState = getUiState();

  // ── Render each category ─────────────────────────────────────────────────
  const categoryIds = new Set(state.categories.map(c => c.id));

  for (const categoryData of state.categories) {
    grid.appendChild(renderCategory(categoryData, state.taskLists, state.tasks, uiState));
  }

  // ── Uncategorised section ────────────────────────────────────────────────
  const orphanLists = state.taskLists.filter(l => !categoryIds.has(l.categoryId));
  if (orphanLists.length > 0) {
    const uncategorisedCategory = { id: '__uncategorised__', name: 'Uncategorised', isDefault: true };
    grid.appendChild(renderCategory(uncategorisedCategory, orphanLists, state.tasks, uiState));
  }

  // ── Add Category form ────────────────────────────────────────────────────
  const form = document.createElement('form');
  form.className = 'add-category-form';
  form.dataset.form = 'add-category';

  const label = document.createElement('label');
  label.htmlFor = 'new-category-name';
  label.textContent = 'New category:';
  form.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'new-category-name';
  input.name = 'name';
  input.placeholder = 'Category name';
  input.maxLength = 50;
  form.appendChild(input);

  const submitBtn = document.createElement('button');
  submitBtn.type = 'submit';
  submitBtn.textContent = 'Add Category';
  form.appendChild(submitBtn);

  grid.appendChild(form);
}
