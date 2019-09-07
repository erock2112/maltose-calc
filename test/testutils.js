import test from 'ava';

export const approxEqual = (a, b, epsilon) => Math.abs(b - a) < epsilon;
