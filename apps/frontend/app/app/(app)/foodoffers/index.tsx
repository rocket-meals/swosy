import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	ActivityIndicator,
	SafeAreaView,
	Text,
	TouchableOpacity,
	View,
} from 'react-native';
import { CollectibleAt, CollectionNames, DatabaseTypes, sortBySortField } from 'repo-depkit-common';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import useKioskMode from '@/hooks/useKioskMode';
import {
	SET_BUSINESS_HOURS,
	SET_SELECTED_DATE,
	UPDATE_PROFILE,
} from '@/redux/Types/types';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import CanteenSelectionSheet from '@/components/CanteenSelectionSheet/CanteenSelectionSheet';
import HourSheet from '@/components/HoursSheet/HoursSheet';
import CalendarSheet from '@/components/CalendarSheet/CalendarSheet';
import { useLanguage } from '@/hooks/useLanguage';
import EatingHabitsSheet from '@/components/EatingHabitsSheet/EatingHabitsSheet';
import CanteenFeedbackLabels from '@/components/CanteenFeedbackLabels/CanteenFeedbackLabels';
import { BusinessHoursHelper } from '@/redux/actions/BusinessHours/BusinessHours';
import { getAppElementTranslation } from '@/helper/resourceHelper';
import LottieView from 'lottie-react-native';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';

import useSetPageTitle from '@/hooks/useSetPageTitle';
import CustomMarkdown from '@/components/CustomMarkdown/CustomMarkdown';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import AIGeneratedHintSheet from '@/components/AIGeneratedHintSheet';
import useFoodOffersDefaultDate from '@/hooks/useFoodOffersDefaultDate';
import useChatUnreadStatus from '@/hooks/useChatUnreadStatus';

import useUtilizationModal from '@/hooks/useUtilizationModal';
import usePopupEventModal from '@/hooks/usePopupEventModal';
import useFoodofferSortingModal from '@/hooks/useFoodofferSortingModal';
import useAppForegroundUpdateCheckModal from '@/hooks/useAppForegroundUpdateCheckModal';
import useMyScrollviewDirectusImageEditModal from '@/hooks/useMyScrollviewDirectusImageEditModal';

import FoodOffersHeader from './components/FoodOffersHeader';
import FoodOffersList from './components/FoodOffersList';
import { useFoodOffersData, useLayoutConfig, useSheetHandling, useNotifications, useAnimationLogic, useDateNavigation, DayItem } from './hooks';

export const SHEET_COMPONENTS = {
	canteen: CanteenSelectionSheet,
	hours: HourSheet,
	calendar: CalendarSheet,
	aiGeneratedInfo: AIGeneratedHintSheet,
	eatingHabits: EatingHabitsSheet,
};

