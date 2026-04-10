import React from 'react';
import { ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsList, SettingsListBoolean, SettingsListGroupTitle } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';

import { updateDisplaySettings, DISPLAY_SETTINGS_DEFAULTS } from '../store/displaySettingsSlice';
import type { AppDispatch, RootState } from '../store/store';

const MAP_COLOR = '#0891b2';
const RESET_COLOR = '#6b7280';

export default function AdvancedSettingsContent() {
	const dispatch = useDispatch<AppDispatch>();
	const routeSmoothingEnabled = useSelector((state: RootState) => state.displaySettings.routeSmoothingEnabled);
	const showGpsPoints = useSelector((state: RootState) => state.displaySettings.showGpsPoints);

	const handleReset = () => {
		dispatch(updateDisplaySettings({
			routeSmoothingEnabled: DISPLAY_SETTINGS_DEFAULTS.routeSmoothingEnabled,
			showGpsPoints: DISPLAY_SETTINGS_DEFAULTS.showGpsPoints,
		}));
	};

	return (
		<ScrollView>
			<SettingsListGroupTitle title="GPS" />
			<SettingsListBoolean
				leftIcon={<MaterialIcons name="my-location" size={22} color="#ffffff" />}
				iconBgColor={MAP_COLOR}
				label="GPS-Projektion auf Mittellinie"
				valueActive="Eingeschaltet"
				valueInactive="Ausgeschaltet"
				isEnabled={routeSmoothingEnabled}
				onToggle={() => dispatch(updateDisplaySettings({ routeSmoothingEnabled: !routeSmoothingEnabled }))}
				groupPosition="top"
			/>
			<SettingsListBoolean
				leftIcon={<MaterialIcons name="location-on" size={22} color="#ffffff" />}
				iconBgColor={MAP_COLOR}
				label="GPS-Punkte anzeigen"
				valueActive="Eingeschaltet"
				valueInactive="Ausgeschaltet"
				isEnabled={showGpsPoints}
				onToggle={() => dispatch(updateDisplaySettings({ showGpsPoints: !showGpsPoints }))}
				groupPosition="bottom"
			/>

			<SettingsListGroupTitle title="Aktionen" />
			<SettingsList
				leftIcon={<MaterialIcons name="restore" size={22} color="#ffffff" />}
				iconBgColor={RESET_COLOR}
				label="Auf Standard zurücksetzen"
				handleFunction={handleReset}
				groupPosition="single"
			/>
		</ScrollView>
	);
}
