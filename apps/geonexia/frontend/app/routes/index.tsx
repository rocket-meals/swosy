import React, { useCallback, useEffect, useState } from 'react';
import {
	Alert,
	FlatList,
	SafeAreaView,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme, useMyScrollViewModal, SettingsListGroupTitle } from 'repo-depkit-common-ui';
import { SavedRoute, loadRoutes, deleteRoute, deleteAllRoutes, saveRoute } from '../../helpers/RouteStorage';

const PRIMARY_COLOR = '#2563eb';

function RouteListItem({
	route,
	onDelete,
	onRename,
	theme,
}: {
	route: SavedRoute;
	onDelete: (id: string) => void;
	onRename: (route: SavedRoute) => void;
	theme: ReturnType<typeof useTheme>['theme'];
}) {
	const date = new Date(route.createdAt);
	const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
	const tileCount = route.hexTiles.length;

	return (
		<View style={[styles.routeItem, { borderBottomColor: theme.screen.text + '22' }]}>
			<View style={styles.routeIconContainer}>
				<MaterialIcons name="route" size={24} color={PRIMARY_COLOR} />
			</View>
			<View style={styles.routeInfo}>
				<Text style={[styles.routeName, { color: theme.screen.text }]} numberOfLines={1}>
					{route.name}
				</Text>
				<Text style={[styles.routeMeta, { color: theme.screen.icon }]}>
					{dateStr} · {tileCount} tile{tileCount !== 1 ? 's' : ''} · Res {route.h3Resolution}
					{route.sportType ? ` · ${route.sportType}` : ''}
				</Text>
			</View>
			<TouchableOpacity
				style={styles.routeActionButton}
				onPress={() => onRename(route)}
				activeOpacity={0.7}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			>
				<MaterialIcons name="edit" size={20} color={theme.screen.icon} />
			</TouchableOpacity>
			<TouchableOpacity
				style={styles.routeActionButton}
				onPress={() => onDelete(route.id)}
				activeOpacity={0.7}
				hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
			>
				<MaterialIcons name="delete-outline" size={20} color="#e53935" />
			</TouchableOpacity>
		</View>
	);
}

export default function RoutesScreen() {
	const { theme } = useTheme();
	const [routes, setRoutes] = useState<SavedRoute[]>([]);
	const { show: showModal, close: closeModal } = useMyScrollViewModal();

	const refreshRoutes = useCallback(async () => {
		try {
			const loaded = await loadRoutes();
			setRoutes(loaded);
		} catch {
			setRoutes([]);
		}
	}, []);

	useEffect(() => {
		refreshRoutes();
	}, [refreshRoutes]);

	const handleDelete = useCallback(
		(id: string) => {
			Alert.alert('Delete Route', 'Are you sure you want to delete this route?', [
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Delete',
					style: 'destructive',
					onPress: () => {
						deleteRoute(id);
						refreshRoutes();
					},
				},
			]);
		},
		[refreshRoutes],
	);

	const handleDeleteAll = useCallback(() => {
		Alert.alert('Delete All Routes', 'Are you sure you want to delete all saved routes? This cannot be undone.', [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Delete All',
				style: 'destructive',
				onPress: () => {
					deleteAllRoutes();
					refreshRoutes();
				},
			},
		]);
	}, [refreshRoutes]);

	const handleRename = useCallback(
		(route: SavedRoute) => {
			let newName = route.name;
			showModal({
				title: '✏️ Rename Route',
				onClose: closeModal,
				children: (
					<View style={{ padding: 16, gap: 12 }}>
						<TextInput
							style={{
								borderWidth: 1,
								borderColor: theme.screen.text + '33',
								borderRadius: 8,
								padding: 12,
								fontSize: 16,
								color: theme.screen.text,
							}}
							placeholder="Route name"
							placeholderTextColor={theme.screen.icon}
							defaultValue={route.name}
							autoFocus
							onChangeText={(text) => { newName = text; }}
						/>
						<TouchableOpacity
							style={{ backgroundColor: PRIMARY_COLOR, borderRadius: 8, paddingVertical: 12, alignItems: 'center' }}
							onPress={() => {
								const trimmed = newName.trim();
								if (!trimmed) return;
								const updatedRoute: SavedRoute = { ...route, name: trimmed };
								try {
									saveRoute(updatedRoute);
								} catch { /* ignore */ }
								closeModal();
								refreshRoutes();
							}}
							activeOpacity={0.8}
						>
							<Text style={{ color: '#ffffff', fontWeight: '600', fontSize: 15 }}>Save</Text>
						</TouchableOpacity>
					</View>
				),
			});
		},
		[showModal, closeModal, theme, refreshRoutes],
	);

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			{routes.length > 0 && (
				<View style={styles.headerRow}>
					<TouchableOpacity style={styles.headerButton} onPress={handleDeleteAll} activeOpacity={0.7}>
						<MaterialIcons name="delete-sweep" size={20} color="#e53935" />
						<Text style={[styles.headerButtonText, { color: '#e53935' }]}>Delete All</Text>
					</TouchableOpacity>
				</View>
			)}
			<FlatList
				data={routes}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => (
					<RouteListItem route={item} onDelete={handleDelete} onRename={handleRename} theme={theme} />
				)}
				contentContainerStyle={routes.length === 0 ? styles.emptyContainer : undefined}
				ListEmptyComponent={
					<View style={styles.emptyContent}>
						<MaterialIcons name="route" size={48} color={theme.screen.icon + '55'} />
						<Text style={[styles.emptyText, { color: theme.screen.icon }]}>
							No saved routes yet.{'\n'}Complete a run and save it as a route!
						</Text>
					</View>
				}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	headerRow: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		paddingHorizontal: 16,
		paddingVertical: 8,
	},
	headerButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 4,
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 8,
	},
	headerButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	routeItem: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingVertical: 12,
		paddingHorizontal: 16,
		borderBottomWidth: StyleSheet.hairlineWidth,
		gap: 12,
	},
	routeIconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: PRIMARY_COLOR + '15',
		alignItems: 'center',
		justifyContent: 'center',
	},
	routeInfo: {
		flex: 1,
		gap: 2,
	},
	routeName: {
		fontSize: 16,
		fontWeight: '600',
	},
	routeMeta: {
		fontSize: 13,
	},
	routeActionButton: {
		padding: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	emptyContent: {
		alignItems: 'center',
		gap: 12,
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
	},
});
