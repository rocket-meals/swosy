import React from 'react';

import type { LeafletWebViewEvent, MapLayer, MapMarker } from './model';

export interface Position {
	lat: number;
	lng: number;
}

export interface MyMapProps {
	mapCenterPosition: Position;
	zoom?: number;
	mapMarkers?: MapMarker[];
	noClusterMarkers?: MapMarker[];
	mapLayers?: MapLayer[];
	useFlyAnimation?: boolean;
	onMarkerClick?: (id: string) => void;
	onMapEvent?: (event: LeafletWebViewEvent) => void;
	renderMarkerModal?: (markerId: string, onClose: () => void) => React.ReactNode;
	onMarkerSelectionChange?: (markerId: string | null) => void;
}

export class MyMapHelper {}
