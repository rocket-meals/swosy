import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { addDays } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { CollectibleAt, CollectionNames, DatabaseTypes, FoodSortOption, sortBySortField } from 'repo-depkit-common';
import FoodItem from '@/components/FoodItem/FoodItem';
import CanteenFeedbackLabels from '@/components/CanteenFeedbackLabels/CanteenFeedbackLabels';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { sortFoodOffers } from '@/helper/foodOfferSortHelper';
import styles from './styles';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import { SHEET_COMPONENTS } from '@/app/(app)/foodoffers';
import useMyScrollviewDirectusImageEditModal from '@/hooks/useMyScrollviewDirectusImageEditModal';
import FoodOfferInfoItem from '@/components/FoodOfferInfoItem/FoodOfferInfoItem';
import { getAppElementTranslation } from '@/helper/resourceHelper';
import CustomMarkdown from '@/components/CustomMarkdown/CustomMarkdown';
import { useMyContrastColor } from '@/helper/ColorHelper';
import { useSmartReadableDateMethod } from '@/helper/DateHelper';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';

interface FoodOffersScrollListProps {
	canteenId: string;
	startDate: string;
}

interface DayData {
	date: string;
	offers: DatabaseTypes.Foodoffers[];
}

interface DayItem {
	foodoffer: DatabaseTypes.Foodoffers | null;
	foodofferInfoItem: DatabaseTypes.FoodoffersInfoItems | null;
}

