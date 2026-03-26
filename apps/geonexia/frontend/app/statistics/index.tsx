import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
	MaterialIcons,
	MaterialCommunityIcons,
	Ionicons,
	FontAwesome5,
} from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';
import { SPORT_TYPES, SportType, SportTypeDefinition } from '../../store/sportTypeSlice';

const PRIMARY_COLOR = '#2563eb';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
}

function formatDuration(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
	if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
	return `${s}s`;
}

function formatSpeed(kmh: number): string {
	return `${kmh.toFixed(1)} km/h`;
}

function formatPace(minPerKm: number): string {
	if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:-- /km';
	const m = Math.floor(minPerKm);
	const s = Math.round((minPerKm - m) * 60);
	return `${m}:${String(s).padStart(2, '0')} /km`;
}

// ─── Aggregate computation ────────────────────────────────────────────────────

type AggregateStats = {
	count: number;
	totalDistanceKm: number;
	totalDurationSeconds: number;
	maxSpeedKmh: number;
	totalAvgSpeedSum: number;
	bestPaceMinPerKm: number;
	totalElevationGainM: number;
	totalElevationLossM: number;
	totalKcal: number;
	totalSteps: number;
	totalFluidNeedsMl: number;
};

function computeStats(activities: SavedActivity[]): AggregateStats {
	const result: AggregateStats = {
		count: activities.length,
		totalDistanceKm: 0,
		totalDurationSeconds: 0,
		maxSpeedKmh: 0,
		totalAvgSpeedSum: 0,
		bestPaceMinPerKm: Infinity,
		totalElevationGainM: 0,
		totalElevationLossM: 0,
		totalKcal: 0,
		totalSteps: 0,
		totalFluidNeedsMl: 0,
	};

	for (const act of activities) {
		const s = act.stats;
		result.totalDistanceKm += s.distanceKm;
		result.totalDurationSeconds += s.durationSeconds;
		if (s.maxSpeedKmh > result.maxSpeedKmh) result.maxSpeedKmh = s.maxSpeedKmh;
		result.totalAvgSpeedSum += s.avgSpeedKmh;
		if (s.paceMinPerKm > 0 && s.paceMinPerKm < result.bestPaceMinPerKm) {
			result.bestPaceMinPerKm = s.paceMinPerKm;
		}
		result.totalElevationGainM += s.elevationGainM;
		result.totalElevationLossM += s.elevationLossM;
		result.totalKcal += s.kcal;
		result.totalSteps += s.steps;
		result.totalFluidNeedsMl += s.fluidNeedsMl;
	}

	return result;
}

// ─── Sport filter row ─────────────────────────────────────────────────────────

type SportFilterOption = { type: SportType | 'all'; label: string };

const ALL_OPTION: SportFilterOption = { type: 'all', label: 'Alle' };

function renderSportIcon(def: SportTypeDefinition, color: string): React.ReactElement {
	if (def.iconLibrary === 'MaterialCommunityIcons') {
		return (
			<MaterialCommunityIcons
				name={def.iconName as React.ComponentProps<typeof MaterialCommunityIcons>['name']}
				size={22}
				color={color}
			/>
		);
	}
	return (
		<MaterialIcons
			name={def.iconName as React.ComponentProps<typeof MaterialIcons>['name']}
			size={22}
			color={color}
		/>
	);
}

// ─── Statistics Screen ────────────────────────────────────────────────────────

