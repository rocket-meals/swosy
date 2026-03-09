import type { MapMarker } from './model';

/**
 * Size in pixels that defines the clustering grid cell.
 * Markers within the same cell at the current zoom level are grouped into a cluster.
 */
const CLUSTER_CELL_SIZE_PX = 80;

const CLUSTER_ICON_SIZE: [number, number] = [40, 40];
const CLUSTER_ICON_ANCHOR: [number, number] = [20, 20];

/**
 * Converts a lat/lng coordinate to pixel coordinates at a given zoom level
 * using the Web Mercator projection (same as Leaflet / OpenStreetMap).
 */
function latLngToPoint(lat: number, lng: number, zoom: number): { x: number; y: number } {
	const scale = 256 * Math.pow(2, zoom);
	const x = ((lng + 180) / 360) * scale;
	const latRad = (lat * Math.PI) / 180;
	const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * scale;
	return { x, y };
}

/**
 * Creates an SVG data URI to use as the cluster marker icon.
 * Renders a blue circle with the count of clustered markers.
 */
function createClusterIconUrl(count: number): string {
	const size = 40;
	const outerR = size / 2 - 1;
	const innerR = outerR - 5;
	const svg = [
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
		`<circle cx="${size / 2}" cy="${size / 2}" r="${outerR}" fill="#1976D2" opacity="0.6"/>`,
		`<circle cx="${size / 2}" cy="${size / 2}" r="${innerR}" fill="#1565C0"/>`,
		`<text x="${size / 2}" y="${size / 2 + 5}" text-anchor="middle" fill="white" font-size="13" font-weight="bold" font-family="Arial,sans-serif">${count}</text>`,
		`</svg>`,
	].join('');
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Groups nearby markers into clusters based on the current zoom level.
 *
 * Uses a simple grid-based algorithm: markers that fall within the same
 * CLUSTER_CELL_SIZE_PX × CLUSTER_CELL_SIZE_PX pixel cell at the given zoom
 * level are merged into a single cluster marker.
 *
 * @param markers - The full list of map markers.
 * @param zoom    - The current map zoom level.
 * @returns A new list where nearby markers are replaced by cluster markers.
 */
export function clusterMarkers(markers: MapMarker[], zoom: number): MapMarker[] {
	if (markers.length <= 1) return markers;

	const grid = new Map<string, MapMarker[]>();

	for (const marker of markers) {
		const point = latLngToPoint(marker.position.lat, marker.position.lng, zoom);
		const cellX = Math.floor(point.x / CLUSTER_CELL_SIZE_PX);
		const cellY = Math.floor(point.y / CLUSTER_CELL_SIZE_PX);
		const key = `${cellX},${cellY}`;

		const cell = grid.get(key);
		if (cell) {
			cell.push(marker);
		} else {
			grid.set(key, [marker]);
		}
	}

	const result: MapMarker[] = [];

	for (const cellMarkers of grid.values()) {
		if (cellMarkers.length === 1) {
			result.push(cellMarkers[0]);
		} else {
			const avgLat = cellMarkers.reduce((sum, m) => sum + m.position.lat, 0) / cellMarkers.length;
			const avgLng = cellMarkers.reduce((sum, m) => sum + m.position.lng, 0) / cellMarkers.length;
			result.push({
				id: `cluster-${cellMarkers.map((m) => m.id).join('|')}`,
				position: { lat: avgLat, lng: avgLng },
				iconUrl: createClusterIconUrl(cellMarkers.length),
				size: CLUSTER_ICON_SIZE,
				iconAnchor: CLUSTER_ICON_ANCHOR,
				title: `${cellMarkers.length} markers`,
			});
		}
	}

	return result;
}
