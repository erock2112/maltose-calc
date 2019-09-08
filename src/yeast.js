/**
 * Module yeast provides yeast-related calculations.
 */

/** Assumed points per pound per gallon of DME. */
const assumedExtractPPG = 42;

/**
 * Assumed yeast viability loss per day.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 */
const viabilityLossPerDay = 0.007;

/**
 * Limit the number of starter steps to prevent infinite loops in the case of
 * bad input.
 */
const _maxStarterSteps = 20;

/**
 * Number of grams per pound.
 *
 * TODO(erock2112): Move this to a 'units' or 'conversions' module.
 */
const _gramsPerPound = 453.59237;

/**
 * Number of milliseconds in a day.
 *
 * TODO(erock2112): Move this to a 'units' or 'conversions' module.
 */
const _millisPerDay = 1000*60*60*24;

/**
 * Estimated viability of a package of yeast, based on linear decay.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 *
 * @param {Date} now - Current date.
 * @param {Date} mfg - Manufacturing date.
 */
export const viability = (now, mfg) => Math.max(
    1 - viabilityLossPerDay * (now - mfg) / _millisPerDay, 0);

/**
 * Estimated number of viable cells, in billions, in a package of yeast, based
 * on linear decay.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 *
 * @param {number} cells - Original number of cells, in billions.
 * @param {Date} now - Current date.
 * @param {Date} mfg - Manufacturing date.
 */
export const viableCells = (cells, now, mfg) => cells * viability(now, mfg);

/**
 * Estimated number of viable cells, in billions, in one or more packages of
 * yeast.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 *
 * @param {Date} now - Current date.
 * @param {number[]} cellCounts - Original numbers of cells, in billions.
 * @param {Date[]} mfgDates - Manufacturing dates.
 */
export const totalViableCells = (now, cellCounts, mfgDates) => {
  if (cellCounts.length != mfgDates.length) {
    throw new Error('cellCounts must match mfgDates!');
  }
  return cellCounts
      .map((cells, idx) => viableCells(cells, now, mfgDates[idx]))
      .reduce((a, b) => a + b, 0);
};

/**
 * Number of cells, in billions, required to achieve the given pitch rate, for
 * a batch of the given gravity and size.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 *
 * @param {number} pitchRate - Desired pitch rate, in millions of cells per mL
 *     per degree plato.
 * @param {number} batchSizeLiters - Batch size, in liters.
 * @param {number} plato - Wort density, in degrees Plato.
 */
export const targetCells = (pitchRate, batchSizeLiters, plato) => (
    pitchRate * batchSizeLiters * plato);

/**
 * Growth rate, in billions of cells per gram of extract, as a function of the
 * inoculation rate.
 *
 * Source: http://braukaiser.com/blog/blog/2012/11/03/estimating-yeast-growth
 *
 * @param {number} inoculationRate - Number of pitched cells in billions per
 *     gram of extract.
 */
export const growthRateBrauKaiser = (inoculationRate) => {
  if (inoculationRate < 1.4) {
    return 1.4;
  } else if (inoculationRate < 3.5) {
    return 2.33 - 0.67 * inoculationRate;
  }
  return 0;
};

/**
 * Estimated number of cells, in billions, given a starting number of cells,
 * starter gravity, and volume.
 *
 * Source: https://brewersfriend.com/yeast-pitch-rate-and-starter-calculator
 *
 * @param {number} cells - Original number of cells, in billions.
 * @param {number} gravity - Starter wort specific gravity.
 * @param {number} gals - Starter volume, in gallons.
 *
 * TODO(erock2112): Be consistent; use plato and liters.
 */
export const starterCells = (cells, gravity, gals) => {
  const extractGrams =
      _gramsPerPound * (gravity - 1) * 1000 / assumedExtractPPG * gals;
  const growthRate = growthRateBrauKaiser(cells / extractGrams);
  return cells + growthRate * extractGrams;
};

/**
 * Derive a series of one or more starter steps to achieve a given target number
 * of cells.
 *
 * @param {number} cells - Original number of cells, in billions.
 * @param {number} targetCells - Target number of cells, in billions.
 * @param {number} gravity - Starter wort specific gravity.
 * @param {number} maxVolume - Maximum starter volume, in gallons.
 * @param {number} maxGrowthPerStep - Maximum growth ratio per step.
 *
 * TODO(erock2112): Be consistent; use plato and liters.
 */
