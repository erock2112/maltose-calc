/**
 * Shared test utilities.
 */

import test from 'ava';

/**
 * Return true iff the difference between a and b is less than the given value.
 *
 * @param {number} a - The first value.
 * @param {number} b - The second value.
 * @param {number} epsilon - The maximum differance between a and b.
 * @return {boolean} Whether or not a and b are approximately equal.
 */
export const approxEqual = (a, b, epsilon) => Math.abs(b - a) < epsilon;

test('approx equal', (t) => {
  t.is(true, approxEqual(10, 20, 100));
  t.is(true, approxEqual(13, 14, 2));
  t.is(false, approxEqual(13, 14, 0.1));
});
