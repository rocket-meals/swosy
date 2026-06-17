import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome6, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SettingsList from '@/components/SettingsList/SettingsList';
import { useAppSelector } from '@/redux/hooks';
import { shallowEqual } from 'react-redux';

interface FoodOffersOptionsContentProps {
	closeSheet: () => void;
	onSort: () => void;
	onPriceGroup: () => void;
	onEatingHabits: () => void;
	onCanteen: () => void;
	onCalendar: () => void;
	onBusinessHours: () => void;
	onUtilization: (() => void) | null;
}

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

const FoodOffersOptionsContent: React.FC<FoodOffersOptionsContentProps> = ({
	closeSheet,
	onSort,
	onPriceGroup,
	onEatingHabits,
	onCanteen,
	onCalendar,
	onBusinessHours,
	onUtilization,
}) => {
	const { translate } = useLanguage();
	const appSettings = useAppSelector((state) => state.settings.appSettings, shallowEqual);

	const options = [
		{
			key: 'canteen',
			title: translate(TranslationKeys.canteen),
			icon: <MaterialIcons name="restaurant-menu" size={20} />,
			onPress: () => { closeSheet(); onCanteen(); },
		},
		{
			key: 'calendar',
			title: translate(TranslationKeys.date),
			icon: <MaterialIcons name="calendar-month" size={20} />,
			onPress: () => { closeSheet(); onCalendar(); },
		},
		{
			key: 'sort',
			title: translate(TranslationKeys.sort),
			icon: <MaterialIcons name="sort" size={20} />,
			onPress: () => { closeSheet(); onSort(); },
		},
		{
			key: 'priceGroup',
			title: translate(TranslationKeys.price_group),
			icon: <FontAwesome6 name="euro-sign" size={20} />,
			onPress: () => { closeSheet(); onPriceGroup(); },
		},
		{
			key: 'eatingHabits',
			title: translate(TranslationKeys.eating_habits),
			icon: <Ionicons name="bag-add" size={20} />,
			onPress: () => { closeSheet(); onEatingHabits(); },
		},
		{
			key: 'businessHours',
			title: translate(TranslationKeys.businesshours),
			icon: <MaterialCommunityIcons name="clock-time-eight" size={20} />,
			onPress: () => { closeSheet(); onBusinessHours(); },
		},
	];

	if (onUtilization && appSettings?.utilization_display_enabled) {
		options.push({
			key: 'utilization',
			title: `${translate(TranslationKeys.forecast)}: ${translate(TranslationKeys.utilization)}`,
			icon: <FontAwesome6 name="people-group" size={20} />,
			onPress: () => { closeSheet(); onUtilization(); },
		});
	}

	return (
		<View style={styles.container}>
			{options.map((option, index) => (
				<SettingsList
					key={option.key}
					title={option.title}
					leftIcon={option.icon}
					onPress={option.onPress}
					groupPosition={
						options.length === 1
							? 'single'
							: index === 0
								? 'top'
								: index === options.length - 1
									? 'bottom'
									: 'middle'
					}
					showSeparator={index !== options.length - 1}
				/>
			))}
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
	onUtilization: (() => void) | null;
}

export const useMyScrollviewModalFoodOffersOptions = (params: UseMyScrollviewModalFoodOffersOptionsParams) => {
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const { translate } = useLanguage();

	const openFoodOffersOptionsModal = useCallback(() => {
		showScrollViewModal({
			title: translate(TranslationKeys.more_options),
			onClose: closeScrollViewModal,
			disableHorizontalPadding: true,
			children: (
				<FoodOffersOptionsContent
					closeSheet={closeScrollViewModal}
					onSort={params.onSort}
					onPriceGroup={params.onPriceGroup}
					onEatingHabits={params.onEatingHabits}
					onCanteen={params.onCanteen}
					onCalendar={params.onCalendar}
					onBusinessHours={params.onBusinessHours}
					onUtilization={params.onUtilization}
				/>
			),
		});
	}, [closeScrollViewModal, showScrollViewModal, translate, params.onSort, params.onPriceGroup, params.onEatingHabits, params.onCanteen, params.onCalendar, params.onBusinessHours, params.onUtilization]);

	return { openFoodOffersOptionsModal };
};

export default useMyScrollviewModalFoodOffersOptions;
