export interface MyMapHandle {
	sendToMap: (data: object) => void;
}

export interface MyMapProps {
	initialCenter: { lat: number; lng: number };
	initialPitch?: number;
	loadingText?: string;
	onMessage: (data: object) => void;
}
