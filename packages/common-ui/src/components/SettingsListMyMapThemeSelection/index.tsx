import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { MapStyleKey, MAP_STYLE_DEFINITIONS } from '../MyMap/MyMapHelper';
import MyMap from '../MyMap';
import SettingsList from '../SettingsList';
import CardWithText from '../CardWithText';
import { useMyScrollViewModal } from '../GlobalModal/useMyScrollViewModal';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';

const DEFAULT_MAP_PREVIEW_CENTER = { lat: 52.662231, lng: 8.1244 };
const DEFAULT_MAP_PREVIEW_ZOOM = 14;
const DEFAULT_ACCENT_COLOR = '#0891b2';

const _noop = () => {};

export type SettingsListMyMapThemeSelectionProps = {
	selectedMapStyleKey: MapStyleKey;
	onMapStyleKeyChange: (key: MapStyleKey) => void;
	accentColor?: string;
	groupPosition?: 'top' | 'middle' | 'bottom' | 'single';
	mapPreviewCenter?: { lat: number; lng: number };
	mapPreviewZoom?: number;
	label?: string;
	modalTitle?: string;
	leftIcon?: React.ReactNode;
	iconBgColor?: string;
};

const SettingsListMyMapThemeSelection: React.FC<SettingsListMyMapThemeSelectionProps> = ({
	selectedMapStyleKey,
	onMapStyleKeyChange,
	accentColor = DEFAULT_ACCENT_COLOR,
	groupPosition = 'single',
	mapPreviewCenter = DEFAULT_MAP_PREVIEW_CENTER,
	mapPreviewZoom = DEFAULT_MAP_PREVIEW_ZOOM,
	label,
	modalTitle,
	leftIcon,
	iconBgColor,
}) => {
	const { show: showModal, close: closeModal } = useMyScrollViewModal();
	const { theme } = useTheme();
	const { language, translate, translateDynamic } = useLanguage();

	const resolvedLabel = label ? translateDynamic(label) : translate(TranslationKeys.map_style);
	const resolvedModalTitle = modalTitle
		? translateDynamic(modalTitle)
		: translate(TranslationKeys.map_style_modal_title);

	const handleOpenSelection = useCallback(() => {
		showModal({
			title: resolvedModalTitle,
			disableHorizontalPadding: true,
			children: (
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
			),
		});
	}, [showModal, closeModal, selectedMapStyleKey, onMapStyleKeyChange, theme, accentColor, mapPreviewCenter, mapPreviewZoom, resolvedModalTitle]);

	return (
		<SettingsList
			leftIcon={leftIcon}
			iconBgColor={iconBgColor}
			label={resolvedLabel}
			value={MAP_STYLE_DEFINITIONS[selectedMapStyleKey]?.label ?? ''}
			rightIcon={<Octicons name={language === 'ar' ? 'chevron-left' : 'chevron-right'} size={24} color={theme.screen.icon} />}
			onPress={handleOpenSelection}
			groupPosition={groupPosition}
			titleTextAlign={language === 'ar' ? 'right' : 'left'}
			reverseLayout={language === 'ar'}
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
