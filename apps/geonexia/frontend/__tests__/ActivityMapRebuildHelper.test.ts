/**
 * Tests for ActivityMapRebuildHelper – enclosed-tile and walked-tile computation.
 *
 * This suite uses the fixture `activityWithInterpolatedGpsPoints.json` which
 * describes a ~3.9 km loop run where the runner stopped short of the start
 * point; the final 11 GPS points are flagged as `interpolated` to bridge the
 * remaining gap.  The key invariants are:
 *
 *  1. All tiles in `hexTilesOrdered` must be counted as *walked* tiles.
 *  2. The route forms a closed loop (first ↔ last tile within
 *     MAX_LOOP_CLOSURE_GRID_DISTANCE grid steps), so enclosed tiles inside
 *     the loop must be computed and counted, even though the runner did not
 *     physically return to the exact starting tile.
 */

import { findEnclosedCellsFromHexTiles, rebuildMapFromActivities } from '../helpers/ActivityMapRebuildHelper';
import { isAvailable as isH3Available } from '../helpers/H3Helper';
import type { SavedActivity } from '../helpers/ActivityStorage';

// ─── Fixture ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-require-imports
const activityFixture: SavedActivity = require('./activityWithInterpolatedGpsPoints.json');

// ─── Sanity checks on the fixture itself ─────────────────────────────────────

describe('ActivityMapRebuildHelper – fixture sanity', () => {
	it('fixture loads correctly and has routePoints', () => {
		expect(activityFixture).toBeDefined();
		expect(Array.isArray(activityFixture.routePoints)).toBe(true);
		expect(activityFixture.routePoints.length).toBeGreaterThan(0);
	});

	it('fixture contains interpolated GPS points', () => {
		const interpolatedCount = activityFixture.routePoints.filter(
			(p) => p.interpolated === true,
		).length;
		expect(interpolatedCount).toBeGreaterThan(0);
	});

	it('fixture has hexTilesOrdered with at least 3 entries', () => {
		expect(Array.isArray(activityFixture.hexTilesOrdered)).toBe(true);
		expect((activityFixture.hexTilesOrdered ?? []).length).toBeGreaterThanOrEqual(3);
	});
});

// ─── findEnclosedCellsFromHexTiles ───────────────────────────────────────────

describe('ActivityMapRebuildHelper – findEnclosedCellsFromHexTiles with interpolated route', () => {
	it('H3 library is available', () => {
		expect(isH3Available()).toBe(true);
	});

	it('returns enclosed tiles for a loop route whose start and end are not immediately adjacent', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const enclosed = findEnclosedCellsFromHexTiles(hexTiles, resolution);

		// The route forms a visual loop through the Osnabrück area; there should
		// be at least one hex tile enclosed inside the loop.
		expect(enclosed.length).toBeGreaterThan(0);
	});

	it('enclosed tiles do not overlap with walked tiles', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const enclosed = findEnclosedCellsFromHexTiles(hexTiles, resolution);
		const walkedSet = new Set(hexTiles);

		for (const cell of enclosed) {
			expect(walkedSet.has(cell)).toBe(false);
		}
	});
});

// ─── rebuildMapFromActivities ─────────────────────────────────────────────────

describe('ActivityMapRebuildHelper – rebuildMapFromActivities with interpolated route', () => {
	let records: ReturnType<typeof rebuildMapFromActivities>['records'];

	beforeAll(() => {
		// Strip pre-computed enclosed tiles so the rebuild recomputes them from
		// hexTilesOrdered (exercising the fallback path in rebuildMapFromActivities).
		const activityWithoutComputed: SavedActivity = {
			...activityFixture,
			computed: activityFixture.computed
				? { ...activityFixture.computed, enclosedHexTiles: [] }
				: undefined,
			enclosedHexTiles: [],
		};

		({ records } = rebuildMapFromActivities([activityWithoutComputed]));
	});

	it('all walked tiles (hexTilesOrdered) appear in the records', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		for (const hexId of hexTiles) {
			expect(records[hexId]).toBeDefined();
			expect(records[hexId].visitCount).toBeGreaterThan(0);
		}
	});

	it('walked tile count matches hexTilesOrdered length', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const walkedCount = Object.values(records).filter((r) => r.visitCount > 0).length;
		// Each unique hexId in hexTilesOrdered contributes one walked record.
		const uniqueWalked = new Set(hexTiles).size;
		expect(uniqueWalked).toBe(25); // fixture has exactly 25 unique walked tiles
		expect(walkedCount).toBe(uniqueWalked);
	});

	it('at least one enclosed tile is counted', () => {
		const enclosedCount = Object.values(records).filter(
			(r) => r.enclosedCount > 0 && r.visitCount === 0,
		).length;
		expect(enclosedCount).toBeGreaterThan(0);
	});

	it('enclosed tiles in records match those returned by findEnclosedCellsFromHexTiles', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const directlyComputed = new Set(findEnclosedCellsFromHexTiles(hexTiles, resolution));
		const fromRecords = new Set(
			Object.values(records)
				.filter((r) => r.enclosedCount > 0 && r.visitCount === 0)
				.map((r) => r.h3Index),
		);

		// Every tile returned by findEnclosedCellsFromHexTiles should appear as
		// an enclosed-only record in the rebuild result.
		for (const cell of directlyComputed) {
			expect(fromRecords.has(cell)).toBe(true);
		}
		expect(fromRecords.size).toBe(directlyComputed.size);
	});

	it('enclosed tiles have lastEnclosedAt set and lastVisitedAt null', () => {
		const enclosedOnlyRecords = Object.values(records).filter(
			(r) => r.enclosedCount > 0 && r.visitCount === 0,
		);
		for (const rec of enclosedOnlyRecords) {
			expect(rec.lastEnclosedAt).not.toBeNull();
			expect(rec.lastVisitedAt).toBeNull();
		}
	});

	it('walked tiles have lastVisitedAt set', () => {
		const walkedRecords = Object.values(records).filter((r) => r.visitCount > 0);
		for (const rec of walkedRecords) {
			expect(rec.lastVisitedAt).not.toBeNull();
		}
	});
});
