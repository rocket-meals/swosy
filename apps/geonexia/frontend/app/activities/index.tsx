import React, { useCallback, useEffect, useState } from 'react';
import {
	FlatList,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTheme } from 'repo-depkit-common-ui';

import { loadActivities, SavedActivity } from '../../helpers/ActivityStorage';

const PRIMARY_COLOR = '#2563eb';

function formatDate(timestamp: number): string {
	const d = new Date(timestamp);
	return d.toLocaleDateString(undefined, {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});
}

function formatTime(timestamp: number): string {
	const d = new Date(timestamp);
	return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(totalSeconds: number): string {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatDistance(km: number): string {
	if (km < 1) return `${Math.round(km * 1000)} m`;
	return `${km.toFixed(2)} km`;
}

function formatPace(minPerKm: number): string {
	if (minPerKm <= 0 || !isFinite(minPerKm)) return '--:--';
	const m = Math.floor(minPerKm);
	const s = Math.round((minPerKm - m) * 60);
	return `${m}:${String(s).padStart(2, '0')} /km`;
}

type ActivityListItemProps = {
	activity: SavedActivity;
	onPress: () => void;
	theme: ReturnType<typeof useTheme>['theme'];
};

function ActivityListItem({ activity, onPress, theme }: ActivityListItemProps) {
	const { stats } = activity;
	return (
		<TouchableOpacity
			style={[styles.itemCard, { backgroundColor: theme.screen.background, borderColor: theme.screen.text + '18' }]}
			onPress={onPress}
			activeOpacity={0.75}
		>
			<View style={[styles.itemIconWrapper, { backgroundColor: PRIMARY_COLOR + '18' }]}>
				<MaterialIcons name="directions-run" size={26} color={PRIMARY_COLOR} />
			</View>
			<View style={styles.itemContent}>
				<Text style={[styles.itemDate, { color: theme.screen.text }]}>
					{formatDate(activity.startedAt)}
					{'  '}
					<Text style={[styles.itemTime, { color: theme.screen.icon }]}>{formatTime(activity.startedAt)}</Text>
				</Text>
				<View style={styles.itemStats}>
					<View style={styles.itemStatChip}>
						<MaterialIcons name="straighten" size={13} color={PRIMARY_COLOR} />
						<Text style={[styles.itemStatText, { color: theme.screen.text }]}>
							{formatDistance(stats.distanceKm)}
						</Text>
					</View>
					<View style={styles.itemStatChip}>
						<MaterialIcons name="speed" size={13} color={PRIMARY_COLOR} />
						<Text style={[styles.itemStatText, { color: theme.screen.text }]}>
							{formatPace(stats.paceMinPerKm)}
						</Text>
					</View>
					<View style={styles.itemStatChip}>
						<MaterialIcons name="timer" size={13} color={theme.screen.icon} />
						<Text style={[styles.itemStatText, { color: theme.screen.text }]}>
							{formatDuration(stats.durationSeconds)}
						</Text>
					</View>
				</View>
			</View>
			<MaterialIcons name="chevron-right" size={22} color={theme.screen.icon} />
		</TouchableOpacity>
	);
}

export default function ActivitiesScreen() {
	const { theme } = useTheme();
	const router = useRouter();
	const [activities, setActivities] = useState<SavedActivity[]>([]);
	const [loading, setLoading] = useState(true);

	const loadData = useCallback(() => {
		setLoading(true);
		loadActivities()
			.then(setActivities)
			.finally(() => setLoading(false));
	}, []);

	// Reload when screen comes into focus (e.g. after returning from detail or record)
	useFocusEffect(loadData);

	const handleActivityPress = useCallback((id: string) => {
		router.push(`/activities/${id}`);
	}, [router]);

	if (!loading && activities.length === 0) {
		return (
			<View style={[styles.emptyContainer, { backgroundColor: theme.screen.background }]}>
				<Ionicons name="fitness-outline" size={64} color={theme.screen.icon} />
				<Text style={[styles.emptyTitle, { color: theme.screen.text }]}>No activities yet</Text>
				<Text style={[styles.emptySubtitle, { color: theme.screen.icon }]}>
					Start recording to see your activities here.
				</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<FlatList
				data={activities}
				keyExtractor={(item) => item.id}
				contentContainerStyle={styles.listContent}
				renderItem={({ item }) => (
					<ActivityListItem
						activity={item}
						onPress={() => handleActivityPress(item.id)}
						theme={theme}
					/>
				)}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingHorizontal: 16,
		paddingTop: 12,
		paddingBottom: 24,
		gap: 10,
	},
	itemCard: {
		flexDirection: 'row',
		alignItems: 'center',
		borderRadius: 12,
		borderWidth: 1,
		paddingVertical: 12,
		paddingHorizontal: 14,
		gap: 12,
	},
	itemIconWrapper: {
		width: 46,
		height: 46,
		borderRadius: 23,
		alignItems: 'center',
		justifyContent: 'center',
	},
	itemContent: {
		flex: 1,
		gap: 6,
	},
	itemDate: {
		fontSize: 14,
		fontWeight: '600',
	},
	itemTime: {
		fontSize: 13,
		fontWeight: '400',
	},
	itemStats: {
		flexDirection: 'row',
		gap: 10,
		flexWrap: 'wrap',
	},
	itemStatChip: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	itemStatText: {
		fontSize: 13,
		fontWeight: '500',
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 32,
	},
	emptyTitle: {
		fontSize: 20,
		fontWeight: '700',
	},
	emptySubtitle: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
});
