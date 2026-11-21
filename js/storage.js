// storage.js — localStorage read/write/error handling

import { STORAGE_KEY } from './constants.js';

const PROBE_KEY = '__storage_probe__';



/**
 * Checks whether localStorage is available and writable.
 * Performs a write/read/delete cycle to confirm access.
 * Returns false if blocked by SecurityError (private browsing, iframe
 * sandboxing) or if storage is full.
 *
 * @returns {boolean}
 */
export function isAvailable() {
  try {
    localStorage.setItem(PROBE_KEY, '1');
    const readBack = localStorage.getItem(PROBE_KEY);
    localStorage.removeItem(PROBE_KEY);
    return readBack === '1';
  } catch {
    return false;
  }
}

/**
 * Reads and parses the saved AppState from localStorage.
 * @returns {object|null} The parsed AppState, or null if absent or malformed.
 */
export function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Serializes `state` to JSON and persists it in localStorage.
 * @param {object} state
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function save(state) {
  try {
    const json = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, json);
    return { ok: true };
  } catch (error) {
    // Covers QuotaExceededError (Chrome/Safari) and NS_ERROR_DOM_QUOTA_REACHED (Firefox)
    const message =
      (error && error.message) ? error.message : 'Failed to save state to localStorage';
    return { ok: false, error: message };
  }
}
