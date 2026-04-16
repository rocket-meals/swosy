import React from 'react';
import { Text, View } from 'react-native';
import {
	MaterialIcons,
	MaterialCommunityIcons,
	Ionicons,
	FontAwesome5,
} from '@expo/vector-icons';
import { SettingsList, SettingsListGroupTitle, useTheme } from 'repo-depkit-common-ui';

import { SavedActivity } from '../../helpers/ActivityStorage';
import {
	computeStats,
	formatDistance,
	formatDuration,
	formatSpeed,
	formatPace,
} from '../../helpers/ActivityStatsHelper';

const PRIMARY_COLOR = '#2563eb';

type Props = {
	/** Activities to aggregate. Expected sorted newest-first. */
	activities: SavedActivity[];
	/** Optional label shown when activities list is empty. */
	emptyLabel?: string;
};

/**
 * Renders aggregate statistics for a list of activities as SettingsList rows,
 * grouped into the sections: Übersicht, Geschwindigkeit, Pace, Höhenprofil, Gesundheit.
 */
const ActivityAggregateStatsSection: React.FC<Props> = ({ activities, emptyLabel }) => {
	const { theme } = useTheme();

	if (activities.length === 0) {
		return (
			<View style={{ alignItems: 'center', marginTop: 24, gap: 10 }}>
				<Ionicons name="bar-chart-outline" size={40} color={theme.screen.icon} />
				<Text style={{ fontSize: 15, textAlign: 'center', color: theme.screen.icon }}>
					{emptyLabel ?? 'Keine Aktivitäten vorhanden'}
				</Text>
			</View>
		);
	}

	const stats = computeStats(activities);
	const avgSpeed = stats.totalAvgSpeedSum / stats.count;
	const bestPace = stats.bestPaceMinPerKm === Infinity ? 0 : stats.bestPaceMinPerKm;

	return (
		<>
			{/* Overview */}
			<SettingsListGroupTitle title="Übersicht" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<Ionicons name="bar-chart-outline" size={22} color="#ffffff" />}
				label="Aktivitäten"
				value={String(stats.count)}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialIcons name="straighten" size={22} color="#ffffff" />}
				label="Gesamtstrecke"
				value={formatDistance(stats.totalDistanceKm)}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<Ionicons name="time-outline" size={22} color="#ffffff" />}
				label="Gesamtdauer"
				value={formatDuration(stats.totalDurationSeconds)}
				groupPosition="bottom"
			/>

			{/* Speed */}
			<SettingsListGroupTitle title="Geschwindigkeit" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialCommunityIcons name="speedometer" size={22} color="#ffffff" />}
				label="Höchstgeschwindigkeit"
				value={formatSpeed(stats.maxSpeedKmh)}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialCommunityIcons name="speedometer-medium" size={22} color="#ffffff" />}
				label="Durchschnittliche Geschwindigkeit"
				value={formatSpeed(avgSpeed)}
				groupPosition="bottom"
			/>

			{/* Pace */}
			<SettingsListGroupTitle title="Pace" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialIcons name="timer" size={22} color="#ffffff" />}
				label="Beste Pace"
				value={bestPace > 0 ? formatPace(bestPace) : '—'}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialIcons name="timer" size={22} color="#ffffff" />}
				label="Durchschnittliche Pace"
				value={stats.avgPaceMinPerKm > 0 ? formatPace(stats.avgPaceMinPerKm) : '—'}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialIcons name="timer" size={22} color="#ffffff" />}
				label="Letzte Pace"
				value={stats.lastPaceMinPerKm > 0 ? formatPace(stats.lastPaceMinPerKm) : '—'}
				groupPosition="bottom"
			/>

			{/* Elevation */}
			<SettingsListGroupTitle title="Höhenprofil" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<Ionicons name="trending-up-outline" size={22} color="#ffffff" />}
				label="Höhengewinn"
				value={`${Math.round(stats.totalElevationGainM)} m`}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<Ionicons name="trending-down-outline" size={22} color="#ffffff" />}
				label="Höhenverlust"
				value={`${Math.round(stats.totalElevationLossM)} m`}
				groupPosition="bottom"
			/>

			{/* Health */}
			<SettingsListGroupTitle title="Gesundheit" />
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<MaterialCommunityIcons name="fire" size={22} color="#ffffff" />}
				label="Kalorien"
				value={`${Math.round(stats.totalKcal)} kcal`}
				groupPosition="top"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<FontAwesome5 name="shoe-prints" size={18} color="#ffffff" />}
				label="Schritte"
				value={stats.totalSteps.toLocaleString()}
				groupPosition="middle"
			/>
			<SettingsList
				iconBgColor={PRIMARY_COLOR}
				leftIcon={<Ionicons name="water-outline" size={22} color="#ffffff" />}
				label="Flüssigkeitsbedarf"
				value={`${Math.round(stats.totalFluidNeedsMl)} ml`}
				groupPosition="bottom"
			/>
		</>
	);
};

export default ActivityAggregateStatsSection;
