// ─── Auto-pause detection ─────────────────────────────────────────────────────
//
// Pure logic for automatically pausing a recording when the GPS position stops
// moving. The record screen keeps a "stationary anchor": the last position
// where movement was detected. Every accepted GPS fix either advances the
// anchor (moved beyond the movement radius) or leaves it in place (still
// within the radius, i.e. standing still). Once the anchor is older than the
// configured delay, the recording is auto-paused; the first fix beyond the
// radius afterwards resumes it.
//
// Detection is driven by a timer rather than by incoming GPS fixes alone:
// the platform stops delivering fixes entirely while the user stands still
// (see GPS_DISTANCE_INTERVAL_METERS in the record screen), so GPS silence is
// itself a stillness signal that only a clock can observe.

/** Default for the auto-pause feature toggle: enabled. */
export const AUTO_PAUSE_DEFAULT_ENABLED = true;

/** Seconds without movement before the recording is auto-paused. */
export const AUTO_PAUSE_DEFAULT_DELAY_SECONDS = 10;

/** Smallest configurable auto-pause delay (defensive bound, also enforced by the settings UI). */
export const AUTO_PAUSE_MIN_DELAY_SECONDS = 3;

/**
 * Radius in metres around the stationary anchor within which GPS fixes count
 * as "not moving". Chosen above typical GPS jitter so noise while standing
 * still neither advances the anchor nor triggers a premature resume.
 */
export const AUTO_PAUSE_MOVEMENT_RADIUS_METERS = 15;

/** The last position where movement was detected, with its wall-clock time. */
export type AutoPauseAnchor = {
	lat: number;
	lng: number;
	timestamp: number;
};

type LatLngPoint = { lat: number; lng: number };

const EARTH_RADIUS_METERS = 6_371_000;

/** Great-circle distance between two coordinates in metres. */
export function distanceMeters(a: LatLngPoint, b: LatLngPoint): number {
	const dLat = ((b.lat - a.lat) * Math.PI) / 180;
	const dLng = ((b.lng - a.lng) * Math.PI) / 180;
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
	return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** True when `point` lies outside the movement radius around `anchor`. */
export function hasMovedBeyondRadius(
	anchor: AutoPauseAnchor,
	point: LatLngPoint,
	radiusMeters: number = AUTO_PAUSE_MOVEMENT_RADIUS_METERS,
): boolean {
	return distanceMeters(anchor, point) > radiusMeters;
}

/**
 * Advance the stationary anchor for a newly accepted GPS fix: the anchor moves
 * to the fix when it is the first fix of the recording or lies beyond the
 * movement radius (movement detected); otherwise the existing anchor is kept
 * so its timestamp keeps ageing while the user stands still.
 */
export function advanceAutoPauseAnchor(
	anchor: AutoPauseAnchor | null,
	point: AutoPauseAnchor,
	radiusMeters: number = AUTO_PAUSE_MOVEMENT_RADIUS_METERS,
): AutoPauseAnchor {
	if (anchor === null || hasMovedBeyondRadius(anchor, point, radiusMeters)) {
		return { lat: point.lat, lng: point.lng, timestamp: point.timestamp };
	}
	return anchor;
}

/** True when the anchor has not moved for at least `delaySeconds`. */
export function isStationaryLongEnough(
	anchor: AutoPauseAnchor,
	nowMs: number,
	delaySeconds: number,
): boolean {
	return nowMs - anchor.timestamp >= delaySeconds * 1000;
}
