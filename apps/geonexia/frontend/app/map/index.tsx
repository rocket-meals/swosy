import React, { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MapLocationButton, MapNorthButton, MyMap, MyMapHandle } from 'repo-depkit-common-ui';

const PRIMARY_COLOR = '#2563eb';

function OsmConsentScreen({ onConsent }: { onConsent: () => void }) {
	return (
		<ScrollView contentContainerStyle={styles.consentContainer}>
			<Ionicons name="map-outline" size={56} color={PRIMARY_COLOR} style={styles.consentIcon} />
			<Text style={styles.consentTitle}>Map display with OpenStreetMap</Text>
			<Text style={styles.consentBody}>
				This map loads map data from{' '}
				<Text style={styles.consentBold}>OpenStreetMap</Text>{' '}
				(openstreetmap.org) and{' '}
				<Text style={styles.consentBold}>OpenFreeMap</Text>{' '}
				(openfreemap.org). Data such as your IP address will be transmitted to
				servers of the OpenStreetMap Foundation and Protomaps LLC.
			</Text>
			<Text style={styles.consentNote}>
				You can reset your consent at any time by restarting the app or navigating away from the map screen.
			</Text>
			<TouchableOpacity style={styles.consentButton} onPress={onConsent} activeOpacity={0.8}>
				<Ionicons name="checkmark-circle-outline" size={20} color="#ffffff" />
				<Text style={styles.consentButtonText}>Load map data (Accept)</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

export default function MapScreen() {
	const [osmConsent, setOsmConsent] = useState(false);
	const mapRef = useRef<MyMapHandle>(null);

	const handleConsent = useCallback(() => {
		setOsmConsent(true);
	}, []);

	const handleMessage = useCallback((data: object) => {
		const msg = data as { tag?: string };
		if (msg.tag === 'MapComponentMounted') {
			// Enable the hexagonal territory tile layer for Geonexia.
			mapRef.current?.sendToMap({ hexTileLayer: { spacingMeters: 100 } });
		}
	}, []);

	if (!osmConsent) {
		return (
			<View style={styles.container}>
				<OsmConsentScreen onConsent={handleConsent} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<MyMap
				ref={mapRef}
				onMessage={handleMessage}
			/>
			<View style={styles.mapOverlayButtons} pointerEvents="box-none">
				<MapNorthButton
					mapRef={mapRef}
					backgroundColor="#ffffff"
					iconColor="#555555"
				/>
				<View style={styles.buttonSpacer} />
				<MapLocationButton
					mapRef={mapRef}
					backgroundColor="#ffffff"
					iconColor="#555555"
					activeColor={PRIMARY_COLOR}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#ffffff',
	},
	mapOverlayButtons: {
		position: 'absolute',
		top: 16,
		right: 12,
		zIndex: 20,
		elevation: 20,
		alignItems: 'center',
	},
	buttonSpacer: {
		height: 8,
	},
	consentContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingHorizontal: 24,
		paddingVertical: 32,
	},
	consentIcon: {
		marginBottom: 20,
	},
	consentTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#111111',
		textAlign: 'center',
		marginBottom: 14,
	},
	consentBody: {
		fontSize: 14,
		color: '#444444',
		textAlign: 'center',
		lineHeight: 22,
		marginBottom: 10,
	},
	consentBold: {
		fontWeight: '700',
	},
	consentNote: {
		fontSize: 13,
		color: '#888888',
		textAlign: 'center',
		lineHeight: 18,
		marginBottom: 28,
	},
	consentButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		backgroundColor: PRIMARY_COLOR,
		paddingVertical: 14,
		paddingHorizontal: 24,
		borderRadius: 10,
	},
	consentButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
});
