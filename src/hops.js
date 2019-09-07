/**
 * Module hops provides hop-related calculations.
 */


/**
 * utilization returns the estimated hop utilization percentage for a given
 * wort gravity and boil time, using the Tinseth equation.
 *
 * Source: http://realbeer.com/hops/research.html
 *
 * @param {number} gravity - Average wort specific gravity throughout the boil.
 * @param {number} time - How long this hop addition is boiled, in minutes.
 */
export const utilization = (gravity, time) => (
    (1.65 * (0.000125 ** (gravity - 1))) * (1 - Math.exp(-0.04 * time)) / 4.15);

/**
 * HopAddition represents one hop addition during the boil.
 *
 * @constructor
 * @param {number} ounces - Weight of the hop addition in ounces.
 * @param {number} time - Boil time of the hop addition in minutes.
 * @param {number} aa - Alpha acid percentage of the hop addition.
 */
export class HopAddition {
  constructor(ounces, time, aa) {
    this.ounces = ounces;
    this.time = time;
    this.aa = aa;
  }
}

/**
 * ibu returns the estimated IBUs contributed by the given hop additions, using
 * the Tinseth equation.
 *
 * Source: http://realbeer.com/hops/research.html
 *
 * @param {number} gravity - Average wort specific gravity throughout the boil.
 * @param {number} gals - Final wort volume in gallons.
 * @param {Object} additions - The individual hop additions. May be instances of
 *     HopAddition or other Objects with the same properties.
 * @param {number} additions[].ounces - Weight of the hop addition in ounces.
 * @param {number} additions[].time - Boil time of the hop addition in minutes.
 * @param {number} additions[].aa - Alpha acid percentage of the hop addition.
 */
export const ibu = (og, gals, additions) => additions
    .map((a) => utilization(og, a.time) * a.ounces * a.aa * 74.90 / gals)
    .reduce((a, b) => a + b, 0);
