import React from 'react';
import { ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsList, SettingsListBoolean, SettingsListGroupTitle, SettingsListSelectOption, SettingsListSelectOptionItem } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';

import { updateDisplaySettings, DISPLAY_SETTINGS_DEFAULTS } from '../store/displaySettingsSlice';
import type { RouteSmoothingLevel } from '../helpers/RouteSmootherHelper';
import type { AppDispatch, RootState } from '../store/store';

const MAP_COLOR = '#0891b2';
const RESET_COLOR = '#6b7280';

const ROUTE_SMOOTHING_OPTIONS: SettingsListSelectOptionItem<RouteSmoothingLevel>[] = [
	{ id: 'off', label: 'Aus', icon: <MaterialIcons name="block" size={22} color="#ffffff" /> },
	{ id: 'light', label: 'Leicht', icon: <MaterialIcons name="blur-on" size={22} color="#ffffff" /> },
	{ id: 'strong', label: 'Stark', icon: <MaterialIcons name="blur-circular" size={22} color="#ffffff" /> },
];

export default function AdvancedSettingsContent() {
	const dispatch = useDispatch<AppDispatch>();
	const routeSmoothingLevel = useSelector((state: RootState) => state.displaySettings.routeSmoothingLevel);
	const showGpsPoints = useSelector((state: RootState) => state.displaySettings.showGpsPoints);

	const handleReset = () => {
		dispatch(updateDisplaySettings({
			routeSmoothingLevel: DISPLAY_SETTINGS_DEFAULTS.routeSmoothingLevel,
			showGpsPoints: DISPLAY_SETTINGS_DEFAULTS.showGpsPoints,
		}));
	};

	return (
		<ScrollView>
			<SettingsListGroupTitle title="GPS" />
			<SettingsListBoolean
				leftIcon={<MaterialIcons name="location-on" size={22} color="#ffffff" />}
				iconBgColor={MAP_COLOR}
				label="GPS-Punkte anzeigen"
				valueActive="Eingeschaltet"
				valueInactive="Ausgeschaltet"
				isEnabled={showGpsPoints}
				onToggle={() => dispatch(updateDisplaySettings({ showGpsPoints: !showGpsPoints }))}
				groupPosition="single"
			/>

			<SettingsListGroupTitle title="GPS-Projektion auf Mittellinie" />
			<SettingsListSelectOption
				options={ROUTE_SMOOTHING_OPTIONS}
				selectedOption={routeSmoothingLevel}
				onSelect={(option) => dispatch(updateDisplaySettings({ routeSmoothingLevel: option.id }))}
				iconBgColor={MAP_COLOR}
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
