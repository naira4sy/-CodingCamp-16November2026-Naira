// validators.js — pure validation functions (no DOM side-effects)
import { MAX_TASK_TITLE_LENGTH, MAX_LIST_NAME_LENGTH, MAX_CATEGORY_NAME_LENGTH } from './constants.js';

/**
 * Validates a task title.
 * @param {string} title
 * @returns {{ valid: boolean, message: string }}
 */
export function validateTaskTitle(title) {
  if (typeof title !== 'string' || title.trim().length === 0) {
    return { valid: false, message: 'Task title cannot be empty.' };
  }
  if (title.length > MAX_TASK_TITLE_LENGTH) {
    return { valid: false, message: 'Task title cannot exceed 255 characters.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates a category name.
 * @param {string} name
 * @returns {{ valid: boolean, message: string }}
 */
export function validateCategoryName(name) {
  if (!name || name.trim() === '') {
    return { valid: false, message: 'Category name cannot be empty.' };
  }
  if (name.length > MAX_CATEGORY_NAME_LENGTH) {
    return { valid: false, message: 'Category name cannot exceed 50 characters.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validates an optional due-date string.
 * @param {string|null} dateStr
 * @returns {{ valid: boolean, message: string }}
 */
export function validateDueDate(dateStr) {
  // null or empty string → optional field, always valid
  if (dateStr === null || dateStr === '') {
    return { valid: true, message: '' };
  }

  // Must match YYYY-MM-DD exactly
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return { valid: false, message: 'Due date must be in YYYY-MM-DD format.' };
  }

  // Check the date is a real calendar date by parsing it and comparing
  // Date.parse is permissive, so we verify the parts explicitly.
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return { valid: false, message: 'Due date must be in YYYY-MM-DD format.' };
  }

  return { valid: true, message: '' };
}

/**
 * Validates a list name.
 * @param {string} name
 * @returns {{ valid: boolean, message: string }}
 */
export function validateListName(name) {
  if (!name || name.trim().length === 0) {
    return { valid: false, message: 'List name cannot be empty.' };
  }
  if (name.length > MAX_LIST_NAME_LENGTH) {
    return { valid: false, message: 'List name cannot exceed 100 characters.' };
  }
  return { valid: true, message: '' };
}
