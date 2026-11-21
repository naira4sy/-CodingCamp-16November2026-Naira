// state.js — in-memory state object and all mutation functions

import { save, load } from './storage.js';
import { DEFAULT_LIFE_CATEGORIES } from './constants.js';

let _state = {
  categories: [],   // Array of { id, name, isDefault }
  taskLists: [],    // Array of { id, name, categoryId }
  tasks: [],        // Array of { id, title, dueDate, listId, completed, createdAt }
};

let _uiState = {
  // keyed by listId → { filter: 'all'|'active'|'completed', sort: 'created'|'due' }
};

export function getState() {
  return JSON.parse(JSON.stringify(_state));
}

export function getUiState() {
  return _uiState;
}

export function initState(loadedState) {
  if (loadedState) {
    _state = loadedState;
  }
}

export function seedDefaultCategories() {
  for (const name of DEFAULT_LIFE_CATEGORIES) {
    _state.categories.push({ id: crypto.randomUUID(), name, isDefault: true });
  }
  save(_state);
}

export function createCategory(name) {
  const id = crypto.randomUUID();
  const category = { id, name, isDefault: false };
  _state.categories.push(category);
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, category };
}

export function deleteCategory(id) {
  const category = _state.categories.find(c => c.id === id);
  if (!category) return { ok: false, error: 'Category not found.' };
  if (category.isDefault) return { ok: false, error: 'Cannot delete a default category.' };

  // Cascade: remove all task lists and their tasks belonging to this category
  const listIds = _state.taskLists.filter(l => l.categoryId === id).map(l => l.id);
  _state.tasks = _state.tasks.filter(t => !listIds.includes(t.listId));
  _state.taskLists = _state.taskLists.filter(l => l.categoryId !== id);
  _state.categories = _state.categories.filter(c => c.id !== id);

  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export function createTaskList(name, categoryId) {
  const categoryExists = _state.categories.some(c => c.id === categoryId);
  if (!categoryExists) return { ok: false, error: 'Category not found.' };
  const id = crypto.randomUUID();
  const taskList = { id, name, categoryId };
  _state.taskLists.push(taskList);
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, taskList };
}

export function renameTaskList(id, name) {
  const list = _state.taskLists.find(l => l.id === id);
  if (!list) return { ok: false, error: 'Task list not found.' };
  list.name = name;
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, taskList: list };
}

export function deleteTaskList(id) {
  const list = _state.taskLists.find(l => l.id === id);
  if (!list) return { ok: false, error: 'Task list not found.' };
  // Cascade: remove all tasks in this list
  _state.tasks = _state.tasks.filter(t => t.listId !== id);
  _state.taskLists = _state.taskLists.filter(l => l.id !== id);
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}

export function setFilter(listId, filter) {
  if (!_uiState[listId]) {
    _uiState[listId] = { filter: 'all', sort: 'created' };
  }
  _uiState[listId].filter = filter; // 'all' | 'active' | 'completed'
}

export function setSort(listId, sort) {
  if (!_uiState[listId]) {
    _uiState[listId] = { filter: 'all', sort: 'created' };
  }
  _uiState[listId].sort = sort; // 'created' | 'due'
}

export function createTask(title, dueDate, listId) {
  const listExists = _state.taskLists.some(l => l.id === listId);
  if (!listExists) return { ok: false, error: 'Task list not found.' };
  const id = crypto.randomUUID();
  const task = {
    id,
    title,
    dueDate: dueDate || null,
    listId,
    completed: false,
    createdAt: Date.now(),
  };
  _state.tasks.push(task);
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, task };
}

export function updateTask(id, title, dueDate) {
  const task = _state.tasks.find(t => t.id === id);
  if (!task) return { ok: false, error: 'Task not found.' };
  task.title = title;
  task.dueDate = dueDate || null;
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, task };
}

export function toggleTask(id) {
  const task = _state.tasks.find(t => t.id === id);
  if (!task) return { ok: false, error: 'Task not found.' };
  task.completed = !task.completed;
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true, task };
}

export function deleteTask(id) {
  const taskIdx = _state.tasks.findIndex(t => t.id === id);
  if (taskIdx === -1) return { ok: false, error: 'Task not found.' };
  _state.tasks.splice(taskIdx, 1);
  const result = save(_state);
  if (!result.ok) return { ok: false, error: result.error };
  return { ok: true };
}
