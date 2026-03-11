import type { MapMarker } from './model';

const CLUSTER_ICON_SIZE = 40;
// Extra padding around the main circle to accommodate the halo ring
const CLUSTER_HALO_PADDING = 8;
// Total SVG canvas size including halo padding on each side
const CLUSTER_SVG_SIZE = CLUSTER_ICON_SIZE + CLUSTER_HALO_PADDING * 2;
// Desired cluster radius in screen pixels; used to derive a geographic cell size per zoom level.
const CLUSTER_PIXEL_RADIUS = 60;
const MAX_CLUSTER_ZOOM = 20;
const DEFAULT_ZOOM_LEVEL = 13;
// Minimum number of markers in a cell required to form a cluster
export const MIN_MARKERS_FOR_CLUSTER = 3;

// Fixed colour palette for cluster badges — from cool (small) to warm (large)
const CLUSTER_STEP_COLORS = [
	'#60A5FA', // blue   – smallest clusters
	'#34D399', // green
	'#A3E635', // lime
	'#FACC15', // yellow
	'#FB923C', // orange
	'#F87171', // light red
	'#EF4444', // red
	'#A855F7', // purple – largest clusters
];

/**
 * Generate threshold steps using the 1–2–5 progression (e.g. 3, 5, 10, 20, 50, …)
 * starting at minCount and stopping at maxCount (inclusive).
 */
function generateClusterSteps(minCount: number, maxCount: number): number[] {
	const steps: number[] = [minCount];
	const multipliers = [1, 2, 5];
	let magnitude = 1;

	outer: while (true) {
		for (const m of multipliers) {
			const value = m * magnitude;
			if (value > minCount && value <= maxCount) {
				steps.push(value);
			} else if (value > maxCount) {
				break outer;
			}
		}
		magnitude *= 10;
	}
	return steps;
}

/**
 * Build a threshold → colour mapping for the given marker count range.
 * The colours are distributed evenly across the generated step thresholds.
 * @param minCount Minimum number of markers required to form a cluster (e.g. 3)
 * @param maxCount Maximum number of markers observed (drives how many steps are created)
 */
export function buildClusterColorMap(minCount: number, maxCount: number): Record<number, string> {
	const steps = generateClusterSteps(minCount, Math.max(minCount, maxCount));
	const colors = CLUSTER_STEP_COLORS;
	const result: Record<number, string> = {};

	steps.forEach((step, i) => {
		const colorIndex =
			steps.length <= 1
				? 0
				: Math.round((i / (steps.length - 1)) * (colors.length - 1));
		result[step] = colors[Math.min(colorIndex, colors.length - 1)];
	});

	return result;
}

/** Look up the colour for a given cluster count using a pre-built colour map. */
function getClusterColor(count: number, colorMap: Record<number, string>): string {
	const thresholds = Object.keys(colorMap)
		.map(Number)
		.sort((a, b) => b - a);
	for (const threshold of thresholds) {
		if (count >= threshold) {
			return colorMap[threshold];
		}
	}
	return CLUSTER_STEP_COLORS[0];
}

// Step-based display labels for cluster counts: 3+, 5+, 10+, 20+, 50+, 100+, 200+, 500+, 1k+
function getClusterLabel(count: number): string {
	if (count >= 1000) return '1k+';
	if (count >= 500) return '500+';
	if (count >= 200) return '200+';
	if (count >= 100) return '100+';
	if (count >= 50) return '50+';
	if (count >= 20) return '20+';
	if (count >= 10) return '10+';
	if (count >= 5) return '5+';
	return '3+';
}

function createClusterSvg(count: number, colorMap: Record<number, string>): string {
	const cx = CLUSTER_SVG_SIZE / 2;
	const cy = CLUSTER_SVG_SIZE / 2;
	const r = CLUSTER_ICON_SIZE / 2 - 2;
	const haloR = r + CLUSTER_HALO_PADDING;
	const fill = getClusterColor(count, colorMap);
	const label = getClusterLabel(count);
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${CLUSTER_SVG_SIZE}" height="${CLUSTER_SVG_SIZE}">` +
		`<circle cx="${cx}" cy="${cy}" r="${haloR}" fill="${fill}" opacity="0.25"/>` +
		`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="white" stroke-width="2" opacity="0.9"/>` +
		`<text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="bold">${label}</text>` +
		`</svg>`
	);
}

function getGridCell(lat: number, lng: number, zoom: number): string {
	// Leaflet uses 256-pixel tiles. At zoom level z the world is 256*2^z pixels wide (360°).
	// cellDeg is the geographic width/height of one grid cell that corresponds to CLUSTER_PIXEL_RADIUS pixels.
	const cellDeg = (CLUSTER_PIXEL_RADIUS / 256) * (360 / Math.pow(2, zoom));
	const col = Math.floor(lng / cellDeg);
	const row = Math.floor(lat / cellDeg);
	return `${col}:${row}`;
}

export function clusterMarkers(markers: MapMarker[], zoom: number): MapMarker[] {
	if (!markers || markers.length === 0) return markers;

	// Guard against undefined/NaN zoom (e.g. if the map hasn't reported its zoom yet)
	const safeZoom = typeof zoom === 'number' && isFinite(zoom) ? zoom : DEFAULT_ZOOM_LEVEL;

	if (safeZoom >= MAX_CLUSTER_ZOOM) return markers;

	const cells = new Map<string, MapMarker[]>();
	for (const marker of markers) {
		const key = getGridCell(marker.position.lat, marker.position.lng, safeZoom);
		const cell = cells.get(key);
		if (cell) {
			cell.push(marker);
		} else {
			cells.set(key, [marker]);
		}
	}

	// Determine the largest cluster size so the colour map reflects the actual data range
	let maxClusterSize = MIN_MARKERS_FOR_CLUSTER;
	for (const cellMarkers of cells.values()) {
		if (cellMarkers.length > maxClusterSize) {
			maxClusterSize = cellMarkers.length;
		}
	}

	// Build the colour map once for this zoom/data snapshot
	const colorMap = buildClusterColorMap(MIN_MARKERS_FOR_CLUSTER, maxClusterSize);

	const result: MapMarker[] = [];
	for (const [key, cellMarkers] of cells.entries()) {
		if (cellMarkers.length < MIN_MARKERS_FOR_CLUSTER) {
			result.push(...cellMarkers);
		} else {
			const { lat, lng } = cellMarkers.reduce(
				(acc, m) => ({ lat: acc.lat + m.position.lat, lng: acc.lng + m.position.lng }),
				{ lat: 0, lng: 0 },
			);
			result.push({
				id: `cluster:${key}`,
				position: { lat: lat / cellMarkers.length, lng: lng / cellMarkers.length },
				icon: createClusterSvg(cellMarkers.length, colorMap),
				size: [CLUSTER_SVG_SIZE, CLUSTER_SVG_SIZE] as [number, number],
				iconAnchor: [CLUSTER_SVG_SIZE / 2, CLUSTER_SVG_SIZE / 2],
			});
		}
	}
	return result;
}
