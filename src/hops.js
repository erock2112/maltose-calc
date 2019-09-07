var Grist = (function(g) {
  g.hops = {};

  // weights in ounces.
  // TODO(erock2112): Be consistent; use metric.
  g.hops.ibu = (og, gals, hops, weights, times) => {
    return hops.map((hop, idx) => {
      const util = ((1.65 * (0.000125 ** (og - 1))) *
          ((1 - (2.72 ** (-0.04 * times[idx]))) / 4.14));
      return util * (weights[idx] * (hop.aa / 100) * 7490) / gals;
    }).reduce((a, b) => a + b, 0);
  };

  return g;
}(Grist || {}));
