import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import MyMap from '@/components/MyMap/MyMap';
import { MapLayer, MapMarker } from '@/components/MyMap/model';
import { useTheme } from '@/hooks/useTheme';
import { DatabaseTypes } from 'repo-depkit-common';
import { MARKER_DEFAULT_SIZE } from '@/components/MyMap/markerUtils';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { TranslationKeys } from '@/locales/keys';
import { MaterialIcons } from '@expo/vector-icons';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';

// ─── Types ────────────────────────────────────────────────────────────────────

type GameMode = 'selector' | 'airplane' | 'car';

type Position = { lat: number; lng: number };

// ─── Constants ────────────────────────────────────────────────────────────────

const TILT_DEG = 30;
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

// Car
const CAR_MOVE_STEP = 0.00006; // degrees per button tap
const CAR_TURN_DEG = 10; // degrees per button tap

// UI / visual constants
const MAX_BUILDING_LABEL_LENGTH = 4;
const PERSPECTIVE_VALUE = 900;
const SPEED_DISPLAY_MIN = 1;
const SPEED_DISPLAY_MAX = 10;

const DEFAULT_TILE_LAYER: MapLayer = {
	layerType: 'TileLayer',
	url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
	baseLayerName: 'OpenStreetMap',
	baseLayerIsChecked: true,
};

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

/** Car top-down marker with heading rotation. */
function createCarSvg(heading: number): string {
	const size = 44;
	const cx = size / 2;
	const cy = size / 2;
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <g transform="translate(${cx},${cy}) rotate(${heading})">
      <!-- Car body -->
      <rect x="-8" y="-14" width="16" height="28" rx="4" fill="#e53935" stroke="white" stroke-width="1.5"/>
      <!-- Windshield -->
      <rect x="-6" y="-9" width="12" height="6" rx="2" fill="rgba(180,215,255,0.85)"/>
      <!-- Rear window -->
      <rect x="-6" y="5" width="12" height="5" rx="2" fill="rgba(180,215,255,0.7)"/>
      <!-- Front-left wheel -->
      <rect x="-11" y="-11" width="4" height="6" rx="1.5" fill="#333"/>
      <!-- Front-right wheel -->
      <rect x="7" y="-11" width="4" height="6" rx="1.5" fill="#333"/>
      <!-- Rear-left wheel -->
      <rect x="-11" y="5" width="4" height="6" rx="1.5" fill="#333"/>
      <!-- Rear-right wheel -->
      <rect x="7" y="5" width="4" height="6" rx="1.5" fill="#333"/>
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

// ─── Mode Selector ────────────────────────────────────────────────────────────

type ModeSelectorProps = {
	onSelect: (mode: 'airplane' | 'car') => void;
	theme: ReturnType<typeof useTheme>['theme'];
};

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect, theme }) => (
	<View style={[selectorStyles.container, { backgroundColor: theme.screen.background }]}>
		<Text style={[selectorStyles.title, { color: theme.screen.text }]}>
			🗺️ Map Play
		</Text>
		<Text style={[selectorStyles.subtitle, { color: theme.screen.text + 'aa' }]}>
			Experimenteller Spielmodus – Wähle ein Fahrzeug
		</Text>
		<View style={selectorStyles.modeRow}>
			<TouchableOpacity
				style={[selectorStyles.modeCard, { backgroundColor: '#1a73e8' }]}
				onPress={() => onSelect('airplane')}
				activeOpacity={0.8}
			>
				<Text style={selectorStyles.modeEmoji}>✈️</Text>
				<Text style={selectorStyles.modeLabel}>Flugzeug</Text>
				<Text style={selectorStyles.modeDesc}>
					Automatische Geschwindigkeit{'\n'}Throttle-Steuerung
				</Text>
			</TouchableOpacity>
			<TouchableOpacity
				style={[selectorStyles.modeCard, { backgroundColor: '#e53935' }]}
				onPress={() => onSelect('car')}
				activeOpacity={0.8}
			>
				<Text style={selectorStyles.modeEmoji}>🚗</Text>
				<Text style={selectorStyles.modeLabel}>Auto</Text>
				<Text style={selectorStyles.modeDesc}>
					Manuelle Steuerung{'\n'}Gas & Lenkung
				</Text>
			</TouchableOpacity>
		</View>
	</View>
);

const selectorStyles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 24,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 8,
		textAlign: 'center',
	},
	subtitle: {
		fontSize: 14,
		marginBottom: 36,
		textAlign: 'center',
	},
	modeRow: {
		flexDirection: 'row',
		gap: 16,
		width: '100%',
	},
	modeCard: {
		flex: 1,
		borderRadius: 16,
		padding: 20,
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 8,
		elevation: 6,
	},
	modeEmoji: {
		fontSize: 44,
		marginBottom: 10,
	},
	modeLabel: {
		fontSize: 18,
		fontWeight: 'bold',
		color: 'white',
		marginBottom: 6,
	},
	modeDesc: {
		fontSize: 11,
		color: 'rgba(255,255,255,0.85)',
		textAlign: 'center',
		lineHeight: 16,
	},
});

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

