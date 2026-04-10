// ─── Moving-average smoothing & road-snap projection ─────────────────────────
//
// Approximates "road snapping" by:
//   1. Building a smoothed centre-line of the GPS track (moving average).
//   2. Projecting each raw GPS point onto the nearest segment of that
//      smoothed track.

/** Number of neighbouring points used by the moving-average smoother. */
export const SNAP_SMOOTH_WINDOW = 9;

/** Squared Euclidean distance in degrees (good enough for small distances). */
export function squaredDistDeg(a: [number, number], b: [number, number]): number {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	return dx * dx + dy * dy;
}

/**
 * Smooth a coordinate array with a simple moving average.
 * @param coords  Array of [lng, lat] pairs.
 * @param window  Number of neighbours to include on each side.
 */
export function movingAverage(coords: [number, number][], window: number): [number, number][] {
	const half = Math.floor(window / 2);
	return coords.map((_, i) => {
		const lo = Math.max(0, i - half);
		const hi = Math.min(coords.length - 1, i + half);
		let sumLng = 0;
		let sumLat = 0;
		let n = 0;
		for (let j = lo; j <= hi; j++) {
			sumLng += coords[j][0];
			sumLat += coords[j][1];
			n++;
		}
		return [sumLng / n, sumLat / n];
	});
}

/**
 * Project point `p` onto the line segment `a`→`b`.
 * Returns the closest point on the segment to `p`.
 */
export function projectOntoSegment(
	p: [number, number],
	a: [number, number],
	b: [number, number],
): [number, number] {
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const lenSq = dx * dx + dy * dy;
	if (lenSq === 0) return a;
	const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lenSq));
	return [a[0] + t * dx, a[1] + t * dy];
}

/**
 * Snap each GPS coordinate to the smoothed centre-line of the track.
 *
 * @param coords           Array of [lng, lat] pairs.
 * @param interpolatedMask Optional boolean mask; `true` entries are left
 *                         unchanged (already interpolated, no snapping needed).
 */
export function snapToRoad(
	coords: [number, number][],
	interpolatedMask?: boolean[],
): [number, number][] {
	if (coords.length < 2) return coords;

	const smoothed = movingAverage(coords, SNAP_SMOOTH_WINDOW);

	return coords.map((pt, i) => {
		if (interpolatedMask && interpolatedMask.length === coords.length && interpolatedMask[i])
			return pt;
		let bestDistSq = Infinity;
		let bestPt: [number, number] = pt;
		for (let j = 0; j < smoothed.length - 1; j++) {
			const proj = projectOntoSegment(pt, smoothed[j], smoothed[j + 1]);
			const d = squaredDistDeg(pt, proj);
			if (d < bestDistSq) {
				bestDistSq = d;
				bestPt = proj;
			}
		}
		return bestPt;
	});
}
