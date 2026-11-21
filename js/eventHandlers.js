// eventHandlers.js — all user-interaction event handlers

import * as state from './state.js';
import * as render from './render.js';
import { validateTaskTitle, validateDueDate, validateListName, validateCategoryName } from './validators.js';

/**
 * Handles clicking the checkbox on a task item.
 * event.target should be the <input type="checkbox" data-action="toggle-task" data-task-id="...">
 */
export function onToggleTask(event) {
  const taskId = event.target.dataset.taskId;
  if (!taskId) return;

  const result = state.toggleTask(taskId);
  if (!result.ok) {
    render.showStorageWarning(result.error);
    return;
  }

  // Re-render the task item and its progress bar within 100ms
  const freshState = state.getState();
  const uiState = state.getUiState();

  const taskData = freshState.tasks.find(t => t.id === taskId);
  if (!taskData) return;

  // Replace the task item <li>
  const oldLi = event.target.closest('li.task-item');
  if (oldLi && oldLi.parentNode) {
    const newLi = render.renderTask(taskData);
    oldLi.parentNode.replaceChild(newLi, oldLi);
  }

  // Update the progress bar in the parent task-list-card
  const card = event.target.closest('.task-list-card') || (oldLi && oldLi.closest('.task-list-card'));
  if (card) {
    const listId = taskData.listId;
    const listTasks = freshState.tasks.filter(t => t.listId === listId);
    const completedCount = listTasks.filter(t => t.completed).length;
    const oldBar = card.querySelector('.progress-bar');
    if (oldBar && oldBar.parentNode) {
      const newBar = render.renderProgressBar(completedCount, listTasks.length);
      oldBar.parentNode.replaceChild(newBar, oldBar);
    }
  }
}

/**
 * Handles the "add task" form submission.
 * event.target should be the <form data-form="add-task" data-list-id="...">
 */
export function onAddTask(event) {
  event.preventDefault();
  const form = event.target;
  const listId = form.dataset.listId;
  const titleInput = form.querySelector('input[name="title"]');
  const dueDateInput = form.querySelector('input[name="dueDate"]');

  const title = titleInput.value.trim();
  const dueDate = dueDateInput ? dueDateInput.value.trim() : '';

  // Validate
  const titleResult = validateTaskTitle(title);
  const dateResult = validateDueDate(dueDate);

  render.clearInlineError(titleInput);
  if (dueDateInput) render.clearInlineError(dueDateInput);

  let isValid = true;
  if (!titleResult.valid) {
    render.showInlineError(titleInput, titleResult.message);
    isValid = false;
  }
  if (!dateResult.valid) {
    render.showInlineError(dueDateInput, dateResult.message);
    isValid = false;
  }
  if (!isValid) return;

  // Create the task
  const result = state.createTask(title, dueDate || null, listId);
  if (!result.ok) {
    render.showStorageWarning(result.error);
    return;
  }

  // Clear the form
  form.reset();

  // Re-render the affected task list card
  const freshState = state.getState();
  const uiState = state.getUiState();
  const listData = freshState.taskLists.find(l => l.id === listId);
  if (listData) {
    const card = form.closest('.task-list-card');
    if (card && card.parentNode) {
      const newCard = render.renderTaskList(listData, freshState.tasks, uiState);
      card.parentNode.replaceChild(newCard, card);
    }
  }
}

/**
 * Handles <form data-form="add-category"> submission.
 */
export function onAddCategory(event) {
  event.preventDefault();
  const form = event.target;
  const nameInput = form.querySelector('input[name="name"]');
  const name = nameInput.value.trim();

  render.clearInlineError(nameInput);
  const validateResult = validateCategoryName(name);
  if (!validateResult.valid) {
    render.showInlineError(nameInput, validateResult.message);
    return;
  }

  const result = state.createCategory(name);
  if (!result.ok) {
    render.showStorageWarning(result.error);
    return;
  }

  form.reset();
  // Full dashboard re-render
  render.renderDashboard(state.getState());
}

/**
 * Handles click on a delete-category button.
 */
