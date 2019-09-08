/**
 * Module malts provides malt and fermentable-related calculations.
 */

/**
 * og returns the estimated original gravity given the provided parameters.
 *
 * Source: TODO(erock2112)
 *
 * @param {number} gals - Batch size in gallons.
 * @param {number} efficiency - Assumed brewhouse efficiency percentage.
 * @param {number[]} ppgs - Gravity points per pound per gallon of each malt.
 * @param {number[]} weights - Weight in pounds of each malt.
 * @return {number} Estimated original gravity.
 */
export const og = (gals, efficiency, ppgs, weights) => {
  if (ppgs.length != weights.length) {
    throw new Error('Weights must match ppgs!');
  }
  const gravityPts = weights
      .map((w, idx) => w * ppgs[idx])
      .reduce((a, b) => a + b, 0);
  return (efficiency / 100) * gravityPts / (1000 * gals) + 1;
};

/**
 * srm returns the estimated wort color in SRM.
 *
 * Source: TODO(erock2112)
 *
 * @param{number} gals - Batch size in gallons.
 * @param{number[]} lovibonds - Color of each malt in degrees Lovibond.
 * @param{number[]} weights - Weight in pounds of each malt.
 * @return {number} Estimated wort color in SRM.
 */
export const srm = (gals, lovibonds, weights) => {
  if (lovibonds.length != weights.length) {
    throw new Error('Weights must match lovibonds!');
  }
  const colorPts = weights
      .map((w, idx) => w * (lovibonds[idx] || 0))
      .reduce((a, b) => a + b, 0);
  return 1.4922 * ((colorPts / gals) ** 0.6859);
};

/**
 * fractions returns an array indicating what fraction of the sum of the
 * elements each element comprises.
 *
 * @param {number[]} values - The individual numerical values.
 * @return {number[]} The percentage of each of the values.
 */
export const fractions = (values) => {
  const total = values.reduce((a, b) => a + b, 0);
  return values.map((v) => v / total);
};

/**
 * calcWeights returns the weights of the malts in pounds, given the desired
 * wort gravity, batch size, assumed efficiency, and percentages.
 *
 * @param {number} og - Target original wort gravity.
 * @param {number} gals - Batch size in gallons.
 * @param {number} efficiency - Assumed brewhouse efficiency percentage.
 * @param {number[]} ppgs - Gravity points per pound per gallon of each malt.
 * @param {number[]} percentages - Relative percentages of malts.
 * @return {number[]} Weights of the given malts, in pounds.
 */
export const calcWeights = (og, gals, efficiency, ppgs, percentages) => {
  if (ppgs.length != percentages.length) {
    throw new Error('Percentages must match ppgs!');
  }
  const gravityPts = (og - 1) * 100000 / efficiency * gals;
  // Use fractions rather than assume the percentages sum to 100.
  const fracts = fractions(percentages);
  const contributions = ppgs
      .map((ppg, idx) => ppg * (fracts[idx] || 0))
      .reduce((a, b) => a + b, 0);
  const totalLbs = contributions > 0 ? gravityPts / contributions : 0;
  return fracts.map((fraction) => fraction * totalLbs);
};
