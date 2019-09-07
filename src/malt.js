var Grist = (function(g) {
  g.malt = {};

  g.malt.og = (gals, efficiency, malts, weights) => {
    const gravityPts =
        malts.map((m, idx) => weights[idx] * m.ppg).reduce((a, b) => a + b, 0);
    return (efficiency / 100) * gravityPts / (1000 * gals) + 1;
  };

  g.malt.srm = (gals, malts, weights) => {
    const colorPts = malts
        .map((m, idx) => weights[idx] * m.lovibond)
        .reduce((a, b) => a + b, 0);
    return 1.4922 * ((colorPts / gals) ** 0.6859);
  };

  g.malt.percentages = (weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    return weights.map((w) => w / total);
  };

  g.malt.calcWeights = (og, gals, efficiency, malts, percentages) => {
    const gravityPts = (og - 1) * 100000 / efficiency * gals;
    // Use proportions rather than assume the percentages sum to 100.
    const totalPercent = percentages.reduce((a, b) => a + b, 0);
    const proportions = percentages.map((pct) => pct / totalPercent);
    const contributions = malts
        .map((m, idx) => proportions[idx] * m.ppg)
        .reduce((a, b) => a + b, 0);
    const totalLbs = contributions > 0 ? gravityPoints / contributions : 0;
    return malts.map((m, idx) => proportions[idx] * totalLbs);
  };

  return g;
}(Grist || {}));
