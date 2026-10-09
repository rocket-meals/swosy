import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SettingsList from '@/components/SettingsList/SettingsList';
import { useAppSelector } from '@/redux/hooks';
import SettingsGroupRows, { SettingsGroupRow } from '@/components/SettingsGroupRows';
import useFoodofferSettingsRows from '@/hooks/useFoodofferSettingsRows';
import { useTheme } from '@/hooks/useTheme';

interface FoodOffersOptionsContentProps {
	closeSheet: () => void;
	onSort: () => void;
	onPriceGroup: () => void;
	onEatingHabits: () => void;
	onCanteen: () => void;
	onCalendar: () => void;
	onBusinessHours: () => void;
	onSettings: () => void;
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

/** Content of the food offers options: the same canteen settings as in the settings screen, plus what only matters here. */
const FoodOffersOptionsContent: React.FC<FoodOffersOptionsContentProps> = ({
	closeSheet,
	onSort,
	onPriceGroup,
	onEatingHabits,
	onCanteen,
	onCalendar,
	onBusinessHours,
	onSettings,
}) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const foodsAreaColor = useAppSelector((state) => state.settings.appSettings?.foods_area_color) || primaryColor;

	const onPriceGroupClosingSheet = useCallback(() => { closeSheet(); onPriceGroup(); }, [closeSheet, onPriceGroup]);
	const onEatingHabitsClosingSheet = useCallback(() => { closeSheet(); onEatingHabits(); }, [closeSheet, onEatingHabits]);
	const sharedRows = useFoodofferSettingsRows({
		onCanteen,
		onPriceGroup: onPriceGroupClosingSheet,
		onEatingHabits: onEatingHabitsClosingSheet,
		onSort,
	});

	const navigationRow = (key: string, title: string, icon: React.ReactNode, onPress: () => void): SettingsGroupRow => ({
		key,
		render: (groupPosition, showSeparator) => (
			<SettingsList
				iconBgColor={foodsAreaColor}
				leftIcon={icon}
				title={title}
				rightIcon={<Octicons name="chevron-right" size={20} color={theme.screen.icon} />}
				onPress={onPress}
				groupPosition={groupPosition}
				showSeparator={showSeparator}
			/>
		),
	});

	const rows = [
		sharedRows.canteen,
		navigationRow('calendar', translate(TranslationKeys.date), <MaterialIcons name="calendar-month" size={20} />, onCalendar),
		sharedRows.priceGroup,
		sharedRows.eatingHabits,
		sharedRows.sort,
		sharedRows.averageRating,
		navigationRow('businessHours', translate(TranslationKeys.businesshours), <MaterialCommunityIcons name="clock-time-eight" size={20} />, onBusinessHours),
		navigationRow('settings', translate(TranslationKeys.further_settings), <MaterialCommunityIcons name="cog-outline" size={20} />, () => { closeSheet(); onSettings(); }),
	];

	return (
		<View style={styles.container}>
			<SettingsGroupRows rows={rows} />
		</View>
	);
};

interface UseMyScrollviewModalFoodOffersOptionsParams {
	onSort: () => void;
	onPriceGroup: () => void;
	onEatingHabits: () => void;
	onCanteen: () => void;
	onCalendar: () => void;
	onBusinessHours: () => void;
	onSettings: () => void;
}

export const useMyScrollviewModalFoodOffersOptions = (params: UseMyScrollviewModalFoodOffersOptionsParams) => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const openFoodOffersOptionsModal = useCallback(() => {
		showScrollViewModal({
			title: translate(TranslationKeys.options_and_information),
			children: (
				<FoodOffersOptionsContent
					closeSheet={closeScrollViewModal}
					onSort={params.onSort}
					onPriceGroup={params.onPriceGroup}
					onEatingHabits={params.onEatingHabits}
					onCanteen={params.onCanteen}
					onCalendar={params.onCalendar}
					onBusinessHours={params.onBusinessHours}
					onSettings={params.onSettings}
				/>
			),
		});
	}, [closeScrollViewModal, showScrollViewModal, translate, params.onSort, params.onPriceGroup, params.onEatingHabits, params.onCanteen, params.onCalendar, params.onBusinessHours, params.onSettings]);

	return { openFoodOffersOptionsModal };
};

export default useMyScrollviewModalFoodOffersOptions;
