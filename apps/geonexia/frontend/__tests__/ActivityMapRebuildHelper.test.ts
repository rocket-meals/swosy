/**
 * Tests for ActivityMapRebuildHelper – enclosed-tile and walked-tile computation.
 *
 * This suite uses the fixture `activityWithInterpolatedGpsPoints.json` which
 * describes a ~3.9 km loop run where the runner stopped short of the start
 * point; the final 11 GPS points are flagged as `interpolated` to bridge the
 * remaining gap.  The key invariants are:
 *
 *  1. All tiles in `hexTilesOrdered` must be counted as *walked* tiles.
 *  2. When `buildFullRouteTileIds` is used to include the interpolated GPS
 *     tiles, the first and last tile of the complete route ARE immediate
 *     neighbours, so `findEnclosedCellsFromHexTiles` detects the closed loop
 *     and correctly counts enclosed tiles inside it.
 */

import { findEnclosedCellsFromHexTiles, buildFullRouteTileIds, rebuildMapFromActivities } from '../helpers/ActivityMapRebuildHelper';
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

// ─── buildFullRouteTileIds ────────────────────────────────────────────────────

describe('ActivityMapRebuildHelper – buildFullRouteTileIds', () => {
	it('H3 library is available', () => {
		expect(isH3Available()).toBe(true);
	});

	it('result contains more tiles than hexTilesOrdered alone', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);

		// Interpolated GPS points should add new tiles beyond the walked set.
		expect(full.length).toBeGreaterThan(hexTiles.length);
	});

	it('result starts with all walked tiles in the same order', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);

		for (let i = 0; i < hexTiles.length; i++) {
			expect(full[i]).toBe(hexTiles[i]);
		}
	});

	it('first and last tiles of the full route are immediate neighbours', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);
		const first = full[0];
		const last = full[full.length - 1];

		// With interpolated tiles bridging the gap the route forms a closed loop.
		expect(first).not.toBe(last);
		// Import areNeighborCells via H3Helper
		// eslint-disable-next-line @typescript-eslint/no-require-imports
		const { areNeighborCells } = require('../helpers/H3Helper');
		expect(areNeighborCells(first, last)).toBe(true);
	});
});

// ─── findEnclosedCellsFromHexTiles ───────────────────────────────────────────

describe('ActivityMapRebuildHelper – findEnclosedCellsFromHexTiles with full route (incl. interpolated)', () => {
	it('returns enclosed tiles when the full route tile list is used', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;
		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);

		const enclosed = findEnclosedCellsFromHexTiles(full, resolution);

		// The route forms a visual loop through the Osnabrück area; there should
		// be at least one hex tile enclosed inside the loop.
		expect(enclosed.length).toBeGreaterThan(0);
	});

	it('returns empty when only hexTilesOrdered is used (open route – start ≠ end)', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;

		// Without the interpolated closing tiles, first and last are NOT neighbours.
		const enclosed = findEnclosedCellsFromHexTiles(hexTiles, resolution);
		expect(enclosed).toHaveLength(0);
	});

	it('enclosed tiles do not overlap with the full route tiles', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;
		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);

		const enclosed = findEnclosedCellsFromHexTiles(full, resolution);
		const routeSet = new Set(full);

		for (const cell of enclosed) {
			expect(routeSet.has(cell)).toBe(false);
		}
	});
});

// ─── rebuildMapFromActivities ─────────────────────────────────────────────────

describe('ActivityMapRebuildHelper – rebuildMapFromActivities with interpolated route', () => {
	let records: ReturnType<typeof rebuildMapFromActivities>['records'];

	beforeAll(() => {
		// Strip pre-computed enclosed tiles so the rebuild recomputes them from
		// hexTilesOrdered + routePoints (exercising the fallback path in rebuildMapFromActivities).
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

	it('enclosed tiles in records match those returned by findEnclosedCellsFromHexTiles(buildFullRouteTileIds(...))', () => {
		const hexTiles = activityFixture.hexTilesOrdered ?? [];
		const resolution = activityFixture.h3Resolution ?? 10;
		const full = buildFullRouteTileIds(hexTiles, activityFixture.routePoints, resolution);

		const directlyComputed = new Set(findEnclosedCellsFromHexTiles(full, resolution));
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
