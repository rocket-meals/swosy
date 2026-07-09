import type { MyMapCoreProps } from 'repo-depkit-common-ui';

export interface MyMapHandle {
	sendToMap: (data: object) => void;
}

export interface MyMapProps extends MyMapCoreProps {
	initialCenter: { lat: number; lng: number };
	onMessage: (data: object) => void;
}

export class MyMapHelper {}
