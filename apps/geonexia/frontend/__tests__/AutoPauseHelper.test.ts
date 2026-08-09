import {
	AUTO_PAUSE_DEFAULT_DELAY_SECONDS,
	AUTO_PAUSE_MOVEMENT_RADIUS_METERS,
	AutoPauseAnchor,
	advanceAutoPauseAnchor,
	distanceMeters,
	hasMovedBeyondRadius,
	isStationaryLongEnough,
} from '../helpers/AutoPauseHelper';

// ~0.0001° latitude ≈ 11.1 m; helpers below build points a given number of
// metres north of a base coordinate so distances are intuitive to read.
const BASE_LAT = 52.52;
const BASE_LNG = 13.405;
const METERS_PER_DEGREE_LAT = 111_320;

function pointMetersNorth(meters: number, timestamp: number): AutoPauseAnchor {
	return { lat: BASE_LAT + meters / METERS_PER_DEGREE_LAT, lng: BASE_LNG, timestamp };
}

describe('distanceMeters', () => {
	it('returns 0 for identical coordinates', () => {
		const p = { lat: BASE_LAT, lng: BASE_LNG };
		expect(distanceMeters(p, p)).toBe(0);
	});

	it('measures a known offset within 1 % tolerance', () => {
		const a = { lat: BASE_LAT, lng: BASE_LNG };
		const b = pointMetersNorth(100, 0);
		expect(distanceMeters(a, b)).toBeGreaterThan(99);
		expect(distanceMeters(a, b)).toBeLessThan(101);
	});
});

describe('hasMovedBeyondRadius', () => {
	const anchor: AutoPauseAnchor = { lat: BASE_LAT, lng: BASE_LNG, timestamp: 0 };

	it('treats GPS jitter within the radius as not moving', () => {
		expect(hasMovedBeyondRadius(anchor, pointMetersNorth(5, 0))).toBe(false);
		expect(hasMovedBeyondRadius(anchor, pointMetersNorth(AUTO_PAUSE_MOVEMENT_RADIUS_METERS - 1, 0))).toBe(false);
	});

	it('detects movement beyond the radius', () => {
		expect(hasMovedBeyondRadius(anchor, pointMetersNorth(AUTO_PAUSE_MOVEMENT_RADIUS_METERS + 5, 0))).toBe(true);
	});

	it('honours a custom radius', () => {
		expect(hasMovedBeyondRadius(anchor, pointMetersNorth(8, 0), 5)).toBe(true);
		expect(hasMovedBeyondRadius(anchor, pointMetersNorth(8, 0), 10)).toBe(false);
	});
});

describe('advanceAutoPauseAnchor', () => {
	it('adopts the first fix of a recording as the anchor', () => {
		const first = pointMetersNorth(0, 1_000);
		expect(advanceAutoPauseAnchor(null, first)).toEqual(first);
	});

	it('keeps the anchor (and its timestamp) while fixes stay within the radius', () => {
		const anchor = pointMetersNorth(0, 1_000);
		const jitter = pointMetersNorth(5, 11_000);
		expect(advanceAutoPauseAnchor(anchor, jitter)).toBe(anchor);
	});

	it('moves the anchor to a fix beyond the radius', () => {
		const anchor = pointMetersNorth(0, 1_000);
		const moved = pointMetersNorth(AUTO_PAUSE_MOVEMENT_RADIUS_METERS + 10, 11_000);
		expect(advanceAutoPauseAnchor(anchor, moved)).toEqual(moved);
	});

	it('ages the anchor across a whole stationary phase with jitter', () => {
		let anchor: AutoPauseAnchor | null = null;
		anchor = advanceAutoPauseAnchor(anchor, pointMetersNorth(0, 0));
		// Standing still for a minute: jittering fixes every 5 s never advance the anchor.
		for (let t = 5_000; t <= 60_000; t += 5_000) {
			anchor = advanceAutoPauseAnchor(anchor, pointMetersNorth((t / 5_000) % 2 === 0 ? 4 : 9, t));
		}
		expect(anchor.timestamp).toBe(0);
		expect(isStationaryLongEnough(anchor, 60_000, AUTO_PAUSE_DEFAULT_DELAY_SECONDS)).toBe(true);
	});
});

describe('isStationaryLongEnough', () => {
	const anchor: AutoPauseAnchor = { lat: BASE_LAT, lng: BASE_LNG, timestamp: 100_000 };

	it('is false before the delay has elapsed', () => {
		expect(isStationaryLongEnough(anchor, 100_000 + 9_999, 10)).toBe(false);
	});

	it('is true once the delay has elapsed', () => {
		expect(isStationaryLongEnough(anchor, 100_000 + 10_000, 10)).toBe(true);
		expect(isStationaryLongEnough(anchor, 100_000 + 60_000, 10)).toBe(true);
	});
});
