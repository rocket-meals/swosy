import type { MapMarker } from './model';

const TILE_SIZE = 256;

/** Project a lat/lng coordinate to pixel space at the given zoom level. */
function latLngToPixel(lat: number, lng: number, zoom: number): { x: number; y: number } {
	const scale = TILE_SIZE * Math.pow(2, zoom);
	const x = ((lng + 180) / 360) * scale;
	const sinLat = Math.sin((lat * Math.PI) / 180);
	const y = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale;
	return { x, y };
}

/** Return the pixel size for a cluster icon based on the number of grouped markers. */
function getClusterIconSize(count: number): number {
	if (count < 10) return 40;
	if (count < 100) return 48;
	return 56;
}

/** Create a base64-encoded SVG data URI representing a cluster icon with a count badge. */
function createClusterIcon(count: number): string {
	const size = getClusterIconSize(count);
	const half = size / 2;
	const radius = half - 3;
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${half}" cy="${half}" r="${radius}" fill="#3388ff" fill-opacity="0.85" stroke="white" stroke-width="2.5"/><text x="${half}" y="${half + 5}" text-anchor="middle" font-size="13" font-weight="bold" fill="white" font-family="sans-serif">${count}</text></svg>`;
	const encoded = btoa(
		encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_match, p1) => String.fromCharCode(parseInt(p1, 16))),
	);
	return `data:image/svg+xml;base64,${encoded}`;
}

/**
 * Cluster an array of MapMarkers using a simple grid-based algorithm.
 *
 * Markers that fall into the same pixel-grid cell (of `gridSize` pixels) at
 * the given zoom level are merged into a single cluster marker.
 * If a cell contains only one marker it is returned unchanged.
 *
 * @param markers  - The original markers to cluster.
 * @param zoom     - The current map zoom level.
 * @param gridSize - Grid cell size in pixels (default 60).
 */
export function clusterMarkers(markers: MapMarker[], zoom: number, gridSize = 60): MapMarker[] {
	if (markers.length === 0) return [];

	const cells = new Map<string, MapMarker[]>();

	for (const marker of markers) {
		const { x, y } = latLngToPixel(marker.position.lat, marker.position.lng, zoom);
		const cellX = Math.floor(x / gridSize);
		const cellY = Math.floor(y / gridSize);
		const key = `${cellX}:${cellY}`;
		const cellMarkers = cells.get(key);
		if (cellMarkers) {
			cellMarkers.push(marker);
		} else {
			cells.set(key, [marker]);
		}
	}

	const result: MapMarker[] = [];

	for (const [key, cellMarkers] of cells) {
		if (cellMarkers.length === 1) {
			result.push(cellMarkers[0]);
		} else {
			const avgLat = cellMarkers.reduce((sum, m) => sum + m.position.lat, 0) / cellMarkers.length;
			const avgLng = cellMarkers.reduce((sum, m) => sum + m.position.lng, 0) / cellMarkers.length;
			const size = getClusterIconSize(cellMarkers.length);
			const half = size / 2;
			result.push({
				id: `cluster-${key}`,
				position: { lat: avgLat, lng: avgLng },
				icon: createClusterIcon(cellMarkers.length),
				size: [size, size],
				iconAnchor: [half, half],
				title: `${cellMarkers.length}`,
			});
		}
	}

	return result;
}
