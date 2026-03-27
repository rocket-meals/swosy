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
import { useTheme } from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';
import { HexTileRecord } from '../../helpers/HexTileStorage';
import type { RootState } from '../../store/store';

const PRIMARY_COLOR = '#2563eb';

// ─── Tier definitions ──────────────────────────────────────────────────────────

type AchievementTier = 'bronze' | 'silver' | 'gold' | 'diamond';

const TIER_COLORS: Record<AchievementTier, string> = {
	bronze: '#cd7f32',
	silver: '#9ca3af',
	gold: '#f59e0b',
	diamond: '#3b82f6',
};

const TIER_LABELS: Record<AchievementTier, string> = {
	bronze: 'Bronze',
	silver: 'Silber',
	gold: 'Gold',
	diamond: 'Diamant',
};

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
	tier: AchievementTier;
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
		tier: 'bronze',
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
		tier: 'bronze',
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
		tier: 'silver',
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
		tier: 'gold',
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
		tier: 'diamond',
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
		tier: 'bronze',
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
		tier: 'silver',
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
		tier: 'gold',
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
		tier: 'bronze',
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
		tier: 'bronze',
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
		tier: 'silver',
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
		tier: 'gold',
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
		tier: 'bronze',
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
		tier: 'silver',
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
		tier: 'gold',
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
		tier: 'gold',
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
		tier: 'diamond',
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
		tier: 'silver',
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
		tier: 'gold',
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
		tier: 'bronze',
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
		tier: 'silver',
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
		tier: 'gold',
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
	theme: ReturnType<typeof useTheme>['theme'];
};

function AchievementCard({ definition, data, theme }: AchievementCardProps) {
	const unlocked = isUnlocked(definition, data);
	const { current, goal } = definition.getProgress(data);
	const progress = Math.min(1, current / goal);
	const tierColor = TIER_COLORS[definition.tier];
	const iconBg = unlocked ? tierColor : '#9ca3af';
	const progressText = definition.formatProgress
		? definition.formatProgress(current, goal)
		: `${Math.min(current, goal).toLocaleString()} / ${goal.toLocaleString()}`;

	return (
		<View style={[styles.card, { backgroundColor: theme.screen.background }]}>
			<View style={[styles.cardIconWrapper, { backgroundColor: iconBg }]}>
				{definition.renderIcon('#ffffff')}
			</View>
			<View style={styles.cardBody}>
				<View style={styles.cardTitleRow}>
					<Text style={[styles.cardTitle, { color: theme.screen.text }, !unlocked && styles.cardTitleLocked]}>
						{definition.title}
					</Text>
					<View style={[styles.tierBadge, { backgroundColor: tierColor + '22' }]}>
						<Text style={[styles.tierBadgeText, { color: tierColor }]}>
							{TIER_LABELS[definition.tier]}
						</Text>
					</View>
				</View>
				<Text style={[styles.cardDescription, { color: theme.screen.icon }]}>
					{definition.description}
				</Text>
				<View style={styles.progressRow}>
					<View style={[styles.progressBarBg, { backgroundColor: theme.screen.icon + '30' }]}>
						<View
							style={[
								styles.progressBarFill,
								{
									width: `${Math.round(progress * 100)}%` as `${number}%`,
									backgroundColor: unlocked ? tierColor : PRIMARY_COLOR,
								},
							]}
						/>
					</View>
					<Text style={[styles.progressText, { color: unlocked ? tierColor : theme.screen.icon }]}>
						{unlocked ? '✓' : progressText}
					</Text>
				</View>
			</View>
		</View>
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
						<MaterialCommunityIcons name="trophy" size={32} color="#ffffff" />
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
						<View key={category} style={styles.categorySection}>
							<Text style={[styles.categoryTitle, { color: theme.screen.text }]}>
								{category}
							</Text>
							{items.map((def) => (
								<AchievementCard
									key={def.id}
									definition={def}
									data={data}
									theme={theme}
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

	// Category section
	categorySection: {
		gap: 6,
		marginBottom: 8,
	},
	categoryTitle: {
		fontSize: 13,
		fontWeight: '700',
		textTransform: 'uppercase',
		letterSpacing: 0.8,
		marginLeft: 4,
		marginBottom: 2,
	},

	// Achievement card
	card: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		padding: 12,
		gap: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.06,
		shadowRadius: 4,
		elevation: 1,
	},
	cardIconWrapper: {
		width: 44,
		height: 44,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
	},
	cardBody: {
		flex: 1,
		gap: 3,
	},
	cardTitleRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	cardTitle: {
		fontSize: 14,
		fontWeight: '600',
		flex: 1,
	},
	cardTitleLocked: {
		opacity: 0.55,
	},
	cardDescription: {
		fontSize: 12,
		lineHeight: 16,
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginTop: 2,
	},
	progressBarBg: {
		flex: 1,
		height: 4,
		borderRadius: 2,
		overflow: 'hidden',
	},
	progressBarFill: {
		height: 4,
		borderRadius: 2,
	},
	progressText: {
		fontSize: 11,
		fontWeight: '500',
		minWidth: 70,
		textAlign: 'right',
	},

	// Tier badge
	tierBadge: {
		borderRadius: 6,
		paddingHorizontal: 6,
		paddingVertical: 2,
	},
	tierBadgeText: {
		fontSize: 10,
		fontWeight: '700',
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
