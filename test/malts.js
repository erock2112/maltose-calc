import test from 'ava';
import {approxEqual} from './testutils.js';
import {og, srm, calcWeights} from '../src/malts.js';

test('og calculation', t => {
  const epsilon = 0.0001;

  const tc = (gals, efficiency, ppgs, weights, expect) => {
    const got = og(gals, efficiency, ppgs, weights);
    t.is(approxEqual(got, expect, epsilon), true,
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };

  tc(5,  70, [37], [10], 1.0518);
  tc(10, 70, [37], [10], 1.0259);
  tc(5,  85, [37], [10], 1.0629);
  tc(5,  85, [37], [5],  1.0315);
  tc(5,  85, [37, 20], [8, 2], 1.0571);
  tc(12, 77, [37, 38, 34, 30], [15.5, 5, 1.1, 0.4], 1.0522);
  t.throws(() => {
    og(12, 77, [], [25]);
  });
  t.throws(() => {
    og(12, 77, [37], []);
  });
});

test('srm calculation', t => {
  const epsilon = 0.001;

  const tc = (gals, lovibonds, weights, expect) => {
    const got = srm(gals, lovibonds, weights);
    t.is(approxEqual(got, expect, epsilon), true,
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };

  tc(5,  [8.9], [10], 10.752);
  tc(10, [8.9], [10], 6.684);
  tc(5,  [20],  [10], 18.736);
  tc(5,  [20],  [5],  11.647);
  tc(5,  [1.8, 60], [8, 2], 14.265);
  tc(12, [8.9, 1.5, 46, 410], [15.5, 5, 1.1, 0.4], 15.382);
  t.throws(() => {
    srm(12, [], [25]);
  });
  t.throws(() => {
    srm(12, [410], []);
  });
});

test('calcWeights', t => {
  const epsilon = 0.001;

  const tc = (og, gals, efficiency, ppgs, percentages, expect) => {
    const got = calcWeights(og, gals, efficiency, ppgs, percentages);
    t.is(expect.length, got.length);
    expect.forEach((e, idx) => {
      t.is(approxEqual(got[idx], e, epsilon), true,
           'Expected ' + got[idx] + ' to be within ' + epsilon + ' of ' + e);
    });
  };

  tc(1.040, 10, 100, [40], [100], [10]);
  tc(1.040, 10, 80, [40], [100], [12.5]);
  tc(1.040, 10, 50, [40], [100], [20]);
  tc(1.080, 10, 50, [40], [100], [40]);
  tc(1.040, 10, 50, [40, 10], [50, 50], [16, 16]);
  tc(1.050, 10, 50, [50, 30, 20], [70, 20, 10], [16.279, 4.651, 2.326]);
  tc(1.052, 12, 77, [37, 38, 34, 30], [70, 23, 5, 2],
     [15.357, 5.046, 1.097, 0.439]);
  t.throws(() => {
    calcWeights(1.040, 10, 80, [40, 20], [100]);
  });
  t.throws(() => {
    calcWeights(1.040, 10, 80, [40], [10, 90]);
  });
});
