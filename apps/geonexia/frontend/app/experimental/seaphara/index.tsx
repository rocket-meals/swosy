import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
	Animated,
	PanResponder,
	Platform,
	StyleSheet,
	View,
} from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { MyMap, MyMapHandle } from 'repo-depkit-common-ui';
import { useFocusEffect } from 'expo-router';

import { HEX_TILE_SCRIPT } from '../../../assets/hexTileScript';
import {
	isAvailable as isH3Available,
	latLngToCell,
	cellToBoundary,
	gridDisk,
	gridDistance,
} from '../../../helpers/H3Helper';

// ─── Constants ────────────────────────────────────────────────────────────────

const BOAT_MODEL_ID = 'seaphara-boat';

const H3_RESOLUTION = 4;
const H3_GEOJSON_ORDER = true; // [lng, lat] order, closes ring
const H3_MAX_CELLS = 500;

// H3 resolution 4: average edge length ≈ 22 606 m (source: h3geo.org/docs/core-library/restable)
const H3_RES4_EDGE_LENGTH_M = 22606.379;
// Hex field width (distance across flats) = edge × √3
const H3_RES4_HEX_WIDTH_M = H3_RES4_EDGE_LENGTH_M * Math.sqrt(3); // ≈ 39 143 m

// Boat model scale = half a hex field width
const BOAT_SCALE_M = H3_RES4_HEX_WIDTH_M / 2; // ≈ 19 572 m

// Movement: 0.1 tile-width per second
const MOVE_SPEED_M_PER_S = 0.1 * H3_RES4_HEX_WIDTH_M; // ≈ 3 914 m/s
const MOVE_INTERVAL_MS = 100;
const MOVE_M_PER_TICK = MOVE_SPEED_M_PER_S * (MOVE_INTERVAL_MS / 1000); // ≈ 391 m per tick

const LAT_DEG_PER_METER = 1 / 111320;

const INITIAL_ZOOM = 6;
// Start over the North Sea / Baltic approach
const INITIAL_POSITION = { lat: 55.0, lng: 10.0 };

const JOYSTICK_OUTER_RADIUS = 60;
const JOYSTICK_KNOB_RADIUS = 22;
const JOYSTICK_MAX_DISPLACEMENT = JOYSTICK_OUTER_RADIUS - JOYSTICK_KNOB_RADIUS;

// ─── Boat transform addon script ──────────────────────────────────────────────
// Runs AFTER hexTileScript has set up window._mapExtensions.onMessage.
// Chains into that handler so hex-grid messages continue to work while
// also handling the fast boat position/rotation updates.

const BOAT_TRANSFORM_SCRIPT = `
(function () {
  var _prevMsg = window._mapExtensions && window._mapExtensions.onMessage;
  window._mapExtensions.onMessage = function (data) {
    if (data.seapharaBoatTransform) {
      var t = data.seapharaBoatTransform;
      var mts = window.glbModelMts;
      if (mts && mts[t.id]) {
        var merc = maplibregl.MercatorCoordinate.fromLngLat([t.lng, t.lat], t.altitude || 0);
        mts[t.id].x = merc.x;
        mts[t.id].y = merc.y;
        mts[t.id].z = merc.z;
        if (t.rotateZ !== undefined) mts[t.id].rz = t.rotateZ;
        map && map.triggerRepaint();
      }
    }
    if (_prevMsg) _prevMsg.call(this, data);
  };
})();
`;

// Combined inject script: hex-tile grid + boat transform chain
const SEAPHARA_INJECT_SCRIPT = HEX_TILE_SCRIPT + '\n' + BOAT_TRANSFORM_SCRIPT;

// ─── H3 grid GeoJSON builder (resolution 4) ───────────────────────────────────

type ViewportBounds = { north: number; south: number; east: number; west: number };

