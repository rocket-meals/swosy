import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
	Alert,
	FlatList,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useMyScrollViewModal, useTheme } from 'repo-depkit-common-ui';
import { useDispatch } from 'react-redux';

import { loadActivities, saveActivity, SavedActivity } from '../../helpers/ActivityStorage';
import { isAvailable as isH3Available, latLngToCell } from '../../helpers/H3Helper';
import { startRun, markVisited, loadPersistedState, applyMapCustomizations } from '../../store/hexTileSlice';
import { AppDispatch, store } from '../../store/store';

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
					{activity.visitedTileCount != null && (
						<View style={styles.itemStatChip}>
							<MaterialIcons name="grid-on" size={13} color={PRIMARY_COLOR} />
							<Text style={[styles.itemStatText, { color: theme.screen.text }]}>
								{activity.visitedTileCount}
								{activity.enclosedTileCount != null && activity.enclosedTileCount > 0
									? ` (+${activity.enclosedTileCount})`
									: ''}
							</Text>
						</View>
					)}
				</View>
			</View>
			<MaterialIcons name="chevron-right" size={22} color={theme.screen.icon} />
		</TouchableOpacity>
	);
}

// ─── Import Content (shown inside bottom sheet modal) ─────────────────────────

const H3_IMPORT_RESOLUTION = 10;

function ImportContent({
	onImport,
	onCancel,
	theme,
}: {
	onImport: (code: string) => void;
	onCancel: () => void;
	theme: ReturnType<typeof useTheme>['theme'];
}) {
	const [code, setCode] = useState('');
	return (
		<View style={styles.importContainer}>
			<Text style={[styles.importDescription, { color: theme.screen.text }]}>
				Paste the export code from the "Share Activity" button of another run.
			</Text>
			<TextInput
				style={[styles.importInput, { color: theme.screen.text, borderColor: theme.screen.text + '33', backgroundColor: theme.screen.background }]}
				placeholder="Paste export code here…"
				placeholderTextColor={theme.screen.icon}
				value={code}
				onChangeText={setCode}
				multiline
				numberOfLines={5}
				autoCapitalize="none"
				autoCorrect={false}
			/>
			<TouchableOpacity
				style={[styles.importConfirmButton, { backgroundColor: PRIMARY_COLOR, opacity: code.trim().length === 0 ? 0.4 : 1 }]}
				onPress={() => onImport(code.trim())}
				disabled={code.trim().length === 0}
				activeOpacity={0.8}
			>
				<MaterialIcons name="file-download" size={18} color="#ffffff" />
				<Text style={styles.importConfirmButtonText}>Import Run</Text>
			</TouchableOpacity>
			<TouchableOpacity style={styles.importCancelButton} onPress={onCancel} activeOpacity={0.8}>
				<Text style={[styles.importCancelButtonText, { color: theme.screen.text }]}>Cancel</Text>
			</TouchableOpacity>
		</View>
	);
}

// ─── Activities Screen ────────────────────────────────────────────────────────

