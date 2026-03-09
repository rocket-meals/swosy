import type { MapMarker } from './model';

const CLUSTER_ICON_SIZE = 40;
// Desired cluster radius in screen pixels; used to derive a geographic cell size per zoom level.
const CLUSTER_PIXEL_RADIUS = 60;
const MAX_CLUSTER_ZOOM = 20;
const DEFAULT_ZOOM_LEVEL = 13;

// Colour thresholds for the cluster badge
const SMALL_CLUSTER_THRESHOLD = 10;
const MEDIUM_CLUSTER_THRESHOLD = 100;
const SMALL_CLUSTER_COLOR = '#3388ff';
const MEDIUM_CLUSTER_COLOR = '#ff8800';
const LARGE_CLUSTER_COLOR = '#e03030';

function createClusterSvg(count: number): string {
	const half = CLUSTER_ICON_SIZE / 2;
	const r = half - 2;
	const fill = count < SMALL_CLUSTER_THRESHOLD ? SMALL_CLUSTER_COLOR : count < MEDIUM_CLUSTER_THRESHOLD ? MEDIUM_CLUSTER_COLOR : LARGE_CLUSTER_COLOR;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${CLUSTER_ICON_SIZE}" height="${CLUSTER_ICON_SIZE}">` +
		`<circle cx="${half}" cy="${half}" r="${r}" fill="${fill}" stroke="white" stroke-width="2" opacity="0.85"/>` +
		`<text x="${half}" y="${half}" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial,sans-serif" font-size="13" font-weight="bold">${count}</text>` +
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
		if (cellMarkers.length === 1) {
			result.push(cellMarkers[0]);
		} else {
			const { lat, lng } = cellMarkers.reduce(
				(acc, m) => ({ lat: acc.lat + m.position.lat, lng: acc.lng + m.position.lng }),
				{ lat: 0, lng: 0 },
			);
			result.push({
				id: `cluster:${key}`,
				position: { lat: lat / cellMarkers.length, lng: lng / cellMarkers.length },
				icon: createClusterSvg(cellMarkers.length),
				size: [CLUSTER_ICON_SIZE, CLUSTER_ICON_SIZE] as [number, number],
				iconAnchor: [CLUSTER_ICON_SIZE / 2, CLUSTER_ICON_SIZE / 2],
				title: String(cellMarkers.length),
			});
		}
	}
	return result;
}
