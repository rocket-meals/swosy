import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
	MaterialIcons,
	MaterialCommunityIcons,
	Ionicons,
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
import ActivityAggregateStatsSection from '../../components/ActivityAggregateStatsSection';

const PRIMARY_COLOR = '#2563eb';

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

	const emptyLabel = selectedFilter === 'all'
		? 'Keine Aktivitäten vorhanden'
		: `Keine ${filterLabel}-Aktivitäten vorhanden`;

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

				<ActivityAggregateStatsSection
					activities={filtered}
					emptyLabel={emptyLabel}
				/>

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
});
