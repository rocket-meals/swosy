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

// Colour thresholds for the cluster badge
const SMALL_CLUSTER_THRESHOLD = 10;
const MEDIUM_CLUSTER_THRESHOLD = 100;
const SMALL_CLUSTER_COLOR = '#3388ff';
const MEDIUM_CLUSTER_COLOR = '#ff8800';
const LARGE_CLUSTER_COLOR = '#e03030';

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

function createClusterSvg(count: number): string {
	const cx = CLUSTER_SVG_SIZE / 2;
	const cy = CLUSTER_SVG_SIZE / 2;
	const r = CLUSTER_ICON_SIZE / 2 - 2;
	const haloR = r + CLUSTER_HALO_PADDING;
	const fill = count < SMALL_CLUSTER_THRESHOLD ? SMALL_CLUSTER_COLOR : count < MEDIUM_CLUSTER_THRESHOLD ? MEDIUM_CLUSTER_COLOR : LARGE_CLUSTER_COLOR;
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
				icon: createClusterSvg(cellMarkers.length),
				size: [CLUSTER_SVG_SIZE, CLUSTER_SVG_SIZE] as [number, number],
				iconAnchor: [CLUSTER_SVG_SIZE / 2, CLUSTER_SVG_SIZE / 2],
			});
		}
	}
	return result;
}