export default function StatisticsScreen() {
	const { theme } = useTheme();
	const [activities, setActivities] = useState<SavedActivity[]>([]);
	const [selectedFilter, setSelectedFilter] = useState<SportType | 'all'>('all');
	const { show: showFilterModal, close: closeFilterModal } = useMyScrollViewModal();

	useFocusEffect(
		useCallback(() => {
			loadActivities()
				.then(setActivities)
				.catch((err) => console.warn('[StatisticsScreen] Failed to load activities:', err));
		}, []),
	);

	const filtered = selectedFilter === 'all'
		? activities
		: activities.filter((a) => a.sportType === selectedFilter);

	const stats = computeStats(filtered);
	const avgSpeed = stats.count > 0 ? stats.totalAvgSpeedSum / stats.count : 0;
	const bestPace = stats.bestPaceMinPerKm === Infinity ? 0 : stats.bestPaceMinPerKm;

	const currentFilterDef = SPORT_TYPES.find((s) => s.type === selectedFilter);
	const filterLabel = currentFilterDef?.label ?? 'Alle';
	const filterColor = currentFilterDef?.color ?? PRIMARY_COLOR;

	const openFilterModal = useCallback(() => {
		const options: SportFilterOption[] = [ALL_OPTION, ...SPORT_TYPES.map((s) => ({ type: s.type, label: s.label }))];
		showFilterModal({
			title: '🏅 Sport Kategorie',
			children: (
				<View>
					{options.map((opt, i) => {
						const position = i === 0 ? 'top' : i === options.length - 1 ? 'bottom' : 'middle';
						const sportDef = SPORT_TYPES.find((s) => s.type === opt.type);
						const bgColor = sportDef?.color ?? PRIMARY_COLOR;
						const icon = sportDef
							? renderSportIcon(sportDef, '#ffffff')
							: <Ionicons name="infinite-outline" size={22} color="#ffffff" />;
						return (
							<SettingsListSelectOptionSingle
								key={opt.type}
								label={opt.label}
								leftIcon={icon}
								iconBgColor={bgColor}
								selectionColor={bgColor}
								isSelected={selectedFilter === opt.type}
								onPress={() => {
									setSelectedFilter(opt.type);
									closeFilterModal();
								}}
								groupPosition={position}
							/>
						);
					})}
				</View>
			),
		});
	}, [showFilterModal, closeFilterModal, selectedFilter]);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.listContent}>

				{/* Sport category filter */}
				<SettingsListGroupTitle title="Filter" />
				<SettingsList
					iconBgColor={filterColor}
					leftIcon={
						currentFilterDef
							? renderSportIcon(currentFilterDef, '#ffffff')
							: <Ionicons name="infinite-outline" size={22} color="#ffffff" />
					}
					label="Sport Kategorie"
					value={filterLabel}
					rightIcon={<Ionicons name="chevron-forward" size={20} color="#9ca3af" />}
					handleFunction={openFilterModal}
					groupPosition="single"
				/>

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
					value={stats.count > 0 ? formatSpeed(stats.maxSpeedKmh) : '—'}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<MaterialCommunityIcons name="speedometer-medium" size={22} color="#ffffff" />}
					label="Ø Geschwindigkeit"
					value={stats.count > 0 ? formatSpeed(avgSpeed) : '—'}
					groupPosition="middle"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<MaterialIcons name="timer" size={22} color="#ffffff" />}
					label="Beste Pace"
					value={stats.count > 0 && bestPace > 0 ? formatPace(bestPace) : '—'}
					groupPosition="bottom"
				/>

				{/* Elevation */}
				<SettingsListGroupTitle title="Höhenprofil" />
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="trending-up-outline" size={22} color="#ffffff" />}
					label="Höhengewinn"
					value={stats.count > 0 ? `${Math.round(stats.totalElevationGainM)} m` : '—'}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="trending-down-outline" size={22} color="#ffffff" />}
					label="Höhenverlust"
					value={stats.count > 0 ? `${Math.round(stats.totalElevationLossM)} m` : '—'}
					groupPosition="bottom"
				/>

				{/* Health */}
				<SettingsListGroupTitle title="Gesundheit" />
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<MaterialCommunityIcons name="fire" size={22} color="#ffffff" />}
					label="Kalorien"
					value={stats.count > 0 ? `${Math.round(stats.totalKcal)} kcal` : '—'}
					groupPosition="top"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<FontAwesome5 name="shoe-prints" size={18} color="#ffffff" />}
					label="Schritte"
					value={stats.count > 0 ? stats.totalSteps.toLocaleString() : '—'}
					groupPosition="middle"
				/>
				<SettingsList
					iconBgColor={PRIMARY_COLOR}
					leftIcon={<Ionicons name="water-outline" size={22} color="#ffffff" />}
					label="Flüssigkeitsbedarf"
					value={stats.count > 0 ? `${Math.round(stats.totalFluidNeedsMl)} ml` : '—'}
					groupPosition="bottom"
				/>

				{stats.count === 0 && (
					<View style={styles.emptyContainer}>
						<Ionicons name="bar-chart-outline" size={40} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.icon }]}>
							{selectedFilter === 'all'
								? 'Keine Aktivitäten vorhanden'
								: `Keine ${filterLabel}-Aktivitäten vorhanden`}
						</Text>
					</View>
				)}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingVertical: 16,
	},
	emptyContainer: {
		alignItems: 'center',
		marginTop: 24,
		gap: 10,
	},
	emptyText: {
		fontSize: 15,
		textAlign: 'center',
	},
});
