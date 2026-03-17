import type { PointTuple } from 'leaflet';
import { isWeb } from '@/constants/Constants';

export const MARKER_DEFAULT_SIZE = 48;

export const getDefaultIconAnchor = (width: number, height: number): PointTuple => [width / 2, height];

/**
 * Derives a short label from a building alias when no explicit marker_label or external_identifier is set.
 * Rules (in priority order):
 *  1. If alias is ≤ 4 chars → use as-is
 *  2. If alias contains a number → use that number
 *  3. If alias has multiple words → use initials of each word
 *  4. If alias is a single word → use first 4 chars
 *  5. Fallback → "?"
 */
export function getMarkerLabelFromBuildingAlias(alias?: string | null): string {
	if (!alias) return '?';
	const trimmed = alias.trim();
	if (!trimmed) return '?';
	if (trimmed.length <= 4) return trimmed;
	const numberMatch = trimmed.match(/\d+/);
	if (numberMatch) return numberMatch[0];
	const words = trimmed.split(/\s+/).filter((w) => w.length > 0);
	if (words.length > 1) return words.map((w) => w[0].toUpperCase()).join('');
	return trimmed.slice(0, 4);
}

/** Creates an SVG for the user location marker (blue dot). */
export function createUserLocationMarkerSvg(): string {
	const size = 28;
	const cx = size / 2;
	const cy = size / 2;
	return (
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
		`<circle cx="${cx}" cy="${cy}" r="${cx - 2}" fill="#1a73e8" stroke="white" stroke-width="3" opacity="0.95"/>` +
		`<circle cx="${cx}" cy="${cy}" r="${cx + 4}" fill="#1a73e8" opacity="0.15"/>` +
		`</svg>`
	);
}

export class MyMapMarkerIcons {
	static DEBUG_ICON = `<div style='width: ${MARKER_DEFAULT_SIZE}px; height: ${MARKER_DEFAULT_SIZE}px; background-color: #FF000066; position: relative;'><div style='width: ${MARKER_DEFAULT_SIZE}px; height: ${MARKER_DEFAULT_SIZE}px; background-color: #00FF0066; border-radius: 50%; position: absolute; top: 0%; left: 0%;'></div></div>`;

	static getIconForWebByLocalPathUri(iconUri: string): string {
		return `<img src='${iconUri}' style='width: ${MARKER_DEFAULT_SIZE}px; height: ${MARKER_DEFAULT_SIZE}px; object-fit: contain;'>`;
	}

	static getIconForWebByExternalUri(iconUri: string): string {
		if (isWeb) {
			return iconUri;
		}

		return iconUri;
	}

	static getIconForWebByBase64(base64: string): string {
		if (isWeb) {
			return `data:image/png;base64,${base64}`;
		}

		return `data:image/png;base64,${base64}`;
	}
}
