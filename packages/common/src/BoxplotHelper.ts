/** Five-number summary used to render a boxplot. */
export type BoxplotStats = {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
};

/**
 * Computes boxplot statistics (min, quartiles, max) from a list of numeric samples.
 * Quartiles are interpolated linearly between the closest ranks (the method used by
 * Excel's PERCENTILE.INC / numpy's default "linear" interpolation), so results match
 * what most people expect from a boxplot without pulling in a stats library.
 */
export function computeBoxplotStats(values: number[]): BoxplotStats {
  if (values.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);

  // `lower`/`upper` are always valid indices into `sorted` here: `p` is only ever
  // called with 0.25/0.5/0.75, and `sorted.length >= 1` (empty case returned above).
  // The non-null assertions below just satisfy `noUncheckedIndexedAccess`.
  const percentile = (p: number): number => {
    const index = p * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return sorted[lower]!;
    const weight = index - lower;
    return sorted[lower]! + (sorted[upper]! - sorted[lower]!) * weight;
  };

  return {
    min: sorted[0]!,
    q1: percentile(0.25),
    median: percentile(0.5),
    q3: percentile(0.75),
    max: sorted.at(-1)!,
  };
}