export default function ActivitiesScreen() {
	const { theme } = useTheme();
	const router = useRouter();
	const navigation = useNavigation();
	const dispatch = useDispatch<AppDispatch>();
	const { show: showImportModal, close: closeImportModal } = useMyScrollViewModal();
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

	const applyImportedHexTiles = useCallback((activity: SavedActivity) => {
		if (!isH3Available()) return;
		dispatch(startRun());
		const h3Set = new Set<string>();
		for (const point of activity.routePoints) {
			try {
				const cell = latLngToCell(point.lat, point.lng, H3_IMPORT_RESOLUTION);
				if (cell && !h3Set.has(cell)) {
					h3Set.add(cell);
					dispatch(markVisited({ h3Indices: [cell], timestamp: point.timestamp }));
				}
			} catch {
				// Skip invalid points
			}
		}
	}, [dispatch]);

	const handleImport = useCallback((code: string) => {
		let parsed: unknown;
		try {
			parsed = JSON.parse(code);
		} catch {
			Alert.alert('Import Failed', 'The code is not valid JSON.');
			return;
		}

		// Support both a single activity object and an array of activities.
		const rawActivities: unknown[] = Array.isArray(parsed) ? parsed : [parsed];
		const validActivities: SavedActivity[] = [];
		for (const item of rawActivities) {
			const activity = item as SavedActivity;
			if (
				typeof activity.id !== 'string' ||
				typeof activity.startedAt !== 'number' ||
				!Array.isArray(activity.routePoints)
			) {
				Alert.alert('Import Failed', 'One or more entries do not look like valid activities.');
				return;
			}
			validActivities.push(activity);
		}
		for (const activity of validActivities) {
			saveActivity(activity);
			applyImportedHexTiles(activity);
		}
		closeImportModal();
		loadData();
		const count = validActivities.length;
		Alert.alert('Imported', count === 1 ? 'The run has been imported successfully.' : `${count} runs have been imported successfully.`);
	}, [applyImportedHexTiles, closeImportModal, loadData]);

	const handleExportAll = useCallback(async () => {
		const allActivities = await loadActivities();
		if (allActivities.length === 0) {
			Alert.alert('Nothing to Export', 'There are no activities to export.');
			return;
		}
		const json = JSON.stringify(allActivities, null, 2);
		await Clipboard.setStringAsync(json);
		const count = allActivities.length;
		Alert.alert('Exported', `${count} ${count === 1 ? 'activity' : 'activities'} copied to clipboard as JSON.`);
	}, []);

	const handleRebuildMap = useCallback(() => {
		Alert.alert(
			'Rebuild Map from Activities',
			'This will recalculate the explored map from all your saved activities. Billboard and terrain tile settings will be preserved. Continue?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Rebuild',
					style: 'destructive',
					onPress: async () => {
						if (!isH3Available()) {
							Alert.alert('Not Available', 'H3 library is not available on this device.');
							return;
						}
						const allActivities = await loadActivities();
						if (allActivities.length === 0) {
							Alert.alert('No Activities', 'There are no activities to rebuild the map from.');
							return;
						}

						// Preserve existing billboard / terrain customizations
						const currentRecords = store.getState().hexTiles.records;
						const customizations: Record<string, { tileImage?: string | null; billboard?: string | null; billboardAnchorColor?: string | null; billboards?: Record<string, string | null> }> = {};
						for (const [h3Index, record] of Object.entries(currentRecords)) {
							if (record.tileImage !== undefined || record.billboard !== undefined || record.billboardAnchorColor !== undefined || record.billboards !== undefined) {
								customizations[h3Index] = {};
								if (record.tileImage !== undefined) customizations[h3Index].tileImage = record.tileImage;
								if (record.billboard !== undefined) customizations[h3Index].billboard = record.billboard;
								if (record.billboardAnchorColor !== undefined) customizations[h3Index].billboardAnchorColor = record.billboardAnchorColor;
								if (record.billboards !== undefined) customizations[h3Index].billboards = record.billboards;
							}
						}

						// Clear all tile data, then replay each activity oldest-first
						dispatch(loadPersistedState({}));
						const sorted = [...allActivities].sort((a, b) => a.startedAt - b.startedAt);
						for (const activity of sorted) {
							dispatch(startRun());
							const h3Set = new Set<string>();
							for (const point of activity.routePoints) {
								try {
									const cell = latLngToCell(point.lat, point.lng, H3_IMPORT_RESOLUTION);
									if (cell && !h3Set.has(cell)) {
										h3Set.add(cell);
										dispatch(markVisited({ h3Indices: [cell], timestamp: point.timestamp }));
									}
								} catch {
									// Skip invalid points
								}
							}
						}

						// Re-apply customizations preserved from before
						if (Object.keys(customizations).length > 0) {
							dispatch(applyMapCustomizations(customizations));
						}

						const count = allActivities.length;
						Alert.alert('Map Rebuilt', `Map rebuilt from ${count} ${count === 1 ? 'activity' : 'activities'}.`);
					},
				},
			],
		);
	}, [dispatch]);

	const openImportModal = useCallback(() => {
		showImportModal({
			title: '📥 Import Run',
			children: (
				<ImportContent
					onImport={handleImport}
					onCancel={closeImportModal}
					theme={theme}
				/>
			),
			keyboardShouldPersistTaps: 'handled',
		});
	}, [showImportModal, handleImport, closeImportModal, theme]);

	// Show import, export, and rebuild buttons in the header
	useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View style={styles.headerButtons}>
					<TouchableOpacity onPress={handleRebuildMap} style={styles.headerImportButton} activeOpacity={0.7}>
						<MaterialIcons name="refresh" size={24} color={PRIMARY_COLOR} />
					</TouchableOpacity>
					<TouchableOpacity onPress={handleExportAll} style={styles.headerImportButton} activeOpacity={0.7}>
						<MaterialIcons name="file-upload" size={24} color={PRIMARY_COLOR} />
					</TouchableOpacity>
					<TouchableOpacity onPress={openImportModal} style={styles.headerImportButton} activeOpacity={0.7}>
						<MaterialIcons name="file-download" size={24} color={PRIMARY_COLOR} />
					</TouchableOpacity>
				</View>
			),
		});
	}, [navigation, openImportModal, handleExportAll, handleRebuildMap]);

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
	headerImportButton: {
		marginRight: 4,
		padding: 4,
	},
	headerButtons: {
		flexDirection: 'row',
		alignItems: 'center',
		marginRight: 8,
		gap: 4,
	},
	importContainer: {
		paddingTop: 4,
		gap: 12,
	},
	importDescription: {
		fontSize: 14,
		lineHeight: 20,
	},
	importInput: {
		borderWidth: 1,
		borderRadius: 8,
		padding: 10,
		fontSize: 12,
		fontFamily: 'monospace',
		minHeight: 100,
		textAlignVertical: 'top',
	},
	importConfirmButton: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 12,
		borderRadius: 10,
		gap: 8,
	},
	importConfirmButtonText: {
		color: '#ffffff',
		fontSize: 15,
		fontWeight: '600',
	},
	importCancelButton: {
		alignItems: 'center',
		paddingVertical: 10,
		borderRadius: 10,
	},
	importCancelButtonText: {
		fontSize: 15,
		fontWeight: '500',
	},
});
