import test from 'ava';
import {approxEqual} from './testutils.js';
import {HopAddition, ibu} from '../src/hops.js';

test('ibu calculation', t => {
  const epsilon = 0.0001;

  let og = 1.050;
  let gals = 5;

  const tc = (additions, expect) => {
    let got = ibu(og, gals, additions);
    t.is(approxEqual(got, expect, epsilon), true,
         'Expected ' + got + ' to be within ' + epsilon + ' of ' + expect);
  };

  const a1 = new HopAddition(1, 60, 5);
  tc([a1], 17.2767);

  a1.time = 30;
  tc([a1], 13.2776);

  og = 1.080;
  tc([a1], 10.1397);

  gals = 2;
  tc([a1], 25.3494);

  a1.ounces = 2;
  tc([a1], 50.6987);

  tc([a1, a1], 101.3974);
});
