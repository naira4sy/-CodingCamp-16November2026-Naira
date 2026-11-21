// validators.test.js — unit tests for all four validator functions
// Run with: node js/validators.test.js

import {
  validateTaskTitle,
  validateDueDate,
  validateListName,
  validateCategoryName,
} from './validators.js';

// ── Minimal test runner ───────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✓ ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${description}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message ?? 'Assertion failed');
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label ?? 'Value'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ── validateTaskTitle ─────────────────────────────────────────────────────────

console.log('\nvalidateTaskTitle');

test('empty string is invalid', () => {
  const result = validateTaskTitle('');
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('whitespace-only string is invalid', () => {
  const result = validateTaskTitle('   ');
  assertEqual(result.valid, false, 'valid');
});

test('exactly 255 characters is valid', () => {
  const title = 'a'.repeat(255);
  const result = validateTaskTitle(title);
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

test('256 characters is invalid', () => {
  const title = 'a'.repeat(256);
  const result = validateTaskTitle(title);
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('valid title returns valid=true', () => {
  const result = validateTaskTitle('Buy groceries');
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

// ── validateDueDate ───────────────────────────────────────────────────────────

console.log('\nvalidateDueDate');

test('null is valid (optional field)', () => {
  const result = validateDueDate(null);
  assertEqual(result.valid, true, 'valid');
});

test('empty string is valid (optional field)', () => {
  const result = validateDueDate('');
  assertEqual(result.valid, true, 'valid');
});

test('valid date 2024-06-15 is valid', () => {
  const result = validateDueDate('2024-06-15');
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

test('DD-MM-YYYY format is invalid', () => {
  const result = validateDueDate('15-06-2024');
  assertEqual(result.valid, false, 'valid');
});

test('YYYY/MM/DD format is invalid', () => {
  const result = validateDueDate('2024/06/15');
  assertEqual(result.valid, false, 'valid');
});

test('non-date string is invalid', () => {
  const result = validateDueDate('not-a-date');
  assertEqual(result.valid, false, 'valid');
});

test('non-existent date 2024-02-30 is invalid', () => {
  const result = validateDueDate('2024-02-30');
  assertEqual(result.valid, false, 'valid');
});

test('leap day 2024-02-29 on leap year is valid', () => {
  const result = validateDueDate('2024-02-29');
  assertEqual(result.valid, true, 'valid');
});

test('leap day 2023-02-29 on non-leap year is invalid', () => {
  const result = validateDueDate('2023-02-29');
  assertEqual(result.valid, false, 'valid');
});

// ── validateListName ──────────────────────────────────────────────────────────

console.log('\nvalidateListName');

test('empty string is invalid', () => {
  const result = validateListName('');
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('exactly 100 characters is valid', () => {
  const name = 'a'.repeat(100);
  const result = validateListName(name);
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

test('101 characters is invalid', () => {
  const name = 'a'.repeat(101);
  const result = validateListName(name);
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('valid list name returns valid=true', () => {
  const result = validateListName('My Shopping List');
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

// ── validateCategoryName ──────────────────────────────────────────────────────

console.log('\nvalidateCategoryName');

test('empty string is invalid', () => {
  const result = validateCategoryName('');
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('exactly 50 characters is valid', () => {
  const name = 'a'.repeat(50);
  const result = validateCategoryName(name);
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

test('51 characters is invalid', () => {
  const name = 'a'.repeat(51);
  const result = validateCategoryName(name);
  assertEqual(result.valid, false, 'valid');
  assert(result.message.length > 0, 'message should be non-empty');
});

test('valid category name returns valid=true', () => {
  const result = validateCategoryName('Work');
  assertEqual(result.valid, true, 'valid');
  assertEqual(result.message, '', 'message');
});

// ── Summary ───────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
