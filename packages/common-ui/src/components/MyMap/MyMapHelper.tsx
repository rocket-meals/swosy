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
}
