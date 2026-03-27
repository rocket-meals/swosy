import React, { useCallback, useMemo, useState } from 'react';
import {
	ScrollView,
	StyleSheet,
	Text,
	View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSelector } from 'react-redux';
import {
	Ionicons,
	MaterialCommunityIcons,
	MaterialIcons,
	FontAwesome5,
} from '@expo/vector-icons';
import { useTheme, SettingsListGroupTitle, SettingsListProgress } from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';
import { HexTileRecord } from '../../helpers/HexTileStorage';
import type { RootState } from '../../store/store';

const PRIMARY_COLOR = '#2563eb';
const ICON_FOREGROUND_COLOR = '#ffffff';

// ─── Achievement data model ────────────────────────────────────────────────────

type AchievementData = {
	activities: SavedActivity[];
	hexTileRecords: Record<string, HexTileRecord>;
};

type AchievementProgress = {
	current: number;
	goal: number;
};

type AchievementDefinition = {
	id: string;
	title: string;
	description: string;
	iconBgColor: string;
	category: string;
	renderIcon: (color: string) => React.ReactElement;
	getProgress: (data: AchievementData) => AchievementProgress;
	formatProgress?: (current: number, goal: number) => string;
};

// ─── Achievement definitions ───────────────────────────────────────────────────

const ACHIEVEMENTS: AchievementDefinition[] = [
	// ── Explorer ─────────────────────────────────────────────────────────────
	{
		id: 'first_tile',
		category: 'Erkunder',
		title: 'Pathfinder',
		description: 'Betrete dein erstes Hex-Feld.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <Ionicons name="footsteps-outline" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Math.min(1, Object.values(hexTileRecords).filter((r) => r.walkedOn).length),
			goal: 1,
		}),
	},
	{
		id: 'tiles_50',
		category: 'Erkunder',
		title: 'Nachbarschaftserkunder',
		description: 'Betrete 50 verschiedene Hex-Felder.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <Ionicons name="map-outline" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.walkedOn).length,
			goal: 50,
		}),
	},
	{
		id: 'tiles_200',
		category: 'Erkunder',
		title: 'Stadtentdecker',
		description: 'Betrete 200 verschiedene Hex-Felder.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <Ionicons name="navigate-outline" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.walkedOn).length,
			goal: 200,
		}),
	},
	{
		id: 'tiles_1000',
		category: 'Erkunder',
		title: 'Territoriumsherrscher',
		description: 'Betrete 1 000 verschiedene Hex-Felder.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="earth" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.walkedOn).length,
			goal: 1000,
		}),
	},
	{
		id: 'tiles_5000',
		category: 'Erkunder',
		title: 'Welteroberung',
		description: 'Betrete 5 000 verschiedene Hex-Felder.',
		iconBgColor: '#3b82f6',
		renderIcon: (color) => <MaterialCommunityIcons name="earth-plus" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.walkedOn).length,
			goal: 5000,
		}),
	},

	// ── Territorium ───────────────────────────────────────────────────────────
	{
		id: 'first_enclosure',
		category: 'Territorium',
		title: 'Loop-Künstler',
		description: 'Schließe zum ersten Mal eine Gebietsschleife.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <MaterialCommunityIcons name="vector-polygon" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Math.min(1, Object.values(hexTileRecords).filter((r) => r.enclosedCount > 0).length > 0 ? 1 : 0),
			goal: 1,
		}),
	},
	{
		id: 'enclosed_tiles_10',
		category: 'Territorium',
		title: 'Gebietsbauer',
		description: 'Schließe 10 Hex-Felder durch Schleifen ein.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <MaterialCommunityIcons name="hexagon-multiple-outline" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.enclosedCount > 0).length,
			goal: 10,
		}),
	},
	{
		id: 'enclosed_tiles_50',
		category: 'Territorium',
		title: 'Expansions-Experte',
		description: 'Schließe 50 Hex-Felder durch Schleifen ein.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="hexagon-multiple" size={22} color={color} />,
		getProgress: ({ hexTileRecords }) => ({
			current: Object.values(hexTileRecords).filter((r) => r.enclosedCount > 0).length,
			goal: 50,
		}),
	},

	// ── Erste Schritte / Aktivitäten ─────────────────────────────────────────
	{
		id: 'first_activity',
		category: 'Aktivitäten',
		title: 'Erste Schritte',
		description: 'Beende deine erste Aktivität.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <MaterialIcons name="directions-run" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: Math.min(1, activities.length),
			goal: 1,
		}),
	},
	{
		id: 'activities_10',
		category: 'Aktivitäten',
		title: 'Regelmäßiger Läufer',
		description: 'Beende 10 Aktivitäten.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <MaterialIcons name="event-repeat" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.length,
			goal: 10,
		}),
	},
	{
		id: 'activities_50',
		category: 'Aktivitäten',
		title: 'Eiserner Athlet',
		description: 'Beende 50 Aktivitäten.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <MaterialCommunityIcons name="medal-outline" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.length,
			goal: 50,
		}),
	},
	{
		id: 'activities_200',
		category: 'Aktivitäten',
		title: 'Veteran',
		description: 'Beende 200 Aktivitäten.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="medal" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.length,
			goal: 200,
		}),
	},

	// ── Distanz ───────────────────────────────────────────────────────────────
	{
		id: 'dist_5km',
		category: 'Distanz',
		title: '5-km-Club',
		description: 'Laufe insgesamt 5 km.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <MaterialIcons name="straighten" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.distanceKm, 0),
			goal: 5,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	{
		id: 'dist_halfmarathon',
		category: 'Distanz',
		title: 'Halbmarathon',
		description: 'Laufe insgesamt 21,1 km.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <MaterialIcons name="directions-run" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.distanceKm, 0),
			goal: 21.1,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	{
		id: 'dist_marathon',
		category: 'Distanz',
		title: 'Marathon',
		description: 'Laufe insgesamt 42,195 km.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <FontAwesome5 name="running" size={20} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.distanceKm, 0),
			goal: 42.195,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal.toFixed(1)} km`,
	},
	{
		id: 'dist_100km',
		category: 'Distanz',
		title: 'Century',
		description: 'Laufe insgesamt 100 km.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="road-variant" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.distanceKm, 0),
			goal: 100,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(1)} / ${goal} km`,
	},
	{
		id: 'dist_500km',
		category: 'Distanz',
		title: 'Ultra-Läufer',
		description: 'Laufe insgesamt 500 km.',
		iconBgColor: '#3b82f6',
		renderIcon: (color) => <MaterialCommunityIcons name="airplane-takeoff" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.distanceKm, 0),
			goal: 500,
		}),
		formatProgress: (cur, goal) => `${cur.toFixed(0)} / ${goal} km`,
	},

	// ── Geschwindigkeit ───────────────────────────────────────────────────────
	{
		id: 'pace_5',
		category: 'Geschwindigkeit',
		title: 'Speed-Demon',
		description: 'Laufe eine Aktivität mit einer Pace von unter 5:00 min/km.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <MaterialCommunityIcons name="speedometer" size={22} color={color} />,
		getProgress: ({ activities }) => {
			const best = activities
				.filter((a) => a.stats.paceMinPerKm > 0)
				.reduce((min, a) => Math.min(min, a.stats.paceMinPerKm), Infinity);
			return { current: best <= 5 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Freigeschaltet ✓' : 'Pace < 5:00 min/km'),
	},
	{
		id: 'pace_4',
		category: 'Geschwindigkeit',
		title: 'Sprint-König',
		description: 'Laufe eine Aktivität mit einer Pace von unter 4:00 min/km.',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="lightning-bolt" size={22} color={color} />,
		getProgress: ({ activities }) => {
			const best = activities
				.filter((a) => a.stats.paceMinPerKm > 0)
				.reduce((min, a) => Math.min(min, a.stats.paceMinPerKm), Infinity);
			return { current: best <= 4 ? 1 : 0, goal: 1 };
		},
		formatProgress: (cur) => (cur >= 1 ? 'Freigeschaltet ✓' : 'Pace < 4:00 min/km'),
	},

	// ── Höhenmeter ────────────────────────────────────────────────────────────
	{
		id: 'elevation_500',
		category: 'Höhenmeter',
		title: 'Bergsteiger',
		description: 'Sammle insgesamt 500 m Höhengewinn.',
		iconBgColor: '#cd7f32',
		renderIcon: (color) => <Ionicons name="trending-up-outline" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.elevationGainM, 0),
			goal: 500,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	{
		id: 'elevation_5000',
		category: 'Höhenmeter',
		title: 'Gipfelsucher',
		description: 'Sammle insgesamt 5 000 m Höhengewinn.',
		iconBgColor: '#9ca3af',
		renderIcon: (color) => <MaterialCommunityIcons name="image-filter-hdr" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.elevationGainM, 0),
			goal: 5000,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
	{
		id: 'elevation_20000',
		category: 'Höhenmeter',
		title: 'Gipfelmeister',
		description: 'Sammle insgesamt 20 000 m Höhengewinn – die Höhe des Mount Everest und mehr!',
		iconBgColor: '#f59e0b',
		renderIcon: (color) => <MaterialCommunityIcons name="summit" size={22} color={color} />,
		getProgress: ({ activities }) => ({
			current: activities.reduce((sum, a) => sum + a.stats.elevationGainM, 0),
			goal: 20000,
		}),
		formatProgress: (cur, goal) => `${Math.round(cur)} / ${goal} m`,
	},
];

// Group achievements by category preserving insertion order
const CATEGORY_ORDER = ['Erkunder', 'Territorium', 'Aktivitäten', 'Distanz', 'Geschwindigkeit', 'Höhenmeter'];

// ─── Helper functions ──────────────────────────────────────────────────────────

function isUnlocked(def: AchievementDefinition, data: AchievementData): boolean {
	const { current, goal } = def.getProgress(data);
	return current >= goal;
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type AchievementCardProps = {
	definition: AchievementDefinition;
	data: AchievementData;
	index: number;
	total: number;
};

function AchievementCard({ definition, data, index, total }: AchievementCardProps) {
	const unlocked = isUnlocked(definition, data);
	const { current, goal } = definition.getProgress(data);
	const progress = Math.min(1, current / goal);
	const iconBg = unlocked ? definition.iconBgColor : '#9ca3af';
	const progressText = definition.formatProgress
		? definition.formatProgress(current, goal)
		: `${Math.min(current, goal).toLocaleString()} / ${goal.toLocaleString()}`;

	let groupPosition: 'top' | 'middle' | 'bottom' | 'single' | undefined;
	if (total === 1) {
		groupPosition = 'single';
	} else if (index === 0) {
		groupPosition = 'top';
	} else if (index === total - 1) {
		groupPosition = 'bottom';
	} else {
		groupPosition = 'middle';
	}

	return (
		<SettingsListProgress
			title={definition.title}
			leftIconComponent={
				<View style={[styles.cardIconWrapper, { backgroundColor: iconBg }]}>
					{definition.renderIcon(ICON_FOREGROUND_COLOR)}
				</View>
			}
			noIconIndent
			description={definition.description}
			progress={progress}
			progressText={unlocked ? '✓' : progressText}
			progressColor={unlocked ? definition.iconBgColor : PRIMARY_COLOR}
			groupPosition={groupPosition}
			showSeparator={index < total - 1}
		/>
	);
}

// ─── Main screen ───────────────────────────────────────────────────────────────

export default function AchievementsScreen() {
	const { theme } = useTheme();
	const hexTileRecords = useSelector((state: RootState) => state.hexTiles.records);
	const [activities, setActivities] = useState<SavedActivity[]>([]);

	useFocusEffect(
		useCallback(() => {
			loadActivities()
				.then(setActivities)
				.catch((err) => console.warn('[AchievementsScreen] Failed to load activities:', err));
		}, []),
	);

	const data: AchievementData = useMemo(
		() => ({ activities, hexTileRecords }),
		[activities, hexTileRecords],
	);

	const unlockedCount = useMemo(
		() => ACHIEVEMENTS.filter((def) => isUnlocked(def, data)).length,
		[data],
	);

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<ScrollView contentContainerStyle={styles.scrollContent}>

				{/* Summary header */}
				<View style={[styles.summaryCard, { backgroundColor: PRIMARY_COLOR }]}>
					<View style={styles.summaryIconWrapper}>
						<MaterialCommunityIcons name="trophy" size={32} color={ICON_FOREGROUND_COLOR} />
					</View>
					<View>
						<Text style={styles.summaryLabel}>Erfolge freigeschaltet</Text>
						<Text style={styles.summaryValue}>
							{unlockedCount} / {ACHIEVEMENTS.length}
						</Text>
					</View>
				</View>

				{/* Achievement categories */}
				{CATEGORY_ORDER.map((category) => {
					const items = ACHIEVEMENTS.filter((a) => a.category === category);
					return (
						<View key={category}>
							<SettingsListGroupTitle title={category} />
							{items.map((def, index) => (
								<AchievementCard
									key={def.id}
									definition={def}
									data={data}
									index={index}
									total={items.length}
								/>
							))}
						</View>
					);
				})}

				{/* Empty state hint */}
				{activities.length === 0 && Object.keys(hexTileRecords).length === 0 && (
					<View style={styles.emptyContainer}>
						<Ionicons name="trophy-outline" size={40} color={theme.screen.icon} />
						<Text style={[styles.emptyText, { color: theme.screen.icon }]}>
							Starte deine erste Aktivität, um Erfolge freizuschalten!
						</Text>
					</View>
				)}

			</ScrollView>
		</View>
	);
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	scrollContent: {
		paddingVertical: 16,
		paddingHorizontal: 16,
		gap: 8,
	},

	// Summary header card
	summaryCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 14,
		padding: 18,
		gap: 16,
		marginBottom: 8,
	},
	summaryIconWrapper: {
		width: 52,
		height: 52,
		borderRadius: 26,
		backgroundColor: 'rgba(255,255,255,0.25)',
		alignItems: 'center',
		justifyContent: 'center',
	},
	summaryLabel: {
		fontSize: 13,
		color: 'rgba(255,255,255,0.8)',
		fontWeight: '500',
	},
	summaryValue: {
		fontSize: 26,
		fontWeight: '700',
		color: '#ffffff',
	},

	// Achievement card icon
	cardIconWrapper: {
		width: 34,
		height: 34,
		borderRadius: 8,
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 10,
	},

	// Empty state
	emptyContainer: {
		alignItems: 'center',
		marginTop: 24,
		gap: 10,
	},
	emptyText: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
	},
});
