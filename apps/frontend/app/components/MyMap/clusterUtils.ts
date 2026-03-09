import type { PointTuple } from 'leaflet';
import type { MapMarker } from './model';

export const CLUSTER_ICON_SIZE = 48;

function getClusterIcon(count: number): string {
	const size = CLUSTER_ICON_SIZE;
	return `<div style="width:${size}px;height:${size}px;background:#3388ff;border:3px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:bold;color:#fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">${count}</div>`;
}

function getGridCellSize(zoom: number): number {
	// Grid cell size in degrees so that markers within ~60 pixels are clustered together.
	// At zoom z, 256 * 2^z pixels spans 360 degrees of longitude.
	// 60 pixels => 60 * 360 / (256 * 2^z) degrees
	return (60 * 360) / (256 * Math.pow(2, zoom));
}

function getGridKey(lat: number, lng: number, cellSize: number): string {
	const row = Math.floor(lat / cellSize);
	const col = Math.floor(lng / cellSize);
	return `${row}_${col}`;
}

export function clusterMarkers(markers: MapMarker[], zoom: number): MapMarker[] {
	if (markers.length <= 1) return markers;

	const cellSize = getGridCellSize(zoom);
	const cells = new Map<string, MapMarker[]>();

	for (const marker of markers) {
		const key = getGridKey(marker.position.lat, marker.position.lng, cellSize);
		if (!cells.has(key)) cells.set(key, []);
		cells.get(key)!.push(marker);
	}

	const result: MapMarker[] = [];

	for (const [key, group] of cells) {
		if (group.length === 1) {
			result.push(group[0]);
		} else {
			const avgLat = group.reduce((sum, m) => sum + m.position.lat, 0) / group.length;
			const avgLng = group.reduce((sum, m) => sum + m.position.lng, 0) / group.length;
			const clusterMarker: MapMarker = {
				id: `cluster_${key}`,
				position: { lat: avgLat, lng: avgLng },
				icon: getClusterIcon(group.length),
				size: [CLUSTER_ICON_SIZE, CLUSTER_ICON_SIZE],
				iconAnchor: [CLUSTER_ICON_SIZE / 2, CLUSTER_ICON_SIZE / 2] as PointTuple,
				title: `${group.length} Markers`,
			};
			result.push(clusterMarker);
		}
	}

	return result;
}
