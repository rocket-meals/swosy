import React from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SettingsList, SettingsListBoolean, SettingsListGroupTitle, SettingsListSelectOption, SettingsListSelectOptionItem, horizontalScreenPadding, useTheme } from 'repo-depkit-common-ui';
import { useDispatch, useSelector } from 'react-redux';

import { updateDisplaySettings, DISPLAY_SETTINGS_DEFAULTS } from '../store/displaySettingsSlice';
import type { RouteSmoothingLevel } from '../helpers/RouteSmootherHelper';
import type { RoadMatchJunctionMode } from '../helpers/RoadMatchHelper';
import type { AppDispatch, RootState } from '../store/store';

const MAP_COLOR = '#0891b2';
const RESET_COLOR = '#6b7280';
const ROAD_MATCH_COLOR = '#eab308';

const ROUTE_SMOOTHING_OPTIONS: SettingsListSelectOptionItem<RouteSmoothingLevel>[] = [
	{ id: 'off', label: 'Aus', icon: <MaterialIcons name="block" size={22} color="#ffffff" /> },
	{ id: 'light', label: 'Leicht', icon: <MaterialIcons name="blur-on" size={22} color="#ffffff" /> },
	{ id: 'strong', label: 'Stark', icon: <MaterialIcons name="blur-circular" size={22} color="#ffffff" /> },
];

const ROAD_MATCH_JUNCTION_OPTIONS: SettingsListSelectOptionItem<RoadMatchJunctionMode>[] = [
	{ id: 'direct', label: 'Direkt', icon: <MaterialIcons name="trending-flat" size={22} color="#ffffff" /> },
	{ id: 'nearestEndpoint', label: 'Bis Straßenende', icon: <MaterialIcons name="turn-right" size={22} color="#ffffff" /> },
	{ id: 'network', label: 'Netzwerksuche', icon: <MaterialIcons name="hub" size={22} color="#ffffff" /> },
];

export default function AdvancedSettingsContent() {
	const { theme } = useTheme();
	const dispatch = useDispatch<AppDispatch>();
	const routeSmoothingLevel = useSelector((state: RootState) => state.displaySettings.routeSmoothingLevel);
	const showGpsPoints = useSelector((state: RootState) => state.displaySettings.showGpsPoints);
	const showRoadMatch = useSelector((state: RootState) => state.displaySettings.showRoadMatch);
	const roadMatchJunctionMode = useSelector((state: RootState) => state.displaySettings.roadMatchJunctionMode);

	const handleReset = () => {
		dispatch(updateDisplaySettings({
			routeSmoothingLevel: DISPLAY_SETTINGS_DEFAULTS.routeSmoothingLevel,
			showGpsPoints: DISPLAY_SETTINGS_DEFAULTS.showGpsPoints,
			showRoadMatch: DISPLAY_SETTINGS_DEFAULTS.showRoadMatch,
			roadMatchJunctionMode: DISPLAY_SETTINGS_DEFAULTS.roadMatchJunctionMode,
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

			<SettingsListGroupTitle title="Straßen/Wege-Abgleich" />
			<SettingsListBoolean
				leftIcon={<MaterialIcons name="alt-route" size={22} color="#ffffff" />}
				iconBgColor={ROAD_MATCH_COLOR}
				label="Auf Straße/Weg ausrichten"
				valueActive="Eingeschaltet"
				valueInactive="Ausgeschaltet"
				isEnabled={showRoadMatch}
				onToggle={() => dispatch(updateDisplaySettings({ showRoadMatch: !showRoadMatch }))}
				groupPosition="single"
			/>
			<Text style={[styles.hint, { color: theme.screen.icon }]}>
				Gleicht die aufgezeichnete Route mit dem echten Straßen- und Wegenetz ab und zeichnet das Ergebnis gelb ein – wie bei einer Navigationsroute. Die GPS-Punkte dienen dabei nur zur Erkennung, welche Straße bzw. welcher Weg gegangen wurde.
			</Text>

			<SettingsListGroupTitle title="Kreuzungsberechnung" />
			<SettingsListSelectOption
				options={ROAD_MATCH_JUNCTION_OPTIONS}
				selectedOption={roadMatchJunctionMode}
				onSelect={(option) => dispatch(updateDisplaySettings({ roadMatchJunctionMode: option.id }))}
				iconBgColor={ROAD_MATCH_COLOR}
			/>
			<Text style={[styles.hint, { color: theme.screen.icon }]}>
				Bestimmt, wie die gelbe Linie verbunden wird, wenn die Route von einer Straße/einem Weg auf eine andere wechselt. „Direkt" verbindet die beiden Punkte gerade. „Bis Straßenende" folgt der aktuellen Straße bis zu ihrem nächstgelegenen Ende und springt dann direkt zur nächsten. „Netzwerksuche" sucht den kürzesten Weg über das echte Straßen-/Wegenetz, auch über mehrere Straßen hinweg.
			</Text>

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

const styles = StyleSheet.create({
	hint: {
		fontSize: 12,
		lineHeight: 17,
		paddingHorizontal: horizontalScreenPadding,
		paddingTop: 6,
		paddingBottom: 4,
	},
});
