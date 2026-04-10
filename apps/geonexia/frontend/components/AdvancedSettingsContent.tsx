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

	const handleReset = () => {
		dispatch(updateDisplaySettings({ routeSmoothingEnabled: DISPLAY_SETTINGS_DEFAULTS.routeSmoothingEnabled }));
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
				groupPosition="single"
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
