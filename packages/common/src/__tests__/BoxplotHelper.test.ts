import { computeBoxplotStats } from 'repo-depkit-common';

describe('computeBoxplotStats', () => {
  it('returns all zeros for an empty array', () => {
    expect(computeBoxplotStats([])).toEqual({ min: 0, q1: 0, median: 0, q3: 0, max: 0 });
  });

  it('returns the same value for every field on a single sample', () => {
    expect(computeBoxplotStats([5])).toEqual({ min: 5, q1: 5, median: 5, q3: 5, max: 5 });
  });

  it('computes quartiles for an odd-length dataset', () => {
    expect(computeBoxplotStats([1, 2, 3, 4, 5, 6, 7])).toEqual({
      min: 1,
      q1: 2.5,
      median: 4,
      q3: 5.5,
      max: 7,
    });
  });

  it('computes quartiles for an even-length dataset', () => {
    expect(computeBoxplotStats([1, 2, 3, 4, 5, 6, 7, 8])).toEqual({
      min: 1,
      q1: 2.75,
      median: 4.5,
      q3: 6.25,
      max: 8,
    });
  });

  it('is independent of the input order', () => {
    const sorted = [10, 12, 14, 16, 18];
    const shuffled = [18, 10, 16, 12, 14];
    expect(computeBoxplotStats(shuffled)).toEqual(computeBoxplotStats(sorted));
  });

  it('does not mutate the input array', () => {
    const values = [3, 1, 2];
    computeBoxplotStats(values);
    expect(values).toEqual([3, 1, 2]);
  });
});
