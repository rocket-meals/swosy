import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
	SettingsList,
	SettingsListGroupTitle,
	useTheme,
} from 'repo-depkit-common-ui';
import { useRouter } from 'expo-router';
import { SavedRoute, loadRoutes, deleteAllRoutes } from '../../helpers/RouteStorage';
import { loadActivities } from '../../helpers/ActivityStorage';
import SettingsListRoute from '../../components/SettingsListRoute';

export default function RoutesScreen() {
	const { theme } = useTheme();
	const router = useRouter();
	const [routes, setRoutes] = useState<SavedRoute[]>([]);
	const [activityCountByRouteId, setActivityCountByRouteId] = useState<Record<string, number>>({});

	const refreshRoutes = useCallback(async () => {
		try {
			const [loaded, activities] = await Promise.all([loadRoutes(), loadActivities()]);
			setRoutes(loaded);
			const countMap: Record<string, number> = {};
			for (const activity of activities) {
				if (activity.routeId) {
					countMap[activity.routeId] = (countMap[activity.routeId] ?? 0) + 1;
				}
			}
			setActivityCountByRouteId(countMap);
		} catch {
			setRoutes([]);
			setActivityCountByRouteId({});
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
			router.navigate(`/routes/${route.id}`);
		},
		[router],
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
				const groupPosition =
					routes.length === 1 ? 'single' : idx === 0 ? 'top' : idx === routes.length - 1 ? 'bottom' : 'middle';
				return (
					<SettingsListRoute
						key={route.id}
						route={route}
						activityCount={activityCountByRouteId[route.id] ?? 0}
						groupPosition={groupPosition}
						showSeparator={idx < routes.length - 1}
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
