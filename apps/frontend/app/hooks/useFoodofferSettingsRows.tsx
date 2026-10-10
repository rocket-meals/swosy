import React, { useMemo } from 'react';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, Octicons } from '@expo/vector-icons';
import { shallowEqual } from 'react-redux';
import { FoodSortOption } from 'repo-depkit-common';

import { PriceGroupKey } from '@/app/(app)/settings/types';
import FoodoffersAverageRatingToggle from '@/components/FoodoffersAverageRatingToggle';
import SettingsList from '@/components/SettingsList/SettingsList';
import { SettingsGroupRow } from '@/components/SettingsGroupRows';
import { ComponentIds } from '@/constants/ComponentIds';
import { excerpt } from '@/constants/HelperFunctions';
import { useLanguage } from '@/hooks/useLanguage';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

const FOOD_SORT_OPTION_LABELS: Record<FoodSortOption, TranslationKeys> = {
	[FoodSortOption.INTELLIGENT]: TranslationKeys.sort_option_intelligent,
	[FoodSortOption.FAVORITE]: TranslationKeys.sort_option_favorite,
	[FoodSortOption.EATING]: TranslationKeys.eating_habits,
	[FoodSortOption.FOOD_CATEGORY]: TranslationKeys.sort_option_food_category,
	[FoodSortOption.FOODOFFER_CATEGORY]: TranslationKeys.sort_option_foodoffer_category,
	[FoodSortOption.RATING]: TranslationKeys.sort_option_public_rating,
	[FoodSortOption.PRICE_ASCENDING]: TranslationKeys.sort_option_price_ascending,
	[FoodSortOption.PRICE_DESCENDING]: TranslationKeys.sort_option_price_descending,
	[FoodSortOption.ALPHABETICAL]: TranslationKeys.sort_option_alphabetical,
	[FoodSortOption.NONE]: TranslationKeys.sort_option_none,
};

const PRICE_GROUP_LABELS: Record<PriceGroupKey, TranslationKeys> = {
	[PriceGroupKey.student]: TranslationKeys.price_group_student,
	[PriceGroupKey.employee]: TranslationKeys.price_group_employee,
	[PriceGroupKey.guest]: TranslationKeys.price_group_guest,
};

export type FoodofferSettingsRows = {
	canteen: SettingsGroupRow;
	priceGroup: SettingsGroupRow;
	eatingHabits: SettingsGroupRow;
	sort: SettingsGroupRow;
	/** null when the average rating is not shown in this app. */
	averageRating: SettingsGroupRow | null;
};

type UseFoodofferSettingsRowsParams = {
	onCanteen: () => void;
	onPriceGroup: () => void;
	onEatingHabits: () => void;
	onSort: () => void;
	iconSize?: number;
	/** Only one place may carry the ids the tutorial points at: the settings screen. */
	withNativeIds?: boolean;
};

/**
 * The canteen settings as rows, shared by the food offers options modal and the settings screen,
 * so both show the same settings with the same color and values. Each place puts its own rows
 * (date, account balance, ...) around them.
 */
const useFoodofferSettingsRows = ({ onCanteen, onPriceGroup, onEatingHabits, onSort, iconSize = 20, withNativeIds = false }: UseFoodofferSettingsRowsParams): FoodofferSettingsRows => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const selectedCanteen = useSelectedCanteen();
	const priceGroup = useAppSelector(state => state.authReducer.profile?.price_group);
	const sortBy = useAppSelector(state => state.settings.sortBy);
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const appSettings = useAppSelector(state => state.settings.appSettings, shallowEqual);
	const foodsAreaColor = appSettings?.foods_area_color || primaryColor;
	const showAverageRating = appSettings?.foods_ratings_average_display === true;

	return useMemo(() => {
		const chevron = <Octicons name="chevron-right" size={iconSize} color={theme.screen.icon} />;
		const priceGroupLabel = PRICE_GROUP_LABELS[priceGroup as PriceGroupKey];
		const sortLabel = FOOD_SORT_OPTION_LABELS[sortBy as FoodSortOption] ?? TranslationKeys.sort_option_none;

		return {
			canteen: {
				key: 'foodoffer-canteen',
				render: (groupPosition, showSeparator) => (
					<SettingsList
						iconBgColor={foodsAreaColor}
						leftIcon={<MaterialIcons name="restaurant-menu" size={iconSize} />}
						title={translate(TranslationKeys.canteen)}
						value={selectedCanteen?.alias ? excerpt(String(selectedCanteen.alias), 30) : ''}
						rightIcon={<MaterialCommunityIcons name="pencil" size={20} color={theme.screen.icon} />}
						onPress={onCanteen}
						groupPosition={groupPosition}
						showSeparator={showSeparator}
						nativeID={withNativeIds ? ComponentIds.SETTINGS_CANTEEN : undefined}
					/>
				),
			},
			priceGroup: {
				key: 'foodoffer-price-group',
				render: (groupPosition, showSeparator) => (
					<SettingsList
						iconBgColor={foodsAreaColor}
						leftIcon={<MaterialIcons name="euro" size={iconSize} />}
						title={translate(TranslationKeys.price_group)}
						value={priceGroupLabel ? translate(priceGroupLabel) : ''}
						rightIcon={chevron}
						onPress={onPriceGroup}
						groupPosition={groupPosition}
						showSeparator={showSeparator}
					/>
				),
			},
			eatingHabits: {
				key: 'foodoffer-eating-habits',
				render: (groupPosition, showSeparator) => (
					<SettingsList
						iconBgColor={foodsAreaColor}
						leftIcon={<Ionicons name="bag-add-sharp" size={iconSize} />}
						title={translate(TranslationKeys.eating_habits)}
						rightIcon={chevron}
						onPress={onEatingHabits}
						groupPosition={groupPosition}
						showSeparator={showSeparator}
						nativeID={withNativeIds ? ComponentIds.SETTINGS_EATING_HABITS : undefined}
					/>
				),
			},
			sort: {
				key: 'foodoffer-sort',
				render: (groupPosition, showSeparator) => (
					<SettingsList
						iconBgColor={foodsAreaColor}
						leftIcon={<MaterialIcons name="sort" size={iconSize} />}
						title={translate(TranslationKeys.sort)}
						value={translate(sortLabel)}
						rightIcon={chevron}
						onPress={onSort}
						groupPosition={groupPosition}
						showSeparator={showSeparator}
					/>
				),
			},
			averageRating: showAverageRating
				? {
						key: 'foodoffer-average-rating',
						render: groupPosition => <FoodoffersAverageRatingToggle groupPosition={groupPosition} iconBgColor={foodsAreaColor} iconSize={iconSize} />,
					}
				: null,
		};
	}, [foodsAreaColor, iconSize, onCanteen, onEatingHabits, onPriceGroup, onSort, priceGroup, selectedCanteen?.alias, showAverageRating, sortBy, theme.screen.icon, translate, withNativeIds]);
};

export default useFoodofferSettingsRows;
