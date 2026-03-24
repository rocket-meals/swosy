export interface MyMapHandle {
	sendToMap: (data: object) => void;
}

export interface MyMapProps {
	initialCenter?: { lat: number; lng: number };
	initialPitch?: number;
	loadingText?: string;
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
}