function buildSeapharaH3GeoJson(bounds: ViewportBounds) {
	if (!isH3Available()) return { type: 'FeatureCollection', features: [] };
	const centerLat = (bounds.north + bounds.south) / 2;
	const centerLng = (bounds.east + bounds.west) / 2;
	const centerCell = latLngToCell(centerLat, centerLng, H3_RESOLUTION);

	const corners: [number, number][] = [
		[bounds.north, bounds.east],
		[bounds.north, bounds.west],
		[bounds.south, bounds.east],
		[bounds.south, bounds.west],
	];
	let maxK = 0;
	for (const [lat, lng] of corners) {
		try {
			const cornerCell = latLngToCell(lat, lng, H3_RESOLUTION);
			const dist = gridDistance(centerCell, cornerCell);
			if (dist > maxK) maxK = dist;
		} catch {
			// Skip unreachable corners
		}
	}

	const k = Math.min(maxK + 1, 15);
	const cells = gridDisk(centerCell, k);

	const features: object[] = [];
	for (const cell of cells) {
		if (features.length >= H3_MAX_CELLS) break;
		try {
			const boundary = cellToBoundary(cell, H3_GEOJSON_ORDER);
			if (boundary.length > 0) {
				features.push({
					type: 'Feature',
					geometry: { type: 'Polygon', coordinates: [boundary] },
					properties: { h3Index: cell, level: 0 },
				});
			}
		} catch {
			// Skip invalid cells
		}
	}

	return { type: 'FeatureCollection', features };
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SeapharaScreen() {
	const mapRef = useRef<MyMapHandle>(null);
	const mapMountedRef = useRef(false);
	const boatUrlCacheRef = useRef<string | null>(null);
	const boatPositionRef = useRef({ ...INITIAL_POSITION });

	const [mapKey, setMapKey] = useState(0);

	// Joystick animation values
	const knobX = useRef(new Animated.Value(0)).current;
	const knobY = useRef(new Animated.Value(0)).current;
	const knobOffsetRef = useRef({ x: 0, y: 0 });
	const joystickIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// Keep stopJoystick accessible from within the stable PanResponder
	const stopJoystickRef = useRef<() => void>(() => undefined);

	// ── Cleanup on screen blur ──────────────────────────────────────────────
	useFocusEffect(
		useCallback(() => {
			return () => {
				if (joystickIntervalRef.current) {
					clearInterval(joystickIntervalRef.current);
					joystickIntervalRef.current = null;
				}
				mapMountedRef.current = false;
				setMapKey((k) => k + 1);
			};
		}, []),
	);

	// ── Load boat GLB (cached as base64 data URI) ────────────────────────────
	const loadBoatUrl = useCallback(async (): Promise<string> => {
		if (boatUrlCacheRef.current) return boatUrlCacheRef.current;
		const asset = Asset.fromModule(require('../../../assets/3dmodels/boat-tow-b.glb'));
		await asset.downloadAsync();
		let url: string;
		if (Platform.OS === 'web') {
			url = asset.uri;
		} else {
			if (!asset.localUri) throw new Error('Asset localUri undefined after downloadAsync');
			const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
				encoding: FileSystem.EncodingType.Base64,
			});
			url = `data:model/gltf-binary;base64,${base64}`;
		}
		boatUrlCacheRef.current = url;
		return url;
	}, []);

	// ── Place boat model on the map ──────────────────────────────────────────
	const placeBoatOnMap = useCallback(
		async (pos: { lat: number; lng: number }) => {
			if (!mapMountedRef.current || !mapRef.current) return;
			try {
				const url = await loadBoatUrl();
				if (!mapMountedRef.current || !mapRef.current) return;
				mapRef.current.sendToMap({
					glbModels: [
						{
							id: BOAT_MODEL_ID,
							url,
							position: { lat: pos.lat, lng: pos.lng, altitude: 0 },
							scale: BOAT_SCALE_M,
							rotateX: Math.PI / 2,
							rotateY: 0,
							rotateZ: 0,
						},
					],
				});
			} catch (e) {
				console.warn('[Seaphara] Failed to load boat model:', e);
			}
		},
		[loadBoatUrl],
	);

	// ── Handle messages from the map ─────────────────────────────────────────
	const handleMapMessage = useCallback(
		(data: object) => {
			const msg = data as { tag?: string };
			if (msg.tag === 'MapComponentMounted') {
				mapMountedRef.current = true;
				// Activate hex tile grid (transparent fill, default stroke lines)
				mapRef.current?.sendToMap({
					hexTileLayer: { color: 'rgba(0, 0, 0, 0)', opacityMax: 0 },
				});
				placeBoatOnMap(boatPositionRef.current);
			} else if (msg.tag === 'MapViewportChanged') {
				const vp = msg as { bounds: ViewportBounds; zoom: number };
				try {
					const geoJson = buildSeapharaH3GeoJson(vp.bounds);
					mapRef.current?.sendToMap({ hexTileGeoJson: geoJson });
				} catch {
					// Ignore computation errors
				}
			}
		},
		[placeBoatOnMap],
	);

	// ── Joystick stop ────────────────────────────────────────────────────────
	const stopJoystick = useCallback(() => {
		if (joystickIntervalRef.current) {
			clearInterval(joystickIntervalRef.current);
			joystickIntervalRef.current = null;
		}
		knobOffsetRef.current = { x: 0, y: 0 };
		Animated.spring(knobX, { toValue: 0, useNativeDriver: true }).start();
		Animated.spring(knobY, { toValue: 0, useNativeDriver: true }).start();
	}, [knobX, knobY]);

	stopJoystickRef.current = stopJoystick;

	// ── Joystick PanResponder (created once, accesses data via refs) ─────────
	const panResponder = useRef(
		PanResponder.create({
			onStartShouldSetPanResponder: () => true,
			onMoveShouldSetPanResponder: () => true,
			onPanResponderGrant: () => {
				if (joystickIntervalRef.current) clearInterval(joystickIntervalRef.current);
				joystickIntervalRef.current = setInterval(() => {
					const pos = boatPositionRef.current;
					const { x, y } = knobOffsetRef.current;
					const dist = Math.sqrt(x * x + y * y);
					if (dist < 2) return;

					const ratio = Math.min(dist / JOYSTICK_MAX_DISPLACEMENT, 1.0);
					const metersPerTick = MOVE_M_PER_TICK * ratio;

					// Normalize direction: screen-right = east, screen-up = north
					const nx = x / dist; // east component
					const ny = -y / dist; // north component (screen y is inverted)

					// Bearing in radians clockwise from north (for rotateZ)
					const bearing = Math.atan2(nx, ny);

					const cosLat = Math.cos((pos.lat * Math.PI) / 180);
					const lngDegPerMeter = cosLat > 0.001 ? 1 / (111320 * cosLat) : 1 / 111320;

					const newLat = pos.lat + ny * metersPerTick * LAT_DEG_PER_METER;
					const newLng = pos.lng + nx * metersPerTick * lngDegPerMeter;

					boatPositionRef.current = { lat: newLat, lng: newLng };

					// Fast-path: update boat transform directly in the WebView
					mapRef.current?.sendToMap({
						seapharaBoatTransform: {
							id: BOAT_MODEL_ID,
							lat: newLat,
							lng: newLng,
							altitude: 0,
							rotateZ: bearing,
						},
					});

					// Smooth camera follow
					mapRef.current?.sendToMap({
						mapCenterPosition: { lat: newLat, lng: newLng },
						easeAnimation: true,
						easeDuration: MOVE_INTERVAL_MS,
					});
				}, MOVE_INTERVAL_MS);
			},
			onPanResponderMove: (_, gestureState) => {
				const dist = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
				let cx = gestureState.dx;
				let cy = gestureState.dy;
				if (dist > JOYSTICK_MAX_DISPLACEMENT) {
					cx = (cx / dist) * JOYSTICK_MAX_DISPLACEMENT;
					cy = (cy / dist) * JOYSTICK_MAX_DISPLACEMENT;
				}
				knobX.setValue(cx);
				knobY.setValue(cy);
				knobOffsetRef.current = { x: cx, y: cy };
			},
			onPanResponderRelease: () => stopJoystickRef.current(),
			onPanResponderTerminate: () => stopJoystickRef.current(),
		}),
	).current;

	useEffect(() => {
		return () => {
			if (joystickIntervalRef.current) clearInterval(joystickIntervalRef.current);
		};
	}, []);

	// ── Render ────────────────────────────────────────────────────────────────

	return (
		<View style={styles.container}>
			<MyMap
				key={mapKey}
				ref={mapRef}
				onMessage={handleMapMessage}
				injectScript={SEAPHARA_INJECT_SCRIPT}
				centerAtUserLocationIfNoInitialPosition={false}
				initialCenter={INITIAL_POSITION}
				initialZoom={INITIAL_ZOOM}
			/>

			{/* Joystick overlay – bottom-left */}
			<View style={styles.joystickContainer} pointerEvents="box-none">
				<View style={styles.joystickOuter} {...panResponder.panHandlers}>
					<Animated.View
						style={[
							styles.joystickKnob,
							{ transform: [{ translateX: knobX }, { translateY: knobY }] },
						]}
					/>
				</View>
			</View>
		</View>
	);
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	joystickContainer: {
		position: 'absolute',
		bottom: 32,
		left: 20,
		zIndex: 20,
		elevation: 20,
	},
	joystickOuter: {
		width: JOYSTICK_OUTER_RADIUS * 2,
		height: JOYSTICK_OUTER_RADIUS * 2,
		borderRadius: JOYSTICK_OUTER_RADIUS,
		backgroundColor: 'rgba(0, 0, 0, 0.30)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	joystickKnob: {
		width: JOYSTICK_KNOB_RADIUS * 2,
		height: JOYSTICK_KNOB_RADIUS * 2,
		borderRadius: JOYSTICK_KNOB_RADIUS,
		backgroundColor: 'rgba(255, 255, 255, 0.85)',
	},
});