const FoodOffersScrollList: React.FC<FoodOffersScrollListProps> = ({ canteenId, startDate }) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { canteenFeedbackLabels, canteens } = useSelector((state: RootState) => state.canteenReducer);
	const { sortBy, language, amountColumnsForcard, appSettings, primaryColor, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
	const { ownFoodFeedbacks, foodCategories, foodOfferCategories, foodOffersInfoItems } = useSelector((state: RootState) => state.food);
	const { profile } = useSelector((state: RootState) => state.authReducer);
	const { appElements } = useSelector((state: RootState) => state.appElements);
	const selectedCanteen = canteens?.find(c => c.id === canteenId) as DatabaseTypes.Canteens | undefined;
	const [days, setDays] = useState<DayData[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [beforeElement, setBeforeElement] = useState<any>(null);
	const [afterElement, setAfterElement] = useState<any>(null);
	const [selectedSheet, setSelectedSheet] = useState<'menu' | keyof typeof SHEET_COMPONENTS | null>(null);
	const [sheetProps, setSheetProps] = useState<Record<string, any>>({});
	const bottomSheetRef = useRef<BottomSheet>(null);
	const [listWidth, setListWidth] = useState<number | null>(null);
	const MIN_CARD_WIDTH = 280;
	const { openDirectusImageEditModal } = useMyScrollviewDirectusImageEditModal();
	const foods_area_color = appSettings?.foods_area_color || primaryColor;
	const contrastColor = useMyContrastColor(theme.screen.background, theme, mode === 'dark');
	const smartReadableDate = useSmartReadableDateMethod();
	const openSheet = useCallback(
		(sheet: 'menu' | keyof typeof SHEET_COMPONENTS, props = {}) => {
			setSelectedSheet(sheet);
			setSheetProps(props);
		},
		[]
	);

	const closeSheet = useCallback(() => {
		bottomSheetRef.current?.snapToIndex(-1);
		bottomSheetRef.current?.close();
		setTimeout(() => {
			setSelectedSheet(null);
			setSheetProps({});
		}, 150);
	}, []);

	useEffect(() => {
		if (selectedSheet) {
			setTimeout(() => {
				bottomSheetRef.current?.expand();
			}, 150);
		}
	}, [selectedSheet]);

	useEffect(() => {
		if (!appElements || !appSettings) return;
		const getElement = (id: string) => {
			const element = appElements?.find((el: any) => el.id === id);
			if (!element || !element.translations) return null;
			const { content, popup_button_text, popup_content } = getAppElementTranslation(element.translations, language);
			return { content, popup_button_text, popup_content };
		};
		const before = getElement(String(appSettings.foodoffers_list_before_element));
		const after = getElement(String(appSettings.foodoffers_list_after_element));
		setBeforeElement(before);
		setAfterElement(after);
	}, [appElements, appSettings, language]);

	const SheetComponent = selectedSheet && selectedSheet !== 'menu' ? SHEET_COMPONENTS[selectedSheet] : null;

	const numColumns = useMemo(() => {
		if (amountColumnsForcard && amountColumnsForcard > 0) {
			return amountColumnsForcard;
		}
		if (!listWidth) return 2;
		const cols = Math.floor(listWidth / MIN_CARD_WIDTH);
		return Math.max(2, cols);
	}, [amountColumnsForcard, listWidth]);

	const cardWidth = useMemo(() => {
		if (!listWidth || !numColumns) return undefined;
		const horizontalMargin = 10;
		const totalMargin = horizontalMargin * 2 * numColumns;
		const availableWidth = listWidth - totalMargin;
		return availableWidth / numColumns;
	}, [listWidth, numColumns]);

	const sortOffers = useCallback(
		(foodOffers: DatabaseTypes.Foodoffers[]) =>
			sortFoodOffers(sortBy as FoodSortOption, foodOffers, {
				languageCode: language,
				ownFoodFeedbacks,
				profile,
				foodCategories,
				foodOfferCategories,
				useFoodOfferCategoryOnly: true,
			}),
		[sortBy, language, ownFoodFeedbacks, profile, foodCategories, foodOfferCategories]
	);

	useEffect(() => {
		setDays(prev => prev.map(d => ({ ...d, offers: sortOffers(d.offers) })));
	}, [sortOffers]);

	const loadDay = useCallback(
		async (date: string) => {
			try {
				const res = await fetchFoodOffersByCanteen(canteenId, date);
				const offers = res?.data || [];
				const sortedOffers = sortOffers(offers);
				return { date, offers: sortedOffers } as DayData;
			} catch (e) {
				console.error('Error loading food offers', e);
				return { date, offers: [] } as DayData;
			}
		},
		[canteenId, sortOffers]
	);

	const init = useCallback(async () => {
		setLoading(true);
		const baseDate = new Date(startDate);
		const toLoad = [0, 1, 2];
		const loaded: DayData[] = [];
		for (const offset of toLoad) {
			const d = addDays(baseDate, offset).toISOString().split('T')[0];
			loaded.push(await loadDay(d));
		}
		setDays(loaded);
		setLoading(false);
	}, [startDate, loadDay]);

	const openManagementSheet = useCallback(
		(food: DatabaseTypes.Foods) => {
			if (!food?.id) return;
			openDirectusImageEditModal({
				itemId: food.id,
				field: 'image',
				collection: CollectionNames.FOODS,
				onUpdated: init,
			});
		},
		[init, openDirectusImageEditModal]
	);

	useEffect(() => {
		init();
	}, [init]);

	const getInfoItemContent = useCallback(
		(item: DatabaseTypes.FoodoffersInfoItems) => {
			const elementId = typeof item.name === 'string' ? item.name : item.name?.id;
			const element = appElements?.find((el: any) => el.id === elementId);
			if (!element || !element.translations) return { content: '' };
			return getAppElementTranslation(element.translations, language);
		},
		[appElements, language]
	);

	const buildDayItems = useCallback(
		(offers: DatabaseTypes.Foodoffers[]) => {
			const hasOffers = offers.length > 0;
			const infoItemsFiltered = (foodOffersInfoItems || []).filter(info => {
				if (info.canteen && selectedCanteen && info.canteen !== selectedCanteen.id) {
					return false;
				}
				if (info.only_with_category && !offers.some(offer => offer.category === info.only_with_category)) {
					return false;
				}
				if (info.show_only_when_no_foodoffers_found && hasOffers) {
					return false;
				}
				return true;
			});
			const items: DayItem[] = [];
			let infoIndex = 0;
			offers.forEach(foodoffer => {
				items.push({ foodoffer, foodofferInfoItem: null });
				if (infoIndex < infoItemsFiltered.length) {
					items.push({ foodoffer: null, foodofferInfoItem: infoItemsFiltered[infoIndex] });
					infoIndex += 1;
				}
			});

			if (!hasOffers && infoItemsFiltered.length > 0) {
				infoItemsFiltered.forEach(info => {
					items.push({ foodoffer: null, foodofferInfoItem: info });
				});
			}

			return items;
		},
		[foodOffersInfoItems, selectedCanteen]
	);

	const renderItem = useCallback(
		({ item }: { item: DayItem }) => {
			if (item.foodofferInfoItem) {
				const { content, popup_button_text, popup_content } = getInfoItemContent(item.foodofferInfoItem);
				return (
					<View key={item.foodofferInfoItem.id} style={styles.elementContainer}>
						{content ? (
							<CustomMarkdown
								content={content}
								popup_button_text={popup_button_text}
								popup_content={popup_content}
							/>
						) : null}
					</View>
				);
			}

			if (!item.foodoffer) return null;

			return (
				<FoodItem
					item={item.foodoffer}
					fullWidth={false}
					cardWidth={cardWidth}
					openSheet={openSheet}
					openManagementSheet={openManagementSheet}
					onlyShowAddToCartButton
				/>
			);
		},
		[cardWidth, getInfoItemContent, openManagementSheet, openSheet]
	);

	const renderDay = useCallback(
		({ item }: { item: DayData }) => {
			const parsedDate = new Date(item.date);
			const dayName = smartReadableDate(parsedDate, 'EEEE');
			const dayDate = smartReadableDate(parsedDate, 'dd.MM.yyyy');
			const items = buildDayItems(item.offers);

			return (
				<View style={styles.dayContainer}>
					<View style={styles.dateHeaderRow}>
						<Text style={{ ...styles.dateHeader, color: theme.screen.text }}>{dayName}</Text>
						<Text style={{ ...styles.dateHeaderRight, color: theme.screen.text }}>{dayDate}</Text>
					</View>
					{beforeElement?.content ? (
						<View style={styles.elementContainer}>
							<CustomMarkdown
								content={beforeElement.content}
								popup_button_text={beforeElement.popup_button_text}
								popup_content={beforeElement.popup_content}
							/>
						</View>
					) : null}
					{items.length > 0 ? (
						<View style={styles.foodContainer}>
							{items.map(itemInfo =>
								itemInfo.foodoffer ? (
									<View key={itemInfo.foodoffer.id} style={{ width: cardWidth || '50%' }}>
										{renderItem({ item: itemInfo })}
									</View>
								) : (
									<View key={itemInfo.foodofferInfoItem?.id}>{renderItem({ item: itemInfo })}</View>
								)
							)}
						</View>
					) : (
						<View style={{ height: 150, justifyContent: 'center', alignItems: 'center' }}>
							<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.no_foodoffers_found_for_selection)}</Text>
						</View>
					)}
					{afterElement?.content ? (
						<View style={styles.elementContainer}>
							<CustomMarkdown
								content={afterElement.content}
								popup_button_text={afterElement.popup_button_text}
								popup_content={afterElement.popup_content}
							/>
						</View>
					) : null}
					<View style={{ ...styles.dayDivider, backgroundColor: contrastColor }} />
					<View style={styles.feebackContainer}>
						<CanteenFeedbackLabels feedbackLabels={canteenFeedbackLabels} canteenId={canteenId} />
					</View>
				</View>
			);
		},
		[afterElement, beforeElement, buildDayItems, canteenFeedbackLabels, canteenId, cardWidth, contrastColor, renderItem, smartReadableDate, theme.screen.text, translate]
	);

	const refresh = useCallback(async () => {
		setRefreshing(true);
		await init();
		setRefreshing(false);
	}, [init]);

	const renderFoodOffers = useMemo(() => {
		if (loading) {
			return (
				<View style={styles.loader}>
					<ActivityIndicator size="large" color={foods_area_color} />
				</View>
			);
		}
		return (
			<FlatList
				data={days}
				renderItem={renderDay}
				keyExtractor={item => item.date}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
				contentContainerStyle={{ paddingBottom: 20 }}
				showsVerticalScrollIndicator={false}
				onLayout={event => {
					const { width } = event.nativeEvent.layout;
					setListWidth(width);
				}}
			/>
		);
	}, [days, foods_area_color, loading, refresh, refreshing, renderDay]);

	return (
		<View style={{ flex: 1 }}>
			{renderFoodOffers}
			<BaseBottomSheet bottomSheetRef={bottomSheetRef} selectedSheet={selectedSheet} onClose={closeSheet}>
				{selectedSheet && selectedSheet === 'menu' ? null : (
					<View>
						{selectedSheet ? (
							<SheetComponent {...sheetProps} onClose={closeSheet} />
						) : null}
					</View>
				)}
			</BaseBottomSheet>
			<MarkingBottomSheet />
			<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers} />
		</View>
	);
};

export default FoodOffersScrollList;
