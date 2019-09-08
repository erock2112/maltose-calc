/**
 * Module vitals provides calculations related to vital statistics, eg. ABV.
 */

/**
 * fg returns the estimated final gravity.
 *
 * Source: TODO(erock2112)
 *
 * @param {number} og - Original specific gravity.
 * @param {number} attenuation - Assumed apparent attenuation.
 * @return {number} Estimated final gravity.
 */
export const fg = (og, attenuation) => (og - 1) * (1 - attenuation / 100) + 1;

/**
 * abv returns the estimated alcohol by volume.
 *
 * Source: TODO(erock2112)
 *
 * @param {number} og - Original specific gravity.
 * @param {number} fg - Final specific gravity.
 * @return {number} Estimated percentage of alcohol by volume.
 */
export const abv = (og, fg) => (og - fg) * 131;
