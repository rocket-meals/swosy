import type React from 'react';

/** Keys for map color customization passed via the `colorMap` prop. */
export enum MapColorKey {
	BACKGROUND = 'background',
	GRASS = 'grass',
	WATER = 'water',
	ROAD = 'road',
	BUILDING = 'building',
}

/** Partial color overrides for map layers, keyed by {@link MapColorKey}. */
export type MapColorMap = Partial<Record<MapColorKey, string>>;

/** Default MapLibre style URL (OpenFreeMap Liberty). */
export const LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/**
 * Keys for the built-in map styles available via {@link MAP_STYLE_DEFINITIONS}.
 * The string values are stable (stored in user preferences) and must not change.
 */
export enum MapStyleKey {
	DEFAULT = 'default',
	BRIGHT = 'bright',
	POSITRON = 'positron',
	DARK = 'dark',
	KARTOGRAFISCH = 'kartografisch',
}

/** Definition of a map style, including its tile URL and optional color overrides. */
export interface MapStyleDefinition {
	/** Human-readable label for the style. */
	label: string;
	/** MapLibre style URL for this style. */
	styleUrl: string;
	/** Optional color overrides applied to map layers after the style loads. */
	colorMap?: MapColorMap;
}

/** All built-in map styles, keyed by {@link MapStyleKey}. */
export const MAP_STYLE_DEFINITIONS: Record<MapStyleKey, MapStyleDefinition> = {
	[MapStyleKey.DEFAULT]: {
		label: 'Standard',
		styleUrl: LIBERTY_STYLE_URL,
	},
	[MapStyleKey.BRIGHT]: {
		label: 'Hell',
		styleUrl: 'https://tiles.openfreemap.org/styles/bright',
	},
	[MapStyleKey.POSITRON]: {
		label: 'Minimal',
		styleUrl: 'https://tiles.openfreemap.org/styles/positron',
	},
	[MapStyleKey.DARK]: {
		label: 'Dunkel',
		styleUrl: LIBERTY_STYLE_URL,
		colorMap: {
			[MapColorKey.BACKGROUND]: '#1a1a2e',
			[MapColorKey.GRASS]: '#1a3020',
			[MapColorKey.WATER]: '#0d2137',
			[MapColorKey.ROAD]: '#2c2c3a',
			[MapColorKey.BUILDING]: '#22223a',
		},
	},
	[MapStyleKey.KARTOGRAFISCH]: {
		label: 'Kartografisch',
		styleUrl: LIBERTY_STYLE_URL,
		colorMap: {
			[MapColorKey.BACKGROUND]: '#f5ead0',
			[MapColorKey.GRASS]: '#cde4b0',
			[MapColorKey.WATER]: '#a8d0e6',
			[MapColorKey.ROAD]: '#f0ddb0',
			[MapColorKey.BUILDING]: '#d4b896',
		},
	},
};

/**
 * Returns the full dict of built-in map style definitions keyed by {@link MapStyleKey}.
 * Use this to populate style-picker UIs or resolve a key to its URL and color overrides.
 */
export function getMapStyleDefinitions(): Record<MapStyleKey, MapStyleDefinition> {
	return MAP_STYLE_DEFINITIONS;
}

export interface MyMapHandle {
	sendToMap: (data: object) => void;
}

export interface MyMapProps {
	initialCenter?: { lat: number; lng: number };
	initialZoom?: number;
	initialPitch?: number;
	loadingText?: string;
	/**
	 * Optional React node rendered as an overlay on top of the map while it is loading.
	 * It is automatically faded out and removed once the map signals it is ready
	 * (`MapComponentMounted`). When provided, it replaces the default HTML loading spinner.
	 */
	loadingOverlay?: React.ReactNode;
	onMessage: (data: object) => void;
	/** When true (default) and no initialCenter is given, request the user's location and center the map there. */
	centerAtUserLocationIfNoInitialPosition?: boolean;
	/**
	 * Optional JavaScript to inject into the map HTML before initialisation.
	 * Use this to extend the map with custom layers or behaviour (e.g. hex-tile overlay).
	 * The script runs in the same scope as the map HTML and has access to the global
	 * `map`, `sendToRN`, and `window._mapExtensions` hooks.
	 *
	 * ⚠️ Only pass trusted, application-owned scripts. Injecting untrusted content
	 * results in arbitrary code execution inside the map WebView.
	 */
	injectScript?: string;
	/**
	 * Optional color overrides for map layer categories (grass, water, road, building, background).
	 * Pass `undefined` or omit to use the default map style colors.
	 * Changes to this prop are applied to the live map without reloading.
	 * When `mapStyleKey` is also provided, the definition's colorMap is applied first and
	 * this prop is applied on top.
	 */
	colorMap?: MapColorMap;
	/**
	 * Optional built-in map style key.  When set, the corresponding style URL is loaded and
	 * any color overrides defined in {@link MAP_STYLE_DEFINITIONS} are applied automatically.
	 * Changes to this prop switch the live map to the new style without reloading the page.
	 */
	mapStyleKey?: MapStyleKey;
}