const Index: React.FC<DrawerContentComponentProps> = () => {
	const dispatch = useDispatch();
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const router = useRouter();

	// --- Selectors ---
	const appSettings = useAppSelector((state) => state.settings.appSettings);
	const sortBy = useAppSelector((state) => state.settings.sortBy);
	const languageCode = useAppSelector((state) => state.settings.language);
	const drawerPosition = useAppSelector((state) => state.settings.drawerPosition);
	const primaryColor = useAppSelector((state) => state.settings.primaryColor);
	const mode = useAppSelector((state) => state.settings.selectedTheme);
	const amountColumnsForcard = useAppSelector((state) => state.settings.amountColumnsForcard);
	const debugMode = useAppSelector((state) => state.settings.debugMode);

	const ownFoodFeedbacks = useAppSelector((state) => state.food.ownFoodFeedbacks);
	const selectedDate = useAppSelector((state) => state.food.selectedDate);
	const foodCategories = useAppSelector((state) => state.food.foodCategories);
	const foodOfferCategories = useAppSelector((state) => state.food.foodOfferCategories);
	const foodOffersInfoItems = useAppSelector((state) => state.food.foodOffersInfoItems);

	const profile = useAppSelector((state) => state.authReducer.profile);
	const user = useAppSelector((state) => state.authReducer.user);
	const appElements = useAppSelector((state) => state.appElements.appElements);
	const selectedCanteenFoodOffers = useAppSelector((state) => state.canteenReducer.selectedCanteenFoodOffers);
	const canteenFeedbackLabels = useAppSelector((state) => state.canteenReducer.canteenFeedbackLabels);

	// --- Hooks & State ---
	const selectedCanteen = useSelectedCanteen();
	useFoodOffersDefaultDate();
	const kioskMode = useKioskMode();
	const { hasUnreadChats } = useChatUnreadStatus();
	const { openUtilizationModal } = useUtilizationModal();
	const { openActiveModal, activePopupEvent } = usePopupEventModal();
	const { openFoodofferSortingModal } = useFoodofferSortingModal();
	const { openDirectusImageEditModal } = useMyScrollviewDirectusImageEditModal();
	useAppForegroundUpdateCheckModal();
	useNotifications();

	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
	const contrastColor = myContrastColor(foods_area_color, theme, mode === 'dark');

	const {
		loading,
		refreshing,
		onRefresh,
		fetchFoods,
		feedbackLabelsLoading,
		cachedFoodOfferDates,
		nextAvailableDate
	} = useFoodOffersData(
		selectedCanteen,
		selectedDate,
		sortBy,
		languageCode,
		ownFoodFeedbacks,
		profile,
		foodCategories,
		foodOfferCategories
	);

	const {
		screenWidth,
		listWidth,
		setListWidth,
		numColumns,
		cardWidth,
		itemGap
	} = useLayoutConfig(amountColumnsForcard);

	const {
		bottomSheetRef,
		selectedSheet,
		sheetProps,
		openSheet,
		closeSheet,
		isActive
	} = useSheetHandling(openFoodofferSortingModal);

	const { animationRef, animationJson, autoPlay } = useAnimationLogic(appSettings, foods_area_color);
	const { handleDateChange, getDayLabel, getWeekdayKey } = useDateNavigation(selectedDate);

	// --- Effects ---
	useSetPageTitle(selectedCanteen?.alias || TranslationKeys.food_offers);

	useEffect(() => {
		openActiveModal();
	}, [activePopupEvent, openActiveModal]);

	const setDefaultPriceGroupForAnonymousUser = useCallback(() => {
		dispatch({
			type: UPDATE_PROFILE,
			payload: { ...profile, price_group: 'student' },
		});
	}, [dispatch, profile]);

	useEffect(() => {
		if (user && !user.id) setDefaultPriceGroupForAnonymousUser();
	}, [user, setDefaultPriceGroupForAnonymousUser]);

	const getBusinessHours = useCallback(async () => {
		const businessHoursHelper = new BusinessHoursHelper();
		try {
			const businessHours = (await businessHoursHelper.fetchBusinessHours({})) as DatabaseTypes.Businesshours[];
			dispatch({ type: SET_BUSINESS_HOURS, payload: businessHours });
		} catch (error) {
			console.error('Error fetching business hours:', error);
		}
	}, [dispatch]);

	useEffect(() => {
		getBusinessHours();
	}, [getBusinessHours]);

	// --- Memoized Data ---
	const dayItems = useMemo(() => {
		const offers = selectedCanteenFoodOffers || [];
		const hasOffers = offers.length > 0;

		const infoItemsFiltered = (foodOffersInfoItems || []).filter(info => {
			if (info.canteen && selectedCanteen && info.canteen !== selectedCanteen.id) {
				return false;
			}
			if (info.show_only_when_no_foodoffers_found) {
				return !hasOffers;
			}
			return hasOffers;
		});

		const startInfos = sortBySortField(infoItemsFiltered.filter(i => i.placement === 'start'));
		const endInfos = sortBySortField(infoItemsFiltered.filter(i => i.placement === 'end'));

		const start = startInfos.map(i => ({ foodoffer: null, foodofferInfoItem: i }));
		const main = offers.map(o => ({ foodoffer: o, foodofferInfoItem: null }));
		const end = endInfos.map(i => ({ foodoffer: null, foodofferInfoItem: i }));

		return [...start, ...main, ...end] as DayItem[];
	}, [selectedCanteenFoodOffers, foodOffersInfoItems, selectedCanteen]);

	const [beforeElement, setBeforeElement] = useState<any>(null);
	const [afterElement, setAfterElement] = useState<any>(null);

	useEffect(() => {
		if (!appElements || !appSettings) return;
		const getElement = (id: string) => {
			const element = appElements?.find((el: any) => el.id === id);
			if (!element || !element.translations) return null;
			const { content, popup_button_text, popup_content } = getAppElementTranslation(element.translations, languageCode);
			return { content, popup_button_text, popup_content };
		};
		const before = getElement(String(appSettings.foodoffers_list_before_element));
		const after = getElement(String(appSettings.foodoffers_list_after_element));
		setBeforeElement(before);
		setAfterElement(after);
	}, [appElements, appSettings, languageCode]);

	const memoizedCanteenFeedbackLabels = useMemo(
		() =>
			canteenFeedbackLabels?.map((label: DatabaseTypes.CanteensFeedbacksLabels, index: number) => (
				<CanteenFeedbackLabels key={label?.id || `feedback-label-${index}`} label={label} date={selectedDate} />
			)),
		[canteenFeedbackLabels, selectedDate]
	);
	const canteenFeedbackLabelsExist = canteenFeedbackLabels?.length > 0;

	const ListFooterComponent = useMemo(() => {
		return (
			<>
				{afterElement && <View style={styles.elementContainer}>{afterElement && <CustomMarkdown content={afterElement?.content || ''} backgroundColor={foods_area_color} imageWidth={440} imageHeight={293} />}</View>}
				{!feedbackLabelsLoading && (canteenFeedbackLabelsExist as any) > 0 && (
					<View style={styles.feebackContainer}>
						<View>
							<Text style={{ ...styles.foodLabels, color: theme.screen.text }}>{translate(TranslationKeys.feedback_labels)}</Text>
						</View>
						{memoizedCanteenFeedbackLabels}
					</View>
				)}
				{debugMode && (
					<View
						style={[
							styles.debugInfoContainer,
							{ borderColor: theme.screen.icon, backgroundColor: theme.screen.background },
						]}
					>
						<Text style={{ ...styles.debugTitle, color: theme.screen.text }}>
							{translate(TranslationKeys.cached_foodoffers_days)}
						</Text>
						<Text style={{ ...styles.debugText, color: theme.screen.text }}>
							{cachedFoodOfferDates.map(date => `${getDayLabel(date)} (${date})`).join(', ') || translate(TranslationKeys.cached_foodoffers_days_empty)}
						</Text>
					</View>
				)}
				<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers} />
				<View style={{ height: 40 }} />
			</>
		);
	}, [
		afterElement,
		feedbackLabelsLoading,
		canteenFeedbackLabelsExist,
		memoizedCanteenFeedbackLabels,
		foods_area_color,
		theme.screen.text,
		translate,
		debugMode,
		theme.screen.icon,
		cachedFoodOfferDates,
		getDayLabel
	]);

	const renderLottie = useMemo(() => {
		if (!animationJson) return null;
		return <LottieView ref={animationRef} source={animationJson} resizeMode="contain" style={{ width: '100%', height: '100%' }} autoPlay={autoPlay || false} loop={false} />;
	}, [animationJson, autoPlay]);

	const ListEmptyComponent = useMemo(() => {
		if (loading) {
			return (
				<View style={{ width: '100%', height: 400, justifyContent: 'center' }}>
					<ActivityIndicator size={'large'} color={theme.screen.icon} />
				</View>
			);
		}
		return (
			<View style={styles.noFoodContainer}>
				<Text style={{ ...styles.noFoodOffer, color: theme.screen.text }}>{translate(TranslationKeys.no_foodoffers_found_for_selection)}</Text>
				<View style={styles.animationContainer}>{renderLottie}</View>
				{nextAvailableDate && (
					<TouchableOpacity
						onPress={() => dispatch({ type: SET_SELECTED_DATE, payload: nextAvailableDate })}
						activeOpacity={0.7}
						style={[styles.jumpButton, { backgroundColor: foods_area_color }]}
					>
						<Text style={[styles.jumpButtonText, { color: contrastColor }]}>
							{`${translate(TranslationKeys.show_offers_on)} ${translate(
								TranslationKeys[getWeekdayKey(nextAvailableDate) as keyof typeof TranslationKeys]
							)}`}
						</Text>
					</TouchableOpacity>
				)}
			</View>
		);
	}, [loading, theme.screen.icon, theme.screen.text, renderLottie, nextAvailableDate, foods_area_color, contrastColor, translate, getWeekdayKey, dispatch]);

	const openManagementSheet = useCallback(
		(food: DatabaseTypes.Foods) => {
			if (!food?.id) return;
			openDirectusImageEditModal({
				itemId: food.id,
				field: 'image',
				collection: CollectionNames.FOODS,
				onUpdated: fetchFoods,
			});
		},
		[fetchFoods, openDirectusImageEditModal]
	);

	const getInfoItemContent = useCallback(
		(item: DatabaseTypes.FoodoffersInfoItems) => {
			const elementId = typeof item.name === 'string' ? item.name : item.name?.id;
			const element = appElements?.find((el: any) => el.id === elementId);
			if (!element || !element.translations) return { content: '' };
			return getAppElementTranslation(element.translations, languageCode);
		},
		[appElements, languageCode]
	);

	const SheetComponent = selectedSheet && selectedSheet !== 'menu' && selectedSheet !== 'sort' ? SHEET_COMPONENTS[selectedSheet as keyof typeof SHEET_COMPONENTS] : null;

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: theme.screen.background }}>
			<View style={{ flex: 1 }}>
				<FoodOffersHeader
					drawerPosition={drawerPosition as 'left' | 'right'}
					hasUnreadChats={hasUnreadChats}
					selectedCanteen={selectedCanteen}
					selectedDate={selectedDate}
					profile={profile}
					appSettings={appSettings}
					openSheet={openSheet}
					handleDateChange={handleDateChange}
					openUtilizationModal={openUtilizationModal}
					getDayLabel={getDayLabel}
				/>
				<FoodOffersList
					dayItems={dayItems}
					numColumns={numColumns}
					cardWidth={cardWidth || 0}
					refreshing={refreshing}
					onRefresh={onRefresh}
					ListFooterComponent={ListFooterComponent}
					ListEmptyComponent={ListEmptyComponent}
					setListWidth={setListWidth}
					listWidth={listWidth}
					selectedCanteen={selectedCanteen}
					handleMenuSheet={openSheet}
					handleImageSheet={openManagementSheet}
					handleEatingHabitsSheet={openSheet}
					getInfoItemContent={getInfoItemContent}
				/>
			</View>

			{isActive &&
				!kioskMode &&
				(selectedSheet === 'menu' ? (
					<MarkingBottomSheet ref={bottomSheetRef} onClose={closeSheet} />
				) : (
					<BaseBottomSheet
						key={selectedSheet || 'sheet'}
						ref={bottomSheetRef}
						backgroundStyle={{ ...styles.sheetBackground, backgroundColor: theme.sheet.sheetBg }}
						enablePanDownToClose
						enableContentPanningGesture
						enableHandlePanningGesture
						enableDynamicSizing
						onChange={index => {
							if (index === -1) closeSheet();
						}}
						onClose={closeSheet}
						handleComponent={null}
					>
						{SheetComponent && (
							selectedSheet === 'calendar' ? (
								<SheetComponent closeSheet={closeSheet} {...sheetProps} updateGlobal={true} />
							) : (
								<SheetComponent closeSheet={closeSheet} {...sheetProps} />
							)
						)}
					</BaseBottomSheet>
				))}
		</SafeAreaView>
	);
};

export default Index;
