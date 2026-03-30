import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	SettingsListSelectOptionSingle,
	SettingsListTextInput,
	useMyScrollViewModal,
	useTheme,
} from 'repo-depkit-common-ui';
import { SavedRoute, loadRoutes, deleteRoute, deleteAllRoutes, saveRoute } from '../../helpers/RouteStorage';
import { computeRouteLengthKm, formatDistanceKm } from '../../helpers/H3Helper';

const PRIMARY_COLOR = '#2563eb';

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

	const handleSelectRoute = useCallback(
		(route: SavedRoute) => {
			const distanceKm = computeRouteLengthKm(route.hexTiles);
			showModal({
				title: route.name,
				children: (
					<View>
						<SettingsListGroupTitle title="Distanz" />
						<SettingsList
							leftIcon={<MaterialIcons name="social-distance" size={20} color="#ffffff" />}
							iconBackgroundColor={PRIMARY_COLOR}
							title="Streckenlänge"
							value={formatDistanceKm(distanceKm)}
							groupPosition="single"
						/>
						<SettingsListGroupTitle title="Name anpassen" />
						<SettingsListTextInput
							title="Route umbenennen"
							placeholder="Route Name"
							modalTitle="Route umbenennen"
							initialValue={route.name}
							groupPosition="single"
							onSave={(newName) => {
								const trimmed = newName.trim();
								if (!trimmed) return;
								const updated: SavedRoute = { ...route, name: trimmed };
								try {
									saveRoute(updated);
								} catch {
									Alert.alert('Fehler', 'Der Name der Route konnte nicht gespeichert werden.');
									return;
								}
								closeModal();
								refreshRoutes();
							}}
						/>
						<SettingsListGroupTitle title="Aktionen" />
						<SettingsListSelectOptionSingle
							label="Route löschen"
							isSelected={false}
							selectionColor="#ef4444"
							groupPosition="single"
							onPress={() => {
								closeModal();
								Alert.alert('Delete Route', 'Are you sure you want to delete this route?', [
									{ text: 'Cancel', style: 'cancel' },
									{
										text: 'Delete',
										style: 'destructive',
										onPress: () => {
											deleteRoute(route.id);
											refreshRoutes();
										},
									},
								]);
							}}
						/>
					</View>
				),
			});
		},
		[showModal, closeModal, refreshRoutes],
	);

	if (routes.length === 0) {
		return (
			<View style={[styles.emptyContainer, { backgroundColor: theme.screen.background }]}>
				<MaterialIcons name="route" size={48} color={theme.screen.icon + '55'} />
				<Text style={[styles.emptyText, { color: theme.screen.icon }]}>
					No saved routes yet.{'\n'}Complete a run and save it as a route!
				</Text>
			</View>
		);
	}

	return (
		<ScrollView style={[styles.container, { backgroundColor: theme.screen.background }]}>
			<SettingsListGroupTitle title="Gespeicherte Routen" />
			{routes.map((route, idx) => {
				const date = new Date(route.createdAt);
				const dateStr = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
				const tileCount = route.hexTiles.length;
				const distanceKm = computeRouteLengthKm(route.hexTiles);
				const distStr = distanceKm > 0 ? ` · ${formatDistanceKm(distanceKm)}` : '';
				const metaStr = `${dateStr} · ${tileCount} tile${tileCount !== 1 ? 's' : ''}${distStr} · Res ${route.h3Resolution}${route.sportType ? ` · ${route.sportType}` : ''}`;
				const groupPosition =
					routes.length === 1 ? 'single' : idx === 0 ? 'top' : idx === routes.length - 1 ? 'bottom' : 'middle';
				return (
					<SettingsList
						key={route.id}
						leftIcon={<MaterialIcons name="route" size={20} color="#ffffff" />}
						iconBackgroundColor={PRIMARY_COLOR}
						title={route.name}
						value={metaStr}
						showSeparator={idx < routes.length - 1}
						groupPosition={groupPosition}
						onPress={() => handleSelectRoute(route)}
					/>
				);
			})}
			<SettingsListGroupTitle title="Aktionen" />
			<SettingsList
				leftIcon={<MaterialIcons name="delete-sweep" size={20} color="#ffffff" />}
				iconBackgroundColor="#e53935"
				title="Alle Routen löschen"
				groupPosition="single"
				onPress={handleDeleteAll}
			/>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	emptyContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 32,
	},
	emptyText: {
		fontSize: 15,
		textAlign: 'center',
		lineHeight: 22,
	},
});