export function onDeleteCategory(event) {
  const categoryId = event.target.dataset.categoryId;
  const freshState = state.getState();
  const category = freshState.categories.find(c => c.id === categoryId);
  if (!category) return;

  if (category.isDefault) {
    // Should not happen (UI hides the button), but guard anyway
    return;
  }

  // Count lists and tasks that will be deleted
  const listsToDelete = freshState.taskLists.filter(l => l.categoryId === categoryId);
  const tasksToDelete = freshState.tasks.filter(t =>
    listsToDelete.some(l => l.id === t.listId)
  );

  render.showModal({
    title: 'Delete Category',
    message: `Delete "${category.name}"? This will permanently delete ${listsToDelete.length} list(s) and ${tasksToDelete.length} task(s).`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => {
      const result = state.deleteCategory(categoryId);
      if (!result.ok) { render.showStorageWarning(result.error); return; }
      // Full dashboard re-render
      render.renderDashboard(state.getState());
    },
    onCancel: () => {},
  });
}

/**
 * Handles filter select change.
 * event.target: <select data-action="filter-change" data-list-id="ID">
 */
export function onFilterChange(event) {
  const listId = event.target.dataset.listId;
  const filter = event.target.value; // 'all' | 'active' | 'completed'
  
  state.setFilter(listId, filter);
  
  // Re-render the task list card
  const freshState = state.getState();
  const uiState = state.getUiState();
  const listData = freshState.taskLists.find(l => l.id === listId);
  if (!listData) return;
  
  const card = event.target.closest('.task-list-card');
  if (card && card.parentNode) {
    card.parentNode.replaceChild(render.renderTaskList(listData, freshState.tasks, uiState), card);
  }
}

/**
 * Handles sort select change.
 * event.target: <select data-action="sort-change" data-list-id="ID">
 */
export function onSortChange(event) {
  const listId = event.target.dataset.listId;
  const sort = event.target.value; // 'created' | 'due'
  
  state.setSort(listId, sort);
  
  // Re-render the task list card
  const freshState = state.getState();
  const uiState = state.getUiState();
  const listData = freshState.taskLists.find(l => l.id === listId);
  if (!listData) return;
  
  const card = event.target.closest('.task-list-card');
  if (card && card.parentNode) {
    card.parentNode.replaceChild(render.renderTaskList(listData, freshState.tasks, uiState), card);
  }
}

/**
 * Handles clicking the confirm button in the modal.
 * Executes the pending action stored in window._pendingModalConfirm, then hides the modal.
 */
export function onConfirmModal(event) {
  if (typeof window._pendingModalConfirm === 'function') {
    window._pendingModalConfirm();
  }
  render.hideModal();
}

/**
 * Handles clicking the cancel button in the modal.
 * Discards the pending action and hides the modal.
 */
export function onCancelModal(event) {
  if (typeof window._pendingModalCancel === 'function') {
    window._pendingModalCancel();
  }
  render.hideModal();
}

/**
 * Handles clicking the "Edit" button on a task item.
 * Replaces the <li> contents with an inline edit form.
 * event.target should be the <button data-action="edit-task" data-task-id="...">
 */
export function onEditTask(event) {
  const taskId = event.target.dataset.taskId;
  if (!taskId) return;

  const taskData = state.getState().tasks.find(t => t.id === taskId);
  if (!taskData) return;

  const li = event.target.closest('li.task-item');
  if (!li) return;

  // Build the inline edit form
  const form = document.createElement('form');
  form.className = 'task-item__edit-form';
  form.dataset.form = 'save-task';
  form.dataset.taskId = taskId;

  // Title label + input
  const titleLabel = document.createElement('label');
  titleLabel.setAttribute('for', `edit-title-${taskId}`);
  titleLabel.textContent = 'Title:';
  form.appendChild(titleLabel);

  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.id = `edit-title-${taskId}`;
  titleInput.name = 'title';
  titleInput.value = taskData.title;
  titleInput.maxLength = 255;
  form.appendChild(titleInput);

  // Due date label + input
  const dueLabel = document.createElement('label');
  dueLabel.setAttribute('for', `edit-due-${taskId}`);
  dueLabel.textContent = 'Due date:';
  form.appendChild(dueLabel);

  const dueInput = document.createElement('input');
  dueInput.type = 'date';
  dueInput.id = `edit-due-${taskId}`;
  dueInput.name = 'dueDate';
  dueInput.value = taskData.dueDate || '';
  form.appendChild(dueInput);

  // Save button
  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';
  form.appendChild(saveBtn);

  // Cancel button
  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.dataset.action = 'cancel-edit';
  cancelBtn.dataset.taskId = taskId;
  cancelBtn.textContent = 'Cancel';
  form.appendChild(cancelBtn);

  // Replace the <li> contents with the form
  li.innerHTML = '';
  li.appendChild(form);
}

