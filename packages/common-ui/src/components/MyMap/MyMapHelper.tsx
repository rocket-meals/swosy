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
	 */
	colorMap?: MapColorMap;
}