// ─── Car Controls ─────────────────────────────────────────────────────────────

type CarControlsProps = {
	onForward: () => void;
	onBackward: () => void;
	onTurnLeft: () => void;
	onTurnRight: () => void;
};

const CarControls: React.FC<CarControlsProps> = ({
	onForward,
	onBackward,
	onTurnLeft,
	onTurnRight,
}) => (
	<View style={controlStyles.carLayout}>
		{/* Up */}
		<View style={controlStyles.carRow}>
			<View style={controlStyles.carSpacer} />
			<ControlButton onPress={onForward} label="▲" color="rgba(229,57,53,0.85)" size="lg" />
			<View style={controlStyles.carSpacer} />
		</View>
		{/* Middle row: left · center · right */}
		<View style={controlStyles.carRow}>
			<ControlButton onPress={onTurnLeft} label="◀" color="rgba(229,57,53,0.85)" size="lg" />
			<View style={controlStyles.carCenter} />
			<ControlButton onPress={onTurnRight} label="▶" color="rgba(229,57,53,0.85)" size="lg" />
		</View>
		{/* Down */}
		<View style={controlStyles.carRow}>
			<View style={controlStyles.carSpacer} />
			<ControlButton onPress={onBackward} label="▼" color="rgba(100,100,100,0.85)" size="lg" />
			<View style={controlStyles.carSpacer} />
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
	carLayout: {
		flexDirection: 'column',
		alignItems: 'center',
	},
	carRow: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	carSpacer: {
		width: 64,
	},
	carCenter: {
		width: 58,
		height: 58,
		margin: 3,
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

	// ── Game state ──────────────────────────────────────────────────────────────

	const [gameMode, setGameMode] = useState<GameMode>('selector');
	const [vehiclePos, setVehiclePos] = useState<Position>(POSITION_BUNDESTAG);
	const [vehicleHeading, setVehicleHeading] = useState(0); // 0 = North
	const [airplaneSpeed, setAirplaneSpeed] = useState(AIRPLANE_DEFAULT_SPEED);
	const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);

	// Refs so the game loop always reads the latest values without recreating the interval
	const vehicleHeadingRef = useRef(vehicleHeading);
	vehicleHeadingRef.current = vehicleHeading;

	const airplaneSpeedRef = useRef(airplaneSpeed);
	airplaneSpeedRef.current = airplaneSpeed;

	// Refs for held-button state (continuous turning)
	const turnLeftRef = useRef(false);
	const turnRightRef = useRef(false);

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

	// ── Start game mode ──────────────────────────────────────────────────────────

	const handleSelectMode = useCallback(
		(mode: 'airplane' | 'car') => {
			setVehiclePos(centerPosition);
			setVehicleHeading(0);
			setAirplaneSpeed(AIRPLANE_DEFAULT_SPEED);
			setGameMode(mode);
		},
		[centerPosition],
	);

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

	// ── Vehicle marker ────────────────────────────────────────────────────────────

	const vehicleMarkers = useMemo((): MapMarker[] => {
		if (gameMode === 'selector') return [];
		const isAirplane = gameMode === 'airplane';
		const size = isAirplane ? 56 : 44;
		const icon = isAirplane
			? createAirplaneSvg(vehicleHeading)
			: createCarSvg(vehicleHeading);
		return [
			{
				id: 'vehicle',
				position: vehiclePos,
				icon,
				size: [size, size] as [number, number],
				iconAnchor: [size / 2, size / 2] as [number, number],
			},
		];
	}, [gameMode, vehiclePos, vehicleHeading]);

	// ── Airplane game loop ────────────────────────────────────────────────────────

	useEffect(() => {
		if (gameMode !== 'airplane') return;
		const id = setInterval(() => {
			// Continuous turning when turn buttons are held
			if (turnLeftRef.current) {
				setVehicleHeading((h) => normalizeHeading(h - AIRPLANE_TURN_DEG));
			} else if (turnRightRef.current) {
				setVehicleHeading((h) => normalizeHeading(h + AIRPLANE_TURN_DEG));
			}
			// Auto forward movement using the latest heading and speed from refs
			const heading = vehicleHeadingRef.current;
			const speed = airplaneSpeedRef.current;
			setVehiclePos((pos) => moveByHeading(pos, heading, speed));
		}, GAME_TICK_MS);
		return () => clearInterval(id);
	}, [gameMode]); // Only depends on gameMode; heading/speed read via refs

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

	// ── Car controls ──────────────────────────────────────────────────────────────

	const handleCarForward = useCallback(() => {
		setVehiclePos((pos) => moveByHeading(pos, vehicleHeadingRef.current, CAR_MOVE_STEP));
	}, []);

	const handleCarBackward = useCallback(() => {
		setVehiclePos((pos) => moveByHeading(pos, vehicleHeadingRef.current + 180, CAR_MOVE_STEP));
	}, []);

	const handleCarTurnLeft = useCallback(() => {
		setVehicleHeading((h) => normalizeHeading(h - CAR_TURN_DEG));
	}, []);

	const handleCarTurnRight = useCallback(() => {
		setVehicleHeading((h) => normalizeHeading(h + CAR_TURN_DEG));
	}, []);

	// ── Back to mode selector ─────────────────────────────────────────────────────

	const handleReset = useCallback(() => {
		setGameMode('selector');
	}, []);

	// ── Speed label for airplane ──────────────────────────────────────────────────

	const speedLabel = useMemo(() => {
		// Map internal speed to a SPEED_DISPLAY_MIN–SPEED_DISPLAY_MAX scale for display
		const normalized = (airplaneSpeed - AIRPLANE_MIN_SPEED) / (AIRPLANE_MAX_SPEED - AIRPLANE_MIN_SPEED);
		const display = Math.round(SPEED_DISPLAY_MIN + normalized * (SPEED_DISPLAY_MAX - SPEED_DISPLAY_MIN));
		return `Speed ${display}/${SPEED_DISPLAY_MAX}`;
	}, [airplaneSpeed]);

	// ── Render: Mode Selector ─────────────────────────────────────────────────────

	if (gameMode === 'selector') {
		return (
			<SafeAreaView style={{ flex: 1 }}>
				<ModeSelector onSelect={handleSelectMode} theme={theme} />
			</SafeAreaView>
		);
	}

	const isAirplane = gameMode === 'airplane';

	// ── Render: Game Screen ───────────────────────────────────────────────────────

	return (
		<SafeAreaView style={styles.root}>
			{/* Tilted map container – 30° perspective tilt */}
			<View style={styles.mapWrapper}>
				<View style={styles.tiltContainer}>
					<MyMap
						key={`map-play-${gameMode}`}
						mapCenterPosition={vehiclePos}
						zoom={mapZoom}
						mapMarkers={buildingMarkers}
						noClusterMarkers={vehicleMarkers}
						mapLayers={[DEFAULT_TILE_LAYER]}
						useFlyAnimation={false}
						onMapEvent={(e) => {
							if (e.tag === 'onZoomEnd') setMapZoom(e.zoom);
						}}
					/>
				</View>
			</View>

			{/* Top bar: back button + mode info */}
			<View style={styles.topBar} pointerEvents="box-none">
				<TouchableOpacity
					style={[styles.topBarButton, { backgroundColor: theme.screen.background }]}
					onPress={handleReset}
				>
					<MaterialIcons name="arrow-back" size={22} color={theme.screen.icon} />
				</TouchableOpacity>
				<View style={[styles.topBarInfo, { backgroundColor: theme.screen.background + 'dd' }]}>
					<Text style={[styles.topBarTitle, { color: theme.screen.text }]}>
						{isAirplane ? '✈️ Flugzeug' : '🚗 Auto'}
					</Text>
					<Text style={[styles.topBarSub, { color: theme.screen.text + 'aa' }]}>
						{isAirplane
							? `${speedLabel} · Richtung ${Math.round(vehicleHeading)}°`
							: `Richtung ${Math.round(vehicleHeading)}°`}
					</Text>
				</View>
			</View>

			{/* Controls overlay */}
			<View style={styles.controlsOverlay} pointerEvents="box-none">
				{isAirplane ? (
					<AirplaneControls
						onTurnLeftStart={handleAirplaneTurnLeftStart}
						onTurnLeftEnd={handleAirplaneTurnLeftEnd}
						onTurnRightStart={handleAirplaneTurnRightStart}
						onTurnRightEnd={handleAirplaneTurnRightEnd}
						onSpeedUp={handleAirplaneSpeedUp}
						onSpeedDown={handleAirplaneSpeedDown}
					/>
				) : (
					<CarControls
						onForward={handleCarForward}
						onBackward={handleCarBackward}
						onTurnLeft={handleCarTurnLeft}
						onTurnRight={handleCarTurnRight}
					/>
				)}
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
		overflow: 'hidden',
	},
	tiltContainer: {
		flex: 1,
		// 30° perspective tilt simulating a pseudo-3D camera angle
		transform: [
			{ perspective: PERSPECTIVE_VALUE },
			{ rotateX: `${TILT_DEG}deg` },
		],
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
});