/**
 * Handles submission of the inline "save-task" edit form.
 * event.target should be <form data-form="save-task" data-task-id="...">
 */
export function onSaveTask(event) {
  event.preventDefault();
  const form = event.target;
  const taskId = form.dataset.taskId;

  const titleInput = form.querySelector('input[name="title"]');
  const dueInput = form.querySelector('input[name="dueDate"]');

  const title = titleInput.value.trim();
  const dueDate = dueInput ? dueInput.value.trim() : '';

  // Validate
  const titleResult = validateTaskTitle(title);
  const dateResult = validateDueDate(dueDate);

  render.clearInlineError(titleInput);
  if (dueInput) render.clearInlineError(dueInput);

  let isValid = true;
  if (!titleResult.valid) {
    render.showInlineError(titleInput, titleResult.message);
    isValid = false;
  }
  if (!dateResult.valid) {
    render.showInlineError(dueInput, dateResult.message);
    isValid = false;
  }
  if (!isValid) return;

  // Persist the update
  const result = state.updateTask(taskId, title, dueDate || null);
  if (!result.ok) {
    render.showStorageWarning(result.error);
    return;
  }

  // Re-render the whole task-list card
  const freshState = state.getState();
  const uiState = state.getUiState();
  const updatedTask = freshState.tasks.find(t => t.id === taskId);
  if (!updatedTask) return;

  const card = form.closest('.task-list-card');
  if (card && card.parentNode) {
    const listData = freshState.taskLists.find(l => l.id === updatedTask.listId);
    if (listData) {
      const newCard = render.renderTaskList(listData, freshState.tasks, uiState);
      card.parentNode.replaceChild(newCard, card);
    }
  }
}

/**
 * Handles clicking the "Cancel" button inside an inline edit form.
 * Restores the original task <li> from current state.
 * event.target should be <button data-action="cancel-edit" data-task-id="...">
 */
export function onCancelEdit(event) {
  const taskId = event.target.dataset.taskId;
  if (!taskId) return;

  const taskData = state.getState().tasks.find(t => t.id === taskId);
  if (!taskData) return;

  const li = event.target.closest('li');
  if (!li || !li.parentNode) return;

  const freshLi = render.renderTask(taskData);
  li.parentNode.replaceChild(freshLi, li);
}

/**
 * Handles clicking the "Delete" button on a task item.
 * Shows a confirmation modal; on confirm, deletes the task and re-renders the card.
 * event.target should be <button data-action="delete-task" data-task-id="...">
 */
export function onDeleteTask(event) {
  const taskId = event.target.dataset.taskId;
  if (!taskId) return;

  const taskData = state.getState().tasks.find(t => t.id === taskId);
  if (!taskData) return;

  // Capture the card reference before the modal opens (it may be lost after confirm)
  const card = event.target.closest('.task-list-card');

  render.showModal({
    title: 'Delete Task',
    message: 'Delete this task?',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => {
      render.hideModal();
      const result = state.deleteTask(taskId);
      if (!result.ok) {
        render.showStorageWarning(result.error);
        return;
      }

      // Re-render the task list card
      if (card && card.parentNode) {
        const freshState = state.getState();
        const uiState = state.getUiState();
        const listData = freshState.taskLists.find(l => l.id === taskData.listId);
        if (listData) {
          const newCard = render.renderTaskList(listData, freshState.tasks, uiState);
          card.parentNode.replaceChild(newCard, card);
        }
      }
    },
    onCancel: () => {
      render.hideModal();
    },
  });
}

/**
 * Re-renders the life-category-panel section for the given categoryId.
 * Not exported — internal helper shared by task-list handlers.
 */
