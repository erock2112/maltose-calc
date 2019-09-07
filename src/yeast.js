var Grist = (function(g) {
  g.yeast = {};

  g.yeast.assumedExtractPPG = 42;
  g.yeast.viabilityLossPerDay = 0.007;

  g.yeast.viability = (now, mfg) => (
      1 - g.yeast.viabilityLossPerDay * (now - mfg / (1000*60*60*24)));

  g.yeast.viableCells = (cells, now, mfg) => (
      cells * g.yeast.viability(now, mfg));

  g.yeast.totalViableCells = (now, yeastPacks) => (
      yeastPacks
          .map((cells, mfg) => g.yeast.viableCells(cells, now, mfg))
          .reduce((a, b) => a+b, 0));

  g.yeast.targetCells = (pitchRate, batchSizeLiters, plato) => (
      pitchRate * batchSizeLiters * plato);

  // growthRate and inoculationRate in billions of cells per gram of extract.
  g.yeast.growthRateBrauKaiser(inoculationRate) => {
    if (inoculationRate < 1.4) {
      return 1.4;
    } else if (inoculationRate < 3.5) {
      return 2.33 - 0.67 * inoculationRate;
    }
    return 0;
  };

  // volume in gallons, gravity in SG.
  // TODO(erock2112): Be consistent; use plato and liters.
  g.yeast.starterCells = (cells, gravity, volume) => {
    const extractGrams = poundsToGrams(
        (gravity - 1) * 1000 / g.yeast.assumedExtractPPG * volume);
    const inoculationRate = cells / extractGrams;
    const growthRate = g.yeast.growthRateBrauKaiser(inoculationRate);
    return cells + growthRate * extractGrams;
  };

  // Limit the number of starter steps to prevent infinite loops in the case of
  // bad input.
  const _maxStarterSteps = 20;

  // volume in gallons, gravity in SG.
  // TODO(erock2112): Be consistent; use plato and liters.
  g.yeast.starterSteps = (cells, targetCells, gravity, maxVolume, maxGrowthPerStep) => {
    const extractGramsPerGal = 453.59237 * (gravity - 1) * 1000 / g.yeast.assumedExtractPPG;
    const maxExtractGrams = extractGramsPerGal * maxVolume;
    const steps = [];
    let currentCells = cells;
    if (currentCells) {
      for (let numSteps = 0; numSteps < _maxStarterSteps; numSteps++) {
        // Determine the maximum number of cells we can achieve at this step.
        let targetStepCells = targetCells;
        const maxStepCellsByGrowth = currentCells * maxGrowthPerStep;
        const minInoculationRate = currentCells / maxExtractGrams;
        const maxGrowthRate = g.yeast.growthRateBrauKaiser(minInoculationRate);
        const maxStepCellsByVolume = currentCells + maxGrowthRate * maxExtractGrams;
        let limiter = 'target';
        if (targetStepCells > maxStepCellsByGrowth) {
          targetStepCells = maxStepCellsByGrowth;
          limiter = 'max growth ratio';
        }
        if (targetStepCells > maxStepCellsByVolume) {
          targetStepCells = maxStepCellsByVolume;
          limiter = 'max starter volume';
        }

        // Calculate the starter volume for this step.
        let gals = 0;
        // TODO(erock2112): Document how we arrived at these calculations.
        if (currentCells / (targetStepCells - currentCells) < 1) {
          gals = (targetStepCells - currentCells) / (1.4 * extractGramsPerGal);
        } else if ((2.33 / 3.5 + 0.33) * currentCells < targetStepCells) {
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

  return g;
}(Grist || {}));
