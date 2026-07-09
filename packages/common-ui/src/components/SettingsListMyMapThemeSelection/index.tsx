import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { MapStyleKey, MAP_STYLE_DEFINITIONS } from '../MyMap/MyMapHelper';
import MyMap from '../MyMap';
import SettingsList from '../SettingsList';
import type { SettingsListItemBaseProps } from '../SettingsList/types';
import CardWithText from '../CardWithText';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import { useTheme } from '../../context/ThemeContext';

const DEFAULT_MAP_PREVIEW_CENTER = { lat: 52.662231, lng: 8.1244 };
const DEFAULT_MAP_PREVIEW_ZOOM = 14;
const DEFAULT_ACCENT_COLOR = '#0891b2';

const _noop = () => {};

/** Map style selection + preview state, shared between the settings-list trigger and its modal content. */
type MapThemeSelectionState = {
	selectedMapStyleKey: MapStyleKey;
	onMapStyleKeyChange: (key: MapStyleKey) => void;
	accentColor?: string;
	mapPreviewCenter?: { lat: number; lng: number };
	mapPreviewZoom?: number;
};

export type SettingsListMyMapThemeSelectionProps = MapThemeSelectionState &
	Pick<SettingsListItemBaseProps, 'leftIcon' | 'iconBgColor' | 'label'> & {
		groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
		modalTitle?: string;
		nativeID?: string;
		/** Whether the user has consented to OSM map data loading. Defaults to true (no gate). */
		osmConsent?: boolean;
		/** Called when the user grants OSM consent inside the selection modal. */
		onOsmConsentChange?: (value: boolean) => void;
	};

type OsmConsentGateProps = {
	onConsent: () => void;
};

const OsmConsentGate: React.FC<OsmConsentGateProps> = ({ onConsent }) => {
	const { theme } = useTheme();
	return (
		<View style={{ paddingHorizontal: 16, paddingVertical: 24, alignItems: 'center' }}>
			<MaterialCommunityIcons name="map-marker-radius" size={56} color={theme.screen.icon} style={{ marginBottom: 16 }} />
			<Text style={{ color: theme.screen.text, fontSize: 17, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 }}>
				Kartenanzeige mit OpenStreetMap
			</Text>
			<Text style={{ color: theme.screen.text, fontSize: 14, textAlign: 'center', marginBottom: 8, lineHeight: 20 }}>
				Diese Karte lädt Kartendaten von <Text style={{ fontWeight: 'bold' }}>OpenStreetMap</Text> (openstreetmap.org) und <Text style={{ fontWeight: 'bold' }}>OpenFreeMap</Text> (openfreemap.org). Dabei werden Daten wie deine IP-Adresse an Server der OpenStreetMap Foundation und Protomaps LLC übertragen.
			</Text>
			<Text style={{ color: theme.screen.text + 'aa', fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 18 }}>
				Deine Zustimmung wird gespeichert und kann jederzeit in den Karten-Einstellungen widerrufen werden.
			</Text>
			<SettingsList
				title="Kartendaten laden (Zustimmen)"
				leftIcon={<MaterialCommunityIcons name="check-circle-outline" size={22} color={theme.screen.icon} />}
				rightIcon={<Entypo name="chevron-small-right" size={24} color={theme.screen.icon} />}
				onPress={onConsent}
				groupPosition="single"
			/>
		</View>
	);
};

type MapThemeGridProps = MapThemeSelectionState & {
	accentColor: string;
	mapPreviewCenter: { lat: number; lng: number };
	mapPreviewZoom: number;
	closeModal: () => void;
};

const MapThemeGrid: React.FC<MapThemeGridProps> = ({
	selectedMapStyleKey,
	onMapStyleKeyChange,
	accentColor,
	mapPreviewCenter,
	mapPreviewZoom,
	closeModal,
}) => {
	const { theme } = useTheme();
	return (
		<View style={styles.mapThemeGrid}>
			{(Object.values(MapStyleKey) as MapStyleKey[]).map((key) => {
				const def = MAP_STYLE_DEFINITIONS[key];
				const isSelected = selectedMapStyleKey === key;
				return (
					<CardWithText
						key={key}
						containerStyle={[
							styles.mapThemeCard,
							{ backgroundColor: theme?.card?.background },
							isSelected
								? [styles.mapThemeCardSelected, { borderColor: accentColor }]
								: styles.mapThemeCardUnselected,
						]}
						onPress={() => {
							onMapStyleKeyChange(key);
							closeModal();
						}}
						imageChildren={
							<View style={styles.mapPreviewWrapper} pointerEvents="none">
								<MyMap
									mapStyleKey={key}
									centerAtUserLocationIfNoInitialPosition={false}
									initialCenter={mapPreviewCenter}
									initialZoom={mapPreviewZoom}
									hideLegalInfo={true}
									onMessage={_noop}
								/>
							</View>
						}
						bottomContent={
							<View style={styles.mapThemeCardLabel}>
								{isSelected ? (
									<Ionicons
										name="checkmark-circle"
										size={16}
										color={accentColor}
										style={styles.mapThemeCheckIcon}
									/>
								) : null}
								<Text
									style={[styles.mapThemeCardText, { color: theme.screen.text }]}
									numberOfLines={1}
								>
									{def.label}
								</Text>
							</View>
						}
					/>
				);
			})}
		</View>
	);
};