function _rerenderCategoryPanel(categoryId) {
  const freshState = state.getState();
  const uiState = state.getUiState();
  const catData = freshState.categories.find(c => c.id === categoryId);
  if (!catData) return;
  const panel = document.querySelector(`section.life-category-panel[data-category-id="${categoryId}"]`);
  if (panel && panel.parentNode) {
    panel.parentNode.replaceChild(
      render.renderCategory(catData, freshState.taskLists, freshState.tasks, uiState),
      panel
    );
  }
}

/**
 * Handles the "add task list" form submission.
 * event.target should be <form data-form="add-task-list" data-category-id="ID">
 */
export function onAddTaskList(event) {
  event.preventDefault();
  const form = event.target;
  const categoryId = form.dataset.categoryId;
  const nameInput = form.querySelector('input[name="name"]');
  const name = nameInput.value.trim();

  render.clearInlineError(nameInput);
  const result = validateListName(name);
  if (!result.valid) {
    render.showInlineError(nameInput, result.message);
    return;
  }

  const createResult = state.createTaskList(name, categoryId);
  if (!createResult.ok) {
    render.showStorageWarning(createResult.error);
    return;
  }

  form.reset();
  _rerenderCategoryPanel(categoryId);
}

/**
 * Handles clicking a rename-task-list button.
 * event.target should have data-action="rename-task-list" data-list-id="ID"
 * Replaces the h3 inside the card header with an inline rename form.
 */
export function onRenameTaskList(event) {
  const listId = event.target.dataset.listId;
  const freshState = state.getState();
  const list = freshState.taskLists.find(l => l.id === listId);
  if (!list) return;

  // Replace the h3 with an inline rename form
  const header = event.target.closest('.task-list-card__header');
  if (!header) return;
  const h3 = header.querySelector('h3');
  if (!h3) return;

  const form = document.createElement('form');
  form.dataset.form = 'rename-task-list';
  form.dataset.listId = listId;

  const renameLabel = document.createElement('label');
  renameLabel.setAttribute('for', `rename-list-${listId}`);
  renameLabel.textContent = 'List name:';
  form.appendChild(renameLabel);

  const input = document.createElement('input');
  input.type = 'text';
  input.id = `rename-list-${listId}`;
  input.name = 'name';
  input.value = list.name;
  input.maxLength = 100;

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.dataset.action = 'cancel-rename-list';
  cancelBtn.dataset.listId = listId;
  cancelBtn.textContent = 'Cancel';

  form.appendChild(input);
  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);
  header.replaceChild(form, h3);
}

/**
 * Handles submission of the inline rename-task-list form.
 * event.target should be <form data-form="rename-task-list" data-list-id="ID">
 */
export function onSaveRenameTaskList(event) {
  event.preventDefault();
  const form = event.target;
  const listId = form.dataset.listId;
  const input = form.querySelector('input[name="name"]');
  const name = input.value.trim();

  render.clearInlineError(input);
  const validateResult = validateListName(name);
  if (!validateResult.valid) {
    render.showInlineError(input, validateResult.message);
    return;
  }

  const result = state.renameTaskList(listId, name);
  if (!result.ok) {
    render.showStorageWarning(result.error);
    return;
  }

  // Re-render the whole task-list-card
  const freshState = state.getState();
  const uiState = state.getUiState();
  const listData = freshState.taskLists.find(l => l.id === listId);
  const card = form.closest('.task-list-card');
  if (card && card.parentNode && listData) {
    card.parentNode.replaceChild(render.renderTaskList(listData, freshState.tasks, uiState), card);
  }
}

/**
 * Handles clicking a delete-task-list button.
 * event.target should have data-action="delete-task-list" data-list-id="ID"
 */
export function onDeleteTaskList(event) {
  const listId = event.target.dataset.listId;
  const freshState = state.getState();
  const list = freshState.taskLists.find(l => l.id === listId);
  if (!list) return;

  const categoryId = list.categoryId;
  render.showModal({
    title: 'Delete List',
    message: `Delete "${list.name}"? All tasks in this list will be permanently deleted.`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
    onConfirm: () => {
      const result = state.deleteTaskList(listId);
      if (!result.ok) { render.showStorageWarning(result.error); return; }
      _rerenderCategoryPanel(categoryId);
    },
    onCancel: () => {},
  });
}