export const starterSteps =
    (cells, targetCells, gravity, maxVolume, maxGrowthPerStep) => {
  const extractGramsPerGal =
      _gramsPerPound * (gravity - 1) * 1000 / assumedExtractPPG;
  const maxExtractGrams = extractGramsPerGal * maxVolume;
  const steps = [];
  let currentCells = cells;
  if (currentCells) {
    for (let numSteps = 0; numSteps < _maxStarterSteps; numSteps++) {
      // Determine the maximum number of cells we can achieve at this step.
      // There are three factors which may limit this number:
      // 1. Our target, which we want to reach but not exceed.
      let targetStepCells = targetCells;
      let limiter = 'target';
      // 2. Maximum growth ratio per step.
      const maxStepCellsByGrowth = currentCells * maxGrowthPerStep;
      if (targetStepCells > maxStepCellsByGrowth) {
        targetStepCells = maxStepCellsByGrowth;
        limiter = 'max growth ratio';
      }
      // 3. Maximum starter volume.
      const minInoculationRate = currentCells / maxExtractGrams;
      const maxGrowthRate = growthRateBrauKaiser(minInoculationRate);
      const maxStepCellsByVolume =
          currentCells + maxGrowthRate * maxExtractGrams;
      if (targetStepCells > maxStepCellsByVolume) {
        targetStepCells = maxStepCellsByVolume;
        limiter = 'max starter volume';
      }

      // Calculate the starter volume for this step.
      let gals = 0;

      // These cases were derived from the Braukaiser growth rate function:
      // http://braukaiser.com/blog/blog/2012/11/03/estimating-yeast-growth
      // They're re-arranged to be in terms of the current and target cell
      // counts.
      //
      // Given the following:
      //
      //   inoculationRate = currentCells / gramsDME
      //
      // And:
      //
      //   targetStepCells = currentCells + growthRate * gramsDME
      //
      // We have:
      //
      //   targetStepCells - currentCells = growthRate * gramsDME
      //   gramsDME = (targetStepCells - currentCells) / growthRate
      //
      // Therefore:
      //
      //   inoculationRate = currentCells * growthRate / (targetStepCells - currentCells)
      //
      // Case 1, inoculationRate < 1.4:
      //
      //   inoculationRate < 1.4
      //   currentCells * growthRate / (targetStepCells - currentCells) < 1.4
      //   ? currentCells * 1.4 / (targetCells - currentCells) < 1.4
      //   currentCells / (targetCells - currentCells) < 1
      //   currentCells < targetCells - currentCells
      //   2*currentCells < targetCells
      //
      // Therefore:
      //
      //   gals = gramsDME / extractGramsPerGal
      //   gals = (targetStepCells - currentCells) / (growthRate * extractGramsPerGal)
      //   gals = (targetStepCells - currentCells) / (1.4 * extractGramsPerGal)
      //
      if (2 * currentCells < targetCells) {
        gals = (targetStepCells - currentCells) / (1.4 * extractGramsPerGal);

      // Case 2, inoculationRate < 3.5; solve for gals first:
      //
      //   targetStepCells - currentCells = growthRate * extractGramsPerGal * gals
      //   targetStepCells - currentCells = (2.33 - 0.67 * inoculationRate) * extractGramsPerGal * gals
      //   targetStepCells - currentCells = (2.33 - 0.67 * currentCells / (extractGramsPerCal * gals)) * extractGramsPerGal * gals
      //   targetStepCells - currentCells = 2.33 * (extractGramsPerGal * gals) - 0.67 * currentCells
      //   targetStepCells - currentCells + 0.67 * currentCells = 2.33 * extractGramsPerGal * gals
      //   targetStepCells + (-1 + 0.67) * currentCells = 2.33 * extractGramsPerGal * gals
      //   gals = (targetStepCells - 0.33 * currentCells) / (2.33 * extractGramsPerGal)
      //
      // Now the conditional:
      //
      //   inoculationRate < 3.5
      //   currentCells / (extractGramsPerGal * gals) < 3.5
      //   currentCells / (extractGramsPerGal * (targetStepCells - 0.33 * currentCells) / (2.33 * extractGramsPerGal)) < 3.5
      //   currentCells / ((targetStepCells - 0.33 * currentCells) / 2.33) < 3.5
      //   2.33 * currentCells / (targetStepCells - 0.33 * currentCells) < 3.5
      //   2.33 * currentCells < 3.5 * (targetStepCells - 0.33 * currentCells)
      //   currentCells < (3.5 / 2.33) * (targetStepCells - 0.33 * currentCells)
      //   currentCells < (3.5 / 2.33) * targetStepCells - (0.33 * 3.5 / 2.33) * currentCells
      //   (1 + 0.33 * 3.5 / 2.33) * currentCells < (3.5 / 2.33) * targetStepCells
      //   (1 + 0.33 * 3.5 / 2.33) / (3.5 / 2.33) * currentCells < targetStepCells
      //   0.99571428571 * currentCells < targetStepCells
      //
      } else if (0.99571428571 * currentCells < targetStepCells) {
        gals = (targetStepCells - 0.33 * currentCells) / (2.33 * extractGramsPerGal);
      }
      steps.push({
        volumeGals: gals,
        limiter: limiter,
      });
      if (targetStepCells >= targetCells || gals == 0) {
        break;
      }
      currentCells = targetStepCells;
    }
  }
  return steps;
};
