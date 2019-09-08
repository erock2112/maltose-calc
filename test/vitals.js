import test from 'ava';
import {approxEqual} from './testutils.js';
import {fg, abv} from '../src/vitals.js';

test('fg calculation', (t) => {
  t.is(1.010, fg(1.050, 80));
  t.is(1.020, fg(1.050, 60));
  t.is(1.040, fg(1.050, 20));
  t.is(1.020, fg(1.100, 80));
});

test('abv calculation', (t) => {
  const epsilon = 0.001;

  const tc = (og, fg, expect) => {
    const got = abv(og, fg);
    t.is(true, approxEqual(got, expect, epsilon),
        'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };

  tc(1.050, 1.010, 5.24);
  tc(1.080, 1.000, 10.48);
  tc(1.000, 1.000, 0);
});