type MapThemeSelectionModalContentProps = MapThemeGridProps & {
	initialHasConsent: boolean;
	onOsmConsentChange?: (value: boolean) => void;
};

const MapThemeSelectionModalContent: React.FC<MapThemeSelectionModalContentProps> = ({
	initialHasConsent,
	selectedMapStyleKey,
	onMapStyleKeyChange,
	onOsmConsentChange,
	accentColor,
	mapPreviewCenter,
	mapPreviewZoom,
	closeModal,
}) => {
	const [hasConsent, setHasConsent] = useState(initialHasConsent);

	const handleConsent = () => {
		setHasConsent(true);
		onOsmConsentChange?.(true);
	};

	if (!hasConsent) {
		return <OsmConsentGate onConsent={handleConsent} />;
	}

	return (
		<MapThemeGrid
			selectedMapStyleKey={selectedMapStyleKey}
			onMapStyleKeyChange={onMapStyleKeyChange}
			accentColor={accentColor}
			mapPreviewCenter={mapPreviewCenter}
			mapPreviewZoom={mapPreviewZoom}
			closeModal={closeModal}
		/>
	);
};

const SettingsListMyMapThemeSelection: React.FC<SettingsListMyMapThemeSelectionProps> = ({
	selectedMapStyleKey,
	onMapStyleKeyChange,
	accentColor = DEFAULT_ACCENT_COLOR,
	groupPosition = 'single',
	mapPreviewCenter = DEFAULT_MAP_PREVIEW_CENTER,
	mapPreviewZoom = DEFAULT_MAP_PREVIEW_ZOOM,
	label = 'Map Style',
	modalTitle = '🗺️ Map Style',
	leftIcon,
	iconBgColor,
	nativeID,
	osmConsent = true,
	onOsmConsentChange,
}) => {
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const handleOpenSelection = useCallback(() => {
		showModal({
			title: modalTitle,
			disableHorizontalPadding: true,
			children: (
				<MapThemeSelectionModalContent
					initialHasConsent={osmConsent}
					selectedMapStyleKey={selectedMapStyleKey}
					onMapStyleKeyChange={onMapStyleKeyChange}
					onOsmConsentChange={onOsmConsentChange}
					accentColor={accentColor}
					mapPreviewCenter={mapPreviewCenter}
					mapPreviewZoom={mapPreviewZoom}
					closeModal={closeModal}
				/>
			),
		});
	}, [showModal, closeModal, selectedMapStyleKey, onMapStyleKeyChange, accentColor, mapPreviewCenter, mapPreviewZoom, modalTitle, osmConsent, onOsmConsentChange]);

	return (
		<SettingsList
			leftIcon={leftIcon}
			iconBgColor={iconBgColor}
			label={label}
			value={MAP_STYLE_DEFINITIONS[selectedMapStyleKey]?.label ?? ''}
			rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
			onPress={handleOpenSelection}
			groupPosition={groupPosition}
			nativeID={nativeID}
		/>
	);
};

const styles = StyleSheet.create({
	mapThemeGrid: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 8,
		paddingHorizontal: 16,
		paddingBottom: 8,
	},
	mapThemeCard: {
		width: '30%',
	},
	mapThemeCardSelected: {
		borderWidth: 2,
	},
	mapThemeCardUnselected: {
		borderWidth: 2,
		borderColor: 'transparent',
	},
	mapPreviewWrapper: {
		flex: 1,
	},
	mapThemeCardLabel: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
	},
	mapThemeCheckIcon: {
		flexShrink: 0,
	},
	mapThemeCardText: {
		fontSize: 13,
		fontWeight: '600',
		flexShrink: 1,
	},
});

export default SettingsListMyMapThemeSelection;
