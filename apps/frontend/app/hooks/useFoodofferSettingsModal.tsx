import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Octicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import SettingsGroupRows, { SettingsGroupRow } from '@/components/SettingsGroupRows';
import SettingsList from '@/components/SettingsList/SettingsList';
import { formatPrice, showFormatedPrice } from '@/constants/HelperFunctions';
import useCanteenVisitsVisibilityModal from '@/hooks/useCanteenVisitsVisibilityModal';
import useFoodofferSettingsRows from '@/hooks/useFoodofferSettingsRows';
import useFoodofferSortingModal from '@/hooks/useFoodofferSortingModal';
import { useLanguage } from '@/hooks/useLanguage';
import useMyScrollviewModalChangeMyCanteenSelection from '@/hooks/useMyScrollviewModalChangeMyCanteenSelection';
import { useMyScrollviewModalPriceGroupSettings } from '@/hooks/useMyScrollviewModalPriceGroupSettings';
import { useTheme } from '@/hooks/useTheme';
import { TranslationKeys } from '@/locales/keys';
import { useAppSelector } from '@/redux/hooks';

type FoodofferSettingsContentProps = {
	closeSheet: () => void;
	onCanteen: () => void;
	onPriceGroup: () => void;
	onSort: () => void;
	onCanteenVisitsVisibility: () => void;
};

const CANTEEN_VISITS_VISIBILITY_LABELS = {
	all: TranslationKeys.canteen_visits_visibility_all,
	friends_only: TranslationKeys.canteen_visits_visibility_friends_only,
	off: TranslationKeys.canteen_visits_visibility_off,
} as const;

/** All canteen settings: the rows shared with the food offers options plus account balance, canteen visits and notifications. */
const FoodofferSettingsContent: React.FC<FoodofferSettingsContentProps> = ({ closeSheet, onCanteen, onPriceGroup, onSort, onCanteenVisitsVisibility }) => {
	const { translate } = useLanguage();
	const { theme } = useTheme();
	const primaryColor = useAppSelector(state => state.settings.primaryColor);
	const foodsAreaColor = useAppSelector(state => state.settings.appSettings?.foods_area_color) || primaryColor;
	const showCanteenVisits = useAppSelector(state => !!(state.settings.appSettings?.friends_enabled || state.authReducer.isDevMode));
	const canteenVisitsVisibility = useAppSelector(state => ((state.settings as any).canteenVisits?.visibility ?? 'all') as keyof typeof CANTEEN_VISITS_VISIBILITY_LABELS);
	const creditBalance = useAppSelector(state => state.authReducer.profile?.credit_balance);

	const navigateClosingSheet = useCallback(
		(path: '/eating-habits' | '/account-balance' | '/notification') => {
			closeSheet();
			router.navigate(path);
		},
		[closeSheet]
	);
	const onEatingHabits = useCallback(() => navigateClosingSheet('/eating-habits'), [navigateClosingSheet]);
	const sharedRows = useFoodofferSettingsRows({ onCanteen, onPriceGroup, onEatingHabits, onSort, withNativeIds: true });

	const navigationRow = (key: string, title: string, icon: React.ReactNode, onPress: () => void, value?: string): SettingsGroupRow => ({
		key,
		render: (groupPosition, showSeparator) => (
			<SettingsList
				iconBgColor={foodsAreaColor}
				leftIcon={icon}
				title={title}
				value={value}
				rightIcon={<Octicons name="chevron-right" size={20} color={theme.screen.icon} />}
				onPress={onPress}
				groupPosition={groupPosition}
				showSeparator={showSeparator}
			/>
		),
	});

	const rows = [
		sharedRows.canteen,
		sharedRows.priceGroup,
		navigationRow('account-balance', translate(TranslationKeys.accountbalance), <Ionicons name="card" size={20} />, () => navigateClosingSheet('/account-balance'), creditBalance ? showFormatedPrice(formatPrice(creditBalance)) : '€'),
		sharedRows.eatingHabits,
		sharedRows.sort,
		sharedRows.averageRating,
		showCanteenVisits &&
			navigationRow(
				'canteen-visits-visibility',
				translate(TranslationKeys.canteen_visits_visibility),
				<MaterialCommunityIcons name="silverware-fork-knife" size={20} />,
				onCanteenVisitsVisibility,
				translate(CANTEEN_VISITS_VISIBILITY_LABELS[canteenVisitsVisibility] ?? TranslationKeys.canteen_visits_visibility_all)
			),
		navigationRow('notification', translate(TranslationKeys.notification), <Ionicons name="notifications" size={20} />, () => navigateClosingSheet('/notification')),
	];

	return (
		<View style={styles.container}>
			<SettingsGroupRows rows={rows} />
		</View>
	);
};

/** Opens all canteen settings in a modal, used by the settings screen. */
const useFoodofferSettingsModal = () => {
	const { show, close } = useMyScrollViewModal();
	const { translate } = useLanguage();
	const { openChangeMyCanteenSelectionModal } = useMyScrollviewModalChangeMyCanteenSelection();
	const { openPriceGroupSettingsModal } = useMyScrollviewModalPriceGroupSettings();
	const { openFoodofferSortingModal } = useFoodofferSortingModal();
	const { openCanteenVisitsVisibilityModal } = useCanteenVisitsVisibilityModal();

	const openFoodofferSettingsModal = useCallback(() => {
		show({
			title: translate(TranslationKeys.canteen_settings),
			children: (
				<FoodofferSettingsContent
					closeSheet={close}
					onCanteen={openChangeMyCanteenSelectionModal}
					onPriceGroup={openPriceGroupSettingsModal}
					onSort={openFoodofferSortingModal}
					onCanteenVisitsVisibility={openCanteenVisitsVisibilityModal}
				/>
			),
		});
	}, [close, openCanteenVisitsVisibilityModal, openChangeMyCanteenSelectionModal, openFoodofferSortingModal, openPriceGroupSettingsModal, show, translate]);

	return { openFoodofferSettingsModal };
};

const styles = StyleSheet.create({
	container: {
		width: '100%',
	},
});

export default useFoodofferSettingsModal;
