import test from 'ava';
import {approxEqual} from './testutils.js';
import {viability, viableCells, totalViableCells, targetCells, starterCells,
        starterSteps} from '../src/yeast.js';

test('viability', t => {
  const epsilon = 0.001;
  const now = new Date(2019, 10, 7);
  const tc = (mfg, expect) => {
    const got = viability(now, mfg);
    t.is(true, approxEqual(got, expect, epsilon),
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };
  tc(now, 1);
  tc(new Date(2019, 10, 6), 0.993);
  tc(new Date(2019, 9, 1), 0.741);
  tc(new Date(2019, 5, 17), 0);
  tc(new Date(2019, 5, 18), 0.006);
  tc(new Date(2018, 1, 1), 0);
});

test('viable cell count', t => {
  const epsilon = 0.01;
  const now = new Date(2019, 10, 7);
  const tc = (cells, mfg, expect) => {
    const got = viableCells(cells, now, mfg);
    t.is(true, approxEqual(got, expect, epsilon),
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };
  tc(100, now, 100);
  tc(100, new Date(2019, 10, 6), 99.3);
  tc(100, new Date(2019, 9, 1), 74.07);
  tc( 50, new Date(2019, 9, 1), 37.04);
  tc(100, new Date(2019, 5, 17), 0);
  tc(100, new Date(2019, 5, 18), 0.57);
  tc(100, new Date(2018, 1, 1), 0);
});

test('total viable cells', t => {
  const epsilon = 0.01;
  const now = new Date(2019, 10, 7);
  const tc = (cellCounts, mfgDates, expect) => {
    const got = totalViableCells(now, cellCounts, mfgDates);
    t.is(true, approxEqual(got, expect, epsilon),
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };
  tc([100], [now], 100);
  tc([100], [new Date(2019, 9, 1)], 74.07);
  tc([100, 100], [now, new Date(2019, 9, 1)], 174.07);
});

test('target cells', t => {
  const epsilon = 0.01;
  const tc = (pitchRate, liters, plato, expect) => {
    const got = targetCells(pitchRate, liters, plato);
    t.is(true, approxEqual(got, expect, epsilon),
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };
  tc(1.75, 37.8541, 12, 794.94);
  tc(1.75, 20,      12, 420);
  tc(1.0,  20,      12, 240);
  tc(1.0,  20,      18, 360);
  tc(0.75, 40,      14, 420);
});

test('starter cells', t => {
  const epsilon = 0.01;
  const tc = (cells, gravity, gals, expect) => {
    const got = starterCells(cells, gravity, gals);
    t.is(true, approxEqual(got, expect, epsilon),
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };
  tc(100, 1.036, 1, 644.31);
  tc(100, 1.045, 1, 780.39);
  tc( 50, 1.036, 1, 594.31);
  tc(100, 1.036, 2, 1188.62);
});

test('starter steps', t => {
  const epsilon = 0.01;
  const tc =
      (cells, targetCells, gravity, maxVolume, maxGrowthPerStep, expect) => {
    const got = starterSteps(
        cells, targetCells, gravity, maxVolume, maxGrowthPerStep);
    t.is(expect.length, got.length);
    expect.forEach((e, idx) => {
      t.is(e.limiter, got[idx].limiter);
      t.is(true, approxEqual(got[idx].volumeGals, e.volumeGals, epsilon),
           'Expected ' + got[idx].volumeGals + ' to be within ' + epsilon +
           ' of ' + e.volumeGals);
    });
  };

  // We already have enough (or too many) cells.
  tc(100, 100, 1.036, 100, 100, []);
  tc(100, 50,  1.036, 100, 100, []);

  // Growth rate of 1.4 billion cells per gram of extract.
  tc(100, 819, 1.036, 100, 100, [{volumeGals: 1.32, limiter: 'target'}]);

  // A ratio of 2 is the cutoff between the two pieces of the function. W
  tc( 99.9999, 200, 1.036, 100, 100, [{volumeGals: 0.18, limiter: 'target'}]);
  tc(100,      200, 1.036, 100, 100, [{volumeGals: 0.18, limiter: 'target'}]);
  tc(100.0001, 200, 1.036, 100, 100, [{volumeGals: 0.18, limiter: 'target'}]);

  // Multiple steps are required.
  tc(100, 819, 1.036, 1, 10, [
      {volumeGals: 1, limiter: 'max starter volume'},
      {volumeGals: 0.67, limiter: 'target'}]);
  tc(100, 2000, 1.036, 3, 4, [
      {volumeGals: 0.55, limiter: 'max growth ratio'},
      {volumeGals: 2.20, limiter: 'max growth ratio'},
      {volumeGals: 1.62, limiter: 'target'}]);

});
