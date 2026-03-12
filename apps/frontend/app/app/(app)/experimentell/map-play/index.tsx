import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { ShouldStartLoadRequest } from 'react-native-webview/lib/WebViewTypes';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { MapMarker } from '@/components/MyMap/model';
import { useTheme } from '@/hooks/useTheme';
import { DatabaseTypes } from 'repo-depkit-common';
import { MARKER_DEFAULT_SIZE } from '@/components/MyMap/markerUtils';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { MaterialIcons } from '@expo/vector-icons';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';

// ─── Types ────────────────────────────────────────────────────────────────────

type Position = { lat: number; lng: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const MAP_PITCH = 70; // MapLibre native pitch – degrees from horizontal (0=top-down)
const DEFAULT_ZOOM = 17;
const POSITION_BUNDESTAG: Position = { lat: 52.518594247456804, lng: 13.376281624711964 };
const BUILDING_MARKER_COLOR = '#1565c0';
const BUILDING_MARKER_SIZE = MARKER_DEFAULT_SIZE;

const GAME_TICK_MS = 100;

// Airplane
const AIRPLANE_DEFAULT_SPEED = 0.00008; // degrees per tick
const AIRPLANE_SPEED_STEP = 0.00002;
const AIRPLANE_MAX_SPEED = 0.00035;
const AIRPLANE_MIN_SPEED = 0.00001;
const AIRPLANE_TURN_DEG = 5; // degrees per tick while turn button is held

// UI / visual constants
const MAX_BUILDING_LABEL_LENGTH = 4;
const SPEED_DISPLAY_MIN = 1;
const SPEED_DISPLAY_MAX = 10;

// ─── SVG Generators ───────────────────────────────────────────────────────────

/** Airplane top-down marker with heading rotation and altitude shadow. */
function createAirplaneSvg(heading: number): string {
	const size = 56;
	const cx = size / 2;
	const cy = size / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <g transform="translate(${cx},${cy}) rotate(${heading})">
      <!-- Ground shadow indicates altitude above buildings -->
      <ellipse cx="3" cy="15" rx="11" ry="5" fill="rgba(0,0,0,0.18)"/>
      <!-- Left wing -->
      <path d="M0,-4 L-15,6 L-15,8.5 L-2,4Z" fill="#1565c0" stroke="white" stroke-width="0.8"/>
      <!-- Right wing -->
      <path d="M0,-4 L15,6 L15,8.5 L2,4Z" fill="#1565c0" stroke="white" stroke-width="0.8"/>
      <!-- Left tail fin -->
      <path d="M-1,11 L-8,18 L-8,20 L-1,13Z" fill="#0d47a1" stroke="white" stroke-width="0.5"/>
      <!-- Right tail fin -->
      <path d="M1,11 L8,18 L8,20 L1,13Z" fill="#0d47a1" stroke="white" stroke-width="0.5"/>
      <!-- Fuselage body -->
      <path d="M0,-20 C2,-13 2,-5 2,0 L2,13 L0,15 L-2,13 L-2,0 C-2,-5 -2,-13 0,-20Z" fill="#1a73e8" stroke="white" stroke-width="1"/>
      <!-- Cockpit window -->
      <ellipse cx="0" cy="-14" rx="2.5" ry="4" fill="#bbdefb" opacity="0.9"/>
    </g>
  </svg>`;
}

/** Building map marker (simplified circle with label). */
function createBuildingMarkerSvg(color: string, label: string): string {
	const size = BUILDING_MARKER_SIZE;
	const cx = size / 2;
	const cy = size / 2;
	const r = cx - 2;
	const displayLabel = (label ?? '').slice(0, MAX_BUILDING_LABEL_LENGTH);
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial,sans-serif" font-size="12" font-weight="bold">${displayLabel}</text>
  </svg>`;
}

// ─── Math Helpers ─────────────────────────────────────────────────────────────

function degToRad(deg: number): number {
	return (deg * Math.PI) / 180;
}

/**
 * Move a lat/lng position by heading (0=North, 90=East) and a distance in
 * degree-units (small values ~0.00001–0.001 work well for map navigation).
 */
function moveByHeading(pos: Position, headingDeg: number, distanceDeg: number): Position {
	const rad = degToRad(headingDeg);
	return {
		lat: pos.lat + distanceDeg * Math.cos(rad),
		lng: pos.lng + distanceDeg * Math.sin(rad),
	};
}

function normalizeHeading(h: number): number {
	return ((h % 360) + 360) % 360;
}

// ─── Control Button ───────────────────────────────────────────────────────────

type ControlButtonProps = {
	onPressIn?: () => void;
	onPressOut?: () => void;
	onPress?: () => void;
	label?: string;
	icon?: React.ReactNode;
	color?: string;
	size?: 'sm' | 'md' | 'lg';
};

const ControlButton: React.FC<ControlButtonProps> = ({
	onPressIn,
	onPressOut,
	onPress,
	label,
	icon,
	color = 'rgba(0,0,0,0.65)',
	size = 'md',
}) => {
	const dim = size === 'sm' ? 38 : size === 'lg' ? 58 : 48;
	return (
		<TouchableOpacity
			style={{
				width: dim,
				height: dim,
				borderRadius: dim / 2,
				backgroundColor: color,
				alignItems: 'center',
				justifyContent: 'center',
				margin: 3,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.4,
				shadowRadius: 4,
				elevation: 5,
			}}
			onPressIn={onPressIn}
			onPressOut={onPressOut}
			onPress={onPress}
			activeOpacity={0.7}
		>
			{icon ?? (
				<Text
					style={{
						color: 'white',
						fontSize: size === 'sm' ? 14 : 18,
						fontWeight: 'bold',
					}}
				>
					{label}
				</Text>
			)}
		</TouchableOpacity>
	);
};

// ─── Airplane Controls ────────────────────────────────────────────────────────

type AirplaneControlsProps = {
	onTurnLeftStart: () => void;
	onTurnLeftEnd: () => void;
	onTurnRightStart: () => void;
	onTurnRightEnd: () => void;
	onSpeedUp: () => void;
	onSpeedDown: () => void;
};

const AirplaneControls: React.FC<AirplaneControlsProps> = ({
	onTurnLeftStart,
	onTurnLeftEnd,
	onTurnRightStart,
	onTurnRightEnd,
	onSpeedUp,
	onSpeedDown,
}) => (
	<View style={controlStyles.airplaneLayout}>
		{/* Turn buttons */}
		<View style={controlStyles.turnColumn}>
			<ControlButton
				onPressIn={onTurnLeftStart}
				onPressOut={onTurnLeftEnd}
				label="◀"
				color="rgba(26,115,232,0.85)"
				size="lg"
			/>
			<ControlButton
				onPressIn={onTurnRightStart}
				onPressOut={onTurnRightEnd}
				label="▶"
				color="rgba(26,115,232,0.85)"
				size="lg"
			/>
		</View>
		{/* Throttle buttons */}
		<View style={controlStyles.throttleColumn}>
			<ControlButton
				onPress={onSpeedUp}
				label="🔼"
				color="rgba(46,125,50,0.85)"
				size="md"
			/>
			<ControlButton
				onPress={onSpeedDown}
				label="🔽"
				color="rgba(183,28,28,0.85)"
				size="md"
			/>
		</View>
	</View>
);

const controlStyles = StyleSheet.create({
	airplaneLayout: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	turnColumn: {
		flexDirection: 'row',
		gap: 6,
	},
	throttleColumn: {
		flexDirection: 'column',
		gap: 6,
	},
});

// ─── Main MapPlay Component ───────────────────────────────────────────────────

type BuildingCoordinates = { coordinates?: [number, number] } | null;

const MapPlay = () => {
	useSetPageTitle(TranslationKeys.map_play);

	const { buildings, buildingsOrganizations, organisations } = useAppSelector(
		(state) => state.canteenReducer,
	);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const selectedCanteen = useSelectedCanteen();
	const { theme } = useTheme();

	// ── Vehicle state ────────────────────────────────────────────────────────────
	// vehicleHeading and airplaneSpeed are React state (needed for UI display).
	// vehiclePosRef tracks position without triggering re-renders – the map camera
	// is updated directly from the game loop via sendToMapRef.

	const [vehicleHeading, setVehicleHeading] = useState(0); // 0 = North
	const [airplaneSpeed, setAirplaneSpeed] = useState(AIRPLANE_DEFAULT_SPEED);
	const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

	// Refs so the game loop always reads the latest values without recreating the interval
	const vehicleHeadingRef = useRef(vehicleHeading);
	vehicleHeadingRef.current = vehicleHeading;

	const airplaneSpeedRef = useRef(airplaneSpeed);
	airplaneSpeedRef.current = airplaneSpeed;

	const mapZoomRef = useRef(mapZoom);
	mapZoomRef.current = mapZoom;

	// vehiclePos ref – position changes bypass React state to prevent re-renders
	const vehiclePosRef = useRef<Position>(POSITION_BUNDESTAG);

	// Refs for held-button state (continuous turning)
	const turnLeftRef = useRef(false);
	const turnRightRef = useRef(false);

	// ── MapLibre WebView state ────────────────────────────────────────────────────

	const webViewRef = useRef<WebView>(null);
	const [html, setHtml] = useState<string | null>(null);
	const [mapReady, setMapReady] = useState(false);
	const mapReadyRef = useRef(false);
	mapReadyRef.current = mapReady;

	// ── Center position: selected canteen building or Bundestag ─────────────────

	const centerPosition = useMemo((): Position => {
		if (selectedCanteen?.building) {
			const building = (buildings as DatabaseTypes.Buildings[]).find(
				(b) => b.id === selectedCanteen.building,
			);
			const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
			if (coords && coords.length === 2) {
				return { lat: Number(coords[1]), lng: Number(coords[0]) };
			}
		}
		return POSITION_BUNDESTAG;
	}, [selectedCanteen, buildings]);

	// Keep vehiclePosRef updated to the latest centerPosition so the map starts
	// at the right location when it first loads.
	useEffect(() => {
		vehiclePosRef.current = centerPosition;
	}, [centerPosition]);

	// ── Building markers ─────────────────────────────────────────────────────────

	const organisationsDict = useMemo(
		() =>
			(organisations as DatabaseTypes.Organizations[]).reduce<
				Record<string, DatabaseTypes.Organizations>
			>((acc, org) => {
				acc[org.id] = org;
				return acc;
			}, {}),
		[organisations],
	);

	const buildingIdToOrgsDict = useMemo(
		() =>
			BuildingsHelper.getBuildingIdToOrganizationsDict(
				buildingsOrganizations,
				organisationsDict,
			),
		[buildingsOrganizations, organisationsDict],
	);

	const buildingMarkers = useMemo((): MapMarker[] => {
		return (buildings as DatabaseTypes.Buildings[])
			.filter((building) => {
				const coords = (building?.coordinates as BuildingCoordinates)?.coordinates;
				return coords && coords.length === 2;
			})
			.map((building) => {
				const coords = (building.coordinates as BuildingCoordinates)!.coordinates!;
				const [lng, lat] = coords;
				const firstOrg = buildingIdToOrgsDict[building.id]?.[0] ?? null;
				const color =
					building.map_marker_color ||
					firstOrg?.map_marker_color ||
					primaryColor ||
					BUILDING_MARKER_COLOR;
				const label =
					building.map_marker_label ||
					building.external_identifier ||
					building.alias ||
					'?';
				return {
					id: `building-${building.id}`,
					position: { lat: Number(lat), lng: Number(lng) },
					icon: createBuildingMarkerSvg(color, label),
					size: [BUILDING_MARKER_SIZE, BUILDING_MARKER_SIZE] as [number, number],
					iconAnchor: [BUILDING_MARKER_SIZE / 2, BUILDING_MARKER_SIZE / 2] as [number, number],
				};
			});
	}, [buildings, buildingIdToOrgsDict, primaryColor]);

	const buildingMarkersRef = useRef(buildingMarkers);
	buildingMarkersRef.current = buildingMarkers;

	// ── Load MapLibre HTML ────────────────────────────────────────────────────────

	useEffect(() => {
		let isMounted = true;
		(async () => {
			const asset = Asset.fromModule(require('@/assets/maplibre/index.html'));
			await asset.downloadAsync();
			let content = await FileSystem.readAsStringAsync(asset.localUri!);
			// Inject MAP_PITCH as the third argument of initMap so the map opens in
			// 3D immediately; 'initMap(null, null)' is unique in the HTML file.
			content = content.replace('initMap(null, null);', `initMap(null, null, ${MAP_PITCH});`);
			if (isMounted) setHtml(content);
		})();
		return () => { isMounted = false; };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	// ── MapLibre message helpers ──────────────────────────────────────────────────

	const sendToMap = useCallback((data: object) => {
		const json = JSON.stringify(data);
		webViewRef.current?.injectJavaScript(
			`window.dispatchEvent(new MessageEvent('message',{data:${json}}));true;`,
		);
	}, []);

	// Stable ref to sendToMap – lets the game loop call it without stale closures
	// and without adding sendToMap to the interval's dependency array.
	const sendToMapRef = useRef(sendToMap);
	sendToMapRef.current = sendToMap;

	// Stable callback that reads from refs – used on MapComponentMounted to avoid
	// stale-closure issues while keeping handleMessage stable.
	const sendFullData = useCallback(() => {
		const pos = vehiclePosRef.current;
		const markers = buildingMarkersRef.current;
		sendToMap({
			mapCenterPosition: pos,
			zoom: mapZoomRef.current,
			pitch: MAP_PITCH,
			animate: false,
			useFlyAnimation: false,
			mapMarkers: markers,
			vehicleMarker: null,
		});
	}, [sendToMap]);

	// Re-send building markers whenever they change after the map is ready
	useEffect(() => {
		if (!mapReady) return;
		sendToMap({ mapMarkers: buildingMarkers });
	}, [mapReady, buildingMarkers, sendToMap]);

	// ── MapLibre message handler ──────────────────────────────────────────────────

	const handleMessage = useCallback((event: WebViewMessageEvent) => {
		try {
			const data = JSON.parse(event.nativeEvent.data);
			if (data.tag === 'MapComponentMounted') {
				setMapReady(true);
				sendFullData();
				return;
			}
			if (data.tag === 'onZoomEnd') {
				setMapZoom(data.zoom);
			}
		} catch {
			// ignore malformed messages
		}
	}, [sendFullData]);

	const handleShouldStartLoadWithRequest = useCallback((request: ShouldStartLoadRequest): boolean => {
		const url = request.url;
		if (!url || url === 'about:blank' || url === 'about:srcdoc') return true;
		CommonSystemActionHelper.openExternalURL(url).catch(() => {});
		return false;
	}, []);

	// ── Airplane game loop ────────────────────────────────────────────────────────
	// vehiclePosRef is updated each tick without React state to avoid re-renders.
	// The camera update is sent directly to the map via sendToMapRef every tick,
	// using easeTo with GAME_TICK_MS duration for smooth continuous animation.

	useEffect(() => {
		const id = setInterval(() => {
			if (!mapReadyRef.current) return;
			// Continuous turning when turn buttons are held
			if (turnLeftRef.current) {
				setVehicleHeading((h) => normalizeHeading(h - AIRPLANE_TURN_DEG));
			} else if (turnRightRef.current) {
				setVehicleHeading((h) => normalizeHeading(h + AIRPLANE_TURN_DEG));
			}
			// Move forward using the latest heading and speed from refs
			const heading = vehicleHeadingRef.current;
			const speed = airplaneSpeedRef.current;
			const newPos = moveByHeading(vehiclePosRef.current, heading, speed);
			vehiclePosRef.current = newPos;
			// Send camera update directly – bypasses React state to eliminate stutter
			sendToMapRef.current({
				mapCenterPosition: newPos,
				easeAnimation: true,
				easeDuration: GAME_TICK_MS,
			});
		}, GAME_TICK_MS);
		return () => clearInterval(id);
	}, []); // No dependencies – all values read via refs

	// ── Airplane controls ─────────────────────────────────────────────────────────

	const handleAirplaneTurnLeftStart = useCallback(() => {
		turnLeftRef.current = true;
	}, []);
	const handleAirplaneTurnLeftEnd = useCallback(() => {
		turnLeftRef.current = false;
	}, []);
	const handleAirplaneTurnRightStart = useCallback(() => {
		turnRightRef.current = true;
	}, []);
	const handleAirplaneTurnRightEnd = useCallback(() => {
		turnRightRef.current = false;
	}, []);

	const handleAirplaneSpeedUp = useCallback(() => {
		setAirplaneSpeed((s) => Math.min(s + AIRPLANE_SPEED_STEP, AIRPLANE_MAX_SPEED));
	}, []);
	const handleAirplaneSpeedDown = useCallback(() => {
		setAirplaneSpeed((s) => Math.max(s - AIRPLANE_SPEED_STEP, AIRPLANE_MIN_SPEED));
	}, []);

	// ── Zoom controls ─────────────────────────────────────────────────────────────

	const handleZoomIn = useCallback(() => {
		const newZoom = Math.min(mapZoomRef.current + 0.5, 22);
		setMapZoom(newZoom);
		sendToMapRef.current({ zoomTo: newZoom, easeDuration: 300 });
	}, []);

	const handleZoomOut = useCallback(() => {
		const newZoom = Math.max(mapZoomRef.current - 0.5, 1);
		setMapZoom(newZoom);
		sendToMapRef.current({ zoomTo: newZoom, easeDuration: 300 });
	}, []);

	// ── Reset to start position ───────────────────────────────────────────────────

	const handleReset = useCallback(() => {
		vehiclePosRef.current = centerPosition;
		setVehicleHeading(0);
		setAirplaneSpeed(AIRPLANE_DEFAULT_SPEED);
	}, [centerPosition]);

	// ── Speed label for airplane ──────────────────────────────────────────────────

	const speedLabel = useMemo(() => {
		// Map internal speed to a SPEED_DISPLAY_MIN–SPEED_DISPLAY_MAX scale for display
		const normalized = (airplaneSpeed - AIRPLANE_MIN_SPEED) / (AIRPLANE_MAX_SPEED - AIRPLANE_MIN_SPEED);
		const display = Math.round(SPEED_DISPLAY_MIN + normalized * (SPEED_DISPLAY_MAX - SPEED_DISPLAY_MIN));
		return `Speed ${display}/${SPEED_DISPLAY_MAX}`;
	}, [airplaneSpeed]);

	// ── Render ────────────────────────────────────────────────────────────────────

	return (
		<SafeAreaView style={styles.root}>
			{/* MapLibre map with native 70° pitch – no CSS transforms needed */}
			<View style={styles.mapWrapper}>
				{html ? (
					<WebView
						ref={webViewRef}
						source={{ html }}
						javaScriptEnabled={true}
						domStorageEnabled={true}
						originWhitelist={['*']}
						onMessage={handleMessage}
						onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
						style={styles.map}
					/>
				) : (
					<View style={styles.mapLoading}>
						<Text style={styles.mapLoadingText}>Loading map…</Text>
					</View>
				)}
			</View>

			{/* Vehicle overlay – rendered natively outside the WebView so the map
			    doesn't re-render on every heading/position tick.
			    The map always stays centred on the vehicle position, so placing the
			    icon at the screen centre is equivalent to pinning it to the map. */}
			<View style={styles.vehicleOverlay} pointerEvents="none">
				<SvgXml xml={createAirplaneSvg(vehicleHeading)} width={56} height={56} />
			</View>

			{/* Top bar: reset button + mode info */}
			<View style={styles.topBar} pointerEvents="box-none">
				<TouchableOpacity
					style={[styles.topBarButton, { backgroundColor: theme.screen.background }]}
					onPress={handleReset}
				>
					<MaterialIcons name="my-location" size={22} color={theme.screen.icon} />
				</TouchableOpacity>
				<View style={[styles.topBarInfo, { backgroundColor: theme.screen.background + 'dd' }]}>
					<Text style={[styles.topBarTitle, { color: theme.screen.text }]}>
						✈️ Flugzeug
					</Text>
					<Text style={[styles.topBarSub, { color: theme.screen.text + 'aa' }]}>
						{`${speedLabel} · Richtung ${Math.round(vehicleHeading)}°`}
					</Text>
				</View>
			</View>

			{/* Zoom buttons (left side) */}
			<View style={styles.zoomButtons} pointerEvents="box-none">
				<ControlButton
					onPress={handleZoomIn}
					icon={<MaterialIcons name="add" size={22} color="white" />}
					color="rgba(0,0,0,0.65)"
					size="md"
				/>
				<ControlButton
					onPress={handleZoomOut}
					icon={<MaterialIcons name="remove" size={22} color="white" />}
					color="rgba(0,0,0,0.65)"
					size="md"
				/>
			</View>

			{/* Airplane controls overlay (bottom-right) */}
			<View style={styles.controlsOverlay} pointerEvents="box-none">
				<AirplaneControls
					onTurnLeftStart={handleAirplaneTurnLeftStart}
					onTurnLeftEnd={handleAirplaneTurnLeftEnd}
					onTurnRightStart={handleAirplaneTurnRightStart}
					onTurnRightEnd={handleAirplaneTurnRightEnd}
					onSpeedUp={handleAirplaneSpeedUp}
					onSpeedDown={handleAirplaneSpeedDown}
				/>
			</View>
		</SafeAreaView>
	);
};

export default MapPlay;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: '#000',
	},
	mapWrapper: {
		flex: 1,
	},
	map: {
		flex: 1,
	},
	mapLoading: {
		flex: 1,
		backgroundColor: '#111',
		alignItems: 'center',
		justifyContent: 'center',
	},
	mapLoadingText: {
		color: '#fff',
		fontSize: 14,
	},
	topBar: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		padding: 12,
		gap: 10,
		zIndex: 30,
		elevation: 30,
	},
	topBarButton: {
		width: 40,
		height: 40,
		borderRadius: 20,
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	topBarInfo: {
		flex: 1,
		borderRadius: 12,
		paddingHorizontal: 14,
		paddingVertical: 6,
	},
	topBarTitle: {
		fontSize: 15,
		fontWeight: 'bold',
	},
	topBarSub: {
		fontSize: 12,
	},
	controlsOverlay: {
		position: 'absolute',
		bottom: 32,
		right: 16,
		zIndex: 30,
		elevation: 30,
	},
	zoomButtons: {
		position: 'absolute',
		bottom: 32,
		left: 16,
		zIndex: 30,
		elevation: 30,
		gap: 8,
	},
	vehicleOverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 20,
		elevation: 20,
	},
});
