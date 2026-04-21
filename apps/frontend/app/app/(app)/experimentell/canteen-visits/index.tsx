import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { addDays, format } from 'date-fns';
import { useTheme } from '@/hooks/useTheme';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { CollectibleAt, CollectionNames, DatabaseTypes, FoodSortOption, sortBySortField } from 'repo-depkit-common';
import FoodItem from '@/components/FoodItem/FoodItem';
import CanteenFeedbackLabels from '@/components/CanteenFeedbackLabels/CanteenFeedbackLabels';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { sortFoodOffers } from '@/helper/foodOfferSortHelper';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { useFocusEffect, useRouter } from 'expo-router';

import { SHEET_COMPONENTS } from '@/app/(app)/foodoffers';
import useMyScrollviewDirectusImageEditModal from '@/hooks/useMyScrollviewDirectusImageEditModal';
import { useAppSelector } from '@/redux/hooks';
import { useDispatch } from 'react-redux';
import { CanteenFeedbackLabelHelper } from '@/redux/actions/CanteenFeedbacksLabel/CanteenFeedbacksLabel';
import { SET_CANTEEN_FEEDBACK_LABELS } from '@/redux/Types/types';
import { useMyContrastColor } from '@/helper/ColorHelper';
import { useSmartReadableDateMethod } from '@/helper/DateHelper';
import CustomMarkdown from '@/components/CustomMarkdown/CustomMarkdown';
import { getAppElementTranslation } from '@/helper/resourceHelper';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import FoodOfferInfoItem from '@/components/FoodOfferInfoItem/FoodOfferInfoItem';
import CardDimensionHelper from '@/helper/CardDimensionHelper';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import useFoodOffersDefaultDate from '@/hooks/useFoodOffersDefaultDate';
import { CanteenVisitsHelper, getFriendProfileIds } from '@/redux/actions/CanteenVisits/CanteenVisits';
import { useMyScrollViewModal } from '@/components/GlobalModal/useMyScrollViewModal';
import { UserHelper } from '@/helper/UserHelper';
import SettingsList from '@/components/SettingsList';
import SettingsListBoolean from '@/components/SettingsListBoolean';
import { MaterialCommunityIcons, Entypo } from '@expo/vector-icons';
import { FriendsContent } from '@/app/(app)/experimentell/friendships';

interface DayData {
	date: string;
	offers: DatabaseTypes.Foodoffers[];
}

interface DayItem {
	foodoffer: DatabaseTypes.Foodoffers | null;
	foodofferInfoItem: DatabaseTypes.FoodoffersInfoItems | null;
}

const EMPTY_FEEDBACKS: any[] = [];
const daysCache: Record<string, DayData[]> = {};
const canteenFeedbackLabelHelper = new CanteenFeedbackLabelHelper();
const canteenVisitsHelper = new CanteenVisitsHelper();

const CanteenVisitsScreen: React.FC = () => {
	useSetPageTitle(TranslationKeys.canteen_visits);
	const selectedCanteen = useSelectedCanteen();
	const selectedDate = useAppSelector((state) => state.food.selectedDate);
	useFoodOffersDefaultDate();

	const canteenId = selectedCanteen?.id as string;
	const startDate = selectedDate;

	const { theme } = useTheme();
	const { translate } = useLanguage();
	const dispatch = useDispatch();
	const router = useRouter();
	const { canteenFeedbackLabels } = useAppSelector((state) => state.canteenReducer);
	const { sortBy, language, amountColumnsForcard, appSettings, primaryColor, selectedTheme: mode } = useAppSelector((state) => state.settings);
	const { ownFoodFeedbacks, foodCategories, foodOfferCategories, foodOffersInfoItems } = useAppSelector((state) => state.food);
	const { profile, user } = useAppSelector((state) => state.authReducer);
	const { appElements } = useAppSelector((state) => state.appElements);
	const { friendships } = useAppSelector((state) => state.friendships);
	const { show: showScrollViewModal, close: closeScrollViewModal } = useMyScrollViewModal();
	const isRegistered = UserHelper.isRegisteredUser(user);

	const flatListRef = useRef<FlatList<DayData>>(null);
	const [days, setDays] = useState<DayData[]>([]);
	const [loading, setLoading] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [selectedSheet, setSelectedSheet] = useState<keyof typeof SHEET_COMPONENTS | null>(null);
	const [sheetProps, setSheetProps] = useState<Record<string, any>>({});
	const [listWidth, setListWidth] = useState<number | null>(null);
	const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
	const bottomSheetRef = useRef<BottomSheet>(null);
	const { openDirectusImageEditModal } = useMyScrollviewDirectusImageEditModal();
	const foods_area_color = appSettings?.foods_area_color || primaryColor;
	const contrastColor = useMyContrastColor(theme.screen.background, theme, mode === 'dark');
	const smartReadableDate = useSmartReadableDateMethod();
	const languageCode = language;

	// Canteen visit counts per date
	const [visitCounts, setVisitCounts] = useState<Record<string, { total: number; friends: number }>>({});
	// Own visit records per date (visit ID or null)
	const [ownVisits, setOwnVisits] = useState<Record<string, string | null>>({});
	const [togglingVisit, setTogglingVisit] = useState<Record<string, boolean>>({});

	const friendProfileIds = useMemo(() => {
		if (!isRegistered || !profile?.id) return [];
		return getFriendProfileIds(friendships, profile.id);
	}, [isRegistered, profile?.id, friendships]);

	const fetchVisitCountsForDate = useCallback(async (date: string) => {
		if (!canteenId) return;
		const total = await canteenVisitsHelper.fetchVisitCountForDate(canteenId, date);
		let friends = 0;
		if (friendProfileIds.length > 0) {
			friends = await canteenVisitsHelper.fetchFriendVisitCountForDate(canteenId, date, friendProfileIds);
		}
		setVisitCounts(prev => {
			if (prev[date]?.total === total && prev[date]?.friends === friends) return prev;
			return { ...prev, [date]: { total, friends } };
		});
	}, [canteenId, friendProfileIds]);

	const fetchOwnVisitForDate = useCallback(async (date: string) => {
		if (!canteenId || !isRegistered || !profile?.id) return;
		const visit = await canteenVisitsHelper.fetchOwnVisitForDate(canteenId, date, profile.id);
		setOwnVisits(prev => {
			const newVal = visit?.id ?? null;
			if (prev[date] === newVal) return prev;
			return { ...prev, [date]: newVal };
		});
	}, [canteenId, isRegistered, profile?.id]);

	const toggleOwnVisit = useCallback(async (date: string) => {
		if (!canteenId || !isRegistered || !profile?.id) return;
		if (togglingVisit[date]) return;
		setTogglingVisit(prev => ({ ...prev, [date]: true }));
		try {
			const existingVisitId = ownVisits[date];
			if (existingVisitId) {
				await canteenVisitsHelper.deleteVisit(existingVisitId);
				setOwnVisits(prev => ({ ...prev, [date]: null }));
			} else {
				const created = await canteenVisitsHelper.createVisitForDate(canteenId, date, profile.id);
				setOwnVisits(prev => ({ ...prev, [date]: created.id }));
			}
			await fetchVisitCountsForDate(date);
		} catch (error) {
			console.error('Error toggling canteen visit:', error);
		} finally {
			setTogglingVisit(prev => ({ ...prev, [date]: false }));
		}
	}, [canteenId, isRegistered, profile?.id, ownVisits, togglingVisit, fetchVisitCountsForDate]);

	const openVisitDetailsModal = useCallback((date: string) => {
		const counts = visitCounts[date] || { total: 0, friends: 0 };
		const isOwnVisitActive = !!ownVisits[date];

		showScrollViewModal({
			title: translate(TranslationKeys.canteen_visits_details),
			children: (
				<View>
					{isRegistered && (
						<>
							<SettingsListBoolean
								leftIcon={<MaterialCommunityIcons name="hand-wave" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_i_will_be_there)}
								isEnabled={isOwnVisitActive}
								onToggle={() => {
									toggleOwnVisit(date);
									closeScrollViewModal();
								}}
								groupPosition="top"
							/>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="hand-wave" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_i_will_be_there_description)}
								italic={true}
								groupPosition="bottom"
							/>
						</>
					)}
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="account-group" size={24} color={theme.screen.icon} />}
						iconBgColor={primaryColor}
						label={translate(TranslationKeys.canteen_visits_total_people)}
						value={String(counts.total)}
						groupPosition="top"
					/>
					<SettingsList
						leftIcon={<MaterialCommunityIcons name="account-group" size={24} color={theme.screen.icon} />}
						iconBgColor={primaryColor}
						label={translate(TranslationKeys.canteen_visits_total_description)}
						italic={true}
						groupPosition="bottom"
					/>
					{isRegistered ? (
						<>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="account-heart" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_friends)}
								value={String(counts.friends)}
								groupPosition="top"
							/>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="account-heart" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_friends_description)}
								italic={true}
								groupPosition="bottom"
							/>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="account-multiple-plus" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_manage_friends)}
								rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
								handleFunction={() => {
									closeScrollViewModal();
									showScrollViewModal({
										title: translate(TranslationKeys.friendships),
										children: <FriendsContent showHeading={false} />,
									});
								}}
								groupPosition="single"
							/>
						</>
					) : (
						<>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="account-heart" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_friends)}
								value="-"
								isAccountRequired={true}
								onAccountRequired={() => {
									closeScrollViewModal();
									router.navigate('/(auth)/login');
								}}
								groupPosition="top"
							/>
							<SettingsList
								leftIcon={<MaterialCommunityIcons name="login" size={24} color={theme.screen.icon} />}
								iconBgColor={primaryColor}
								label={translate(TranslationKeys.canteen_visits_login_hint)}
								rightIcon={<Entypo name="chevron-small-right" color={theme.screen.icon} size={24} />}
								handleFunction={() => {
									closeScrollViewModal();
									router.navigate('/(auth)/login');
								}}
								groupPosition="bottom"
							/>
						</>
					)}
				</View>
			),
		});
	}, [visitCounts, ownVisits, translate, theme.screen.icon, primaryColor, isRegistered, showScrollViewModal, closeScrollViewModal, router, toggleOwnVisit]);

	useEffect(() => {
		const fetchLabels = async () => {
			try {
				const labels = (await canteenFeedbackLabelHelper.fetchCanteenFeedbackLabels()) as DatabaseTypes.CanteensFeedbacksLabels[];
				dispatch({ type: SET_CANTEEN_FEEDBACK_LABELS, payload: labels });
			} catch (e) {
				console.error('Error fetching canteen feedback labels', e);
			}
		};
		fetchLabels();
	}, [dispatch]);

	// Fetch visit counts when days change
	useEffect(() => {
		const datesToFetch = days.map(d => d.date).filter(date => visitCounts[date] === undefined);
		if (datesToFetch.length === 0) return;
		Promise.all(datesToFetch.map(date => fetchVisitCountsForDate(date)));
	}, [days, fetchVisitCountsForDate]);

	// Fetch own visit status when days change
	useEffect(() => {
		if (!isRegistered) return;
		const datesToFetch = days.map(d => d.date).filter(date => ownVisits[date] === undefined);
		if (datesToFetch.length === 0) return;
		Promise.all(datesToFetch.map(date => fetchOwnVisitForDate(date)));
	}, [days, isRegistered, fetchOwnVisitForDate]);

	const cacheKey = useMemo(
		() => `canteen-visits_${canteenId}_${startDate}`,
		[canteenId, startDate]
	);

	const updateCache = useCallback(
		(newDays: DayData[]) => {
			daysCache[cacheKey] = newDays;
		},
		[cacheKey]
	);

	const appElementsMap = useMemo(() => {
		if (!appElements) return new Map();
		const map = new Map(appElements.map((el: any) => [el.id, el]));
		return map;
	}, [appElements]);

	const [beforeElement, setBeforeElement] = useState<any>(null);
	const [afterElement, setAfterElement] = useState<any>(null);

	useEffect(() => {
		if (!appElementsMap || !appSettings) return;
		const getElement = (id: string) => {
			const element = appElementsMap.get(id);
			if (!element || !element.translations) return null;
			const { content, popup_button_text, popup_content } = getAppElementTranslation(element.translations, languageCode);
			return { content, popup_button_text, popup_content };
		};
		const before = getElement(String(appSettings.foodoffers_list_before_element));
		const after = getElement(String(appSettings.foodoffers_list_after_element));

		setBeforeElement((prev: any) => {
			if (JSON.stringify(prev) === JSON.stringify(before)) return prev;
			return before;
		});
		setAfterElement((prev: any) => {
			if (JSON.stringify(prev) === JSON.stringify(after)) return prev;
			return after;
		});
	}, [appElementsMap, appSettings, languageCode]);

	const parseDateOnly = useCallback((date: string) => {
		const [year, month, day] = date.split('-').map(Number);
		if (!year || !month || !day) {
			return new Date(date);
		}
		return new Date(year, month - 1, day);
	}, []);

	const buildDayItems = useCallback((offers: DatabaseTypes.Foodoffers[], date: string) => {
		const hasOffers = offers.length > 0;
		const dayOfWeek = parseDateOnly(date).getDay();
		const weekdayFields: string[] = [
			'show_on_sundays',
			'show_on_mondays',
			'show_on_tuesdays',
			'show_on_wednesdays',
			'show_on_thursdays',
			'show_on_fridays',
			'show_on_saturdays',
		];
		const infoItemsFiltered = (foodOffersInfoItems || []).filter(info => {
			if (info.canteen && selectedCanteen && info.canteen !== selectedCanteen.id) {
				return false;
			}
			const weekdayField = weekdayFields[dayOfWeek];
			const fieldValue = (info as DatabaseTypes.FoodoffersInfoItems & Record<string, boolean | null | undefined>)[weekdayField];
			if (fieldValue != null && !fieldValue) {
				return false;
			}
			if (info.show_only_when_no_foodoffers_found) {
				return !hasOffers;
			}
			return hasOffers;
		});

		const startInfos = sortBySortField(infoItemsFiltered.filter(i => i.placement === 'start'));
		const endInfos = sortBySortField(infoItemsFiltered.filter(i => i.placement === 'end'));

		const startItems = startInfos.map(i => ({ foodoffer: null, foodofferInfoItem: i }));
		const main = offers.map(o => ({ foodoffer: o, foodofferInfoItem: null }));
		const endItems = endInfos.map(i => ({ foodoffer: null, foodofferInfoItem: i }));

		return [...startItems, ...main, ...endItems] as DayItem[];
	}, [foodOffersInfoItems, selectedCanteen, parseDateOnly]);

	const getInfoItemContent = useCallback(
		(item: DatabaseTypes.FoodoffersInfoItems) => {
			if (!item || !appElementsMap) return null;
			const elementId = typeof item.name === 'string' ? item.name : item.name?.id;
			const element = appElementsMap.get(elementId);
			if (!element) return null;
			const { content, popup_button_text, popup_content } = getAppElementTranslation(element.translations, languageCode);
			return { content, popup_button_text, popup_content };
		},
		[appElementsMap, languageCode]
	);

	const openSheet = useCallback(
		(sheet: keyof typeof SHEET_COMPONENTS, props = {}) => {
			setSelectedSheet(sheet);
			setSheetProps(props);
		},
		[]
	);

	useEffect(() => {
		if (!listWidth && screenWidth) {
			setListWidth(screenWidth);
		}
	}, [listWidth, screenWidth]);

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

	const SheetComponent = selectedSheet ? SHEET_COMPONENTS[selectedSheet] : null;
	const numColumns = useMemo(() => {
		return CardDimensionHelper.getGridNumColumns(listWidth || 0, amountColumnsForcard);
	}, [amountColumnsForcard, listWidth]);

	const itemGap = useMemo(() => {
		return CardDimensionHelper.getItemGap(screenWidth);
	}, [screenWidth]);

	const cardWidth = useMemo(() => {
		if (!listWidth || !numColumns) return undefined;
		return CardDimensionHelper.getGridCardWidth(listWidth, numColumns, itemGap);
	}, [itemGap, listWidth, numColumns]);

	const ownFoodFeedbacksForSort = useMemo(() => {
		if (sortBy === FoodSortOption.FAVORITE || sortBy === FoodSortOption.INTELLIGENT) {
			return ownFoodFeedbacks;
		}
		return EMPTY_FEEDBACKS;
	}, [sortBy]);

	const sortOffers = useCallback(
		(foodOffers: DatabaseTypes.Foodoffers[]) =>
			sortFoodOffers(sortBy as FoodSortOption, foodOffers, {
				languageCode: language,
				ownFoodFeedbacks: ownFoodFeedbacksForSort,
				profile,
				foodCategories,
				foodOfferCategories,
				useFoodOfferCategoryOnly: true,
			}),
		[sortBy, language, ownFoodFeedbacksForSort, profile, foodCategories, foodOfferCategories]
	);

	useEffect(() => {
		setDays(prev => {
			const updated = prev.map(d => ({ ...d, offers: sortOffers(d.offers) }));
			if (updated.length > 0 && daysCache[cacheKey] !== undefined) {
				updateCache(updated);
			}
			return updated;
		});
	}, [sortOffers, updateCache, cacheKey]);

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

	const init = useCallback(
		async (forceReload = false) => {
			if (!canteenId || !startDate) return;
			if (!forceReload && daysCache[cacheKey]) {
				setDays(daysCache[cacheKey]);
				setLoading(false);
				return;
			}

			setLoading(true);
			const baseDate = parseDateOnly(startDate);
			const toLoad = [0, 1, 2];
			const loaded: DayData[] = [];
			for (const offset of toLoad) {
				const d = format(addDays(baseDate, offset), 'yyyy-MM-dd');
				loaded.push(await loadDay(d));
			}
			setDays(loaded);
			updateCache(loaded);
			setLoading(false);
		},
		[canteenId, startDate, loadDay, cacheKey, updateCache]
	);

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

	useFocusEffect(
		useCallback(() => {
			init();
		}, [init])
	);

	useEffect(() => {
		flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
	}, [startDate]);

	useEffect(() => {
		const handleResize = () => setScreenWidth(Dimensions.get('window').width);
		const subscription = Dimensions.addEventListener('change', handleResize);
		return () => subscription?.remove();
	}, []);

	const loadNext = async () => {
		if (!days.length) return;
		const lastDate = days[days.length - 1].date;
		const nextDate = format(addDays(parseDateOnly(lastDate), 1), 'yyyy-MM-dd');
		const nextDay = await loadDay(nextDate);
		setDays(prev => {
			const updated = [...prev, nextDay];
			updateCache(updated);
			return updated;
		});
	};

	const onEndReached = () => {
		loadNext();
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await init(true);
		setRefreshing(false);
	};

	const renderDay = ({ item }: { item: DayData }) => {
		const feedbacks = canteenFeedbackLabels?.map((label, idx) => {
			const total = canteenFeedbackLabels.length;
			const groupPosition = total === 1 ? 'single' : idx === 0 ? 'top' : idx === total - 1 ? 'bottom' : 'middle';
			return <CanteenFeedbackLabels key={`fl-${idx}`} label={label} date={item.date} groupPosition={groupPosition} isAccountRequired={!user?.id} />;
		});
		const dayItems = buildDayItems(item.offers, item.date);
		const hasInfoItems = dayItems.some(dayItem => dayItem.foodofferInfoItem);
		const isOwnVisitActive = !!ownVisits[item.date];

		return (
			<View style={styles.dayContainer}>
				<View style={styles.dateHeaderRow}>
					<Text style={[styles.dateHeader, { color: theme.screen.text }]}>{smartReadableDate(parseDateOnly(item.date))}</Text>
					{isRegistered && (
						<TouchableOpacity
							style={[styles.ownVisitToggle, isOwnVisitActive && { backgroundColor: primaryColor + '30' }]}
							onPress={() => toggleOwnVisit(item.date)}
							activeOpacity={0.7}
							disabled={!!togglingVisit[item.date]}
						>
							<MaterialCommunityIcons
								name="hand-wave"
								size={16}
								color={isOwnVisitActive ? primaryColor : theme.screen.text}
							/>
						</TouchableOpacity>
					)}
					<TouchableOpacity
						style={styles.visitCountButton}
						onPress={() => openVisitDetailsModal(item.date)}
						activeOpacity={0.7}
					>
						<View style={styles.visitCountRow}>
							<MaterialCommunityIcons name="account-group" size={16} color={theme.screen.text} />
							<Text style={[styles.visitCountText, { color: theme.screen.text }]}>{visitCounts[item.date]?.total ?? '…'}</Text>
						</View>
						{isRegistered && friendProfileIds.length > 0 && (
							<View style={styles.visitCountRow}>
								<MaterialCommunityIcons name="account-heart" size={16} color={theme.screen.text} />
								<Text style={[styles.visitCountText, { color: theme.screen.text }]}>{visitCounts[item.date]?.friends ?? '…'}</Text>
							</View>
						)}
					</TouchableOpacity>
				</View>
				{beforeElement && (
					<View style={styles.elementContainer}>
						<CustomMarkdown content={beforeElement?.content || ''} backgroundColor={foods_area_color} imageWidth={440} imageHeight={293} />
					</View>
				)}
				<View
					style={[
						styles.foodContainer,
						{
							justifyContent: 'center',
						},
					]}
					onLayout={event => {
						const width = event.nativeEvent.layout.width;
						if (!listWidth || width > listWidth) {
							setListWidth(width);
						}
					}}
				>
					{dayItems.map((dayItem, index) => {
						if (dayItem.foodoffer) {
							return (
								<View
									key={`offer-${dayItem.foodoffer.id}`}
									style={{
										width: cardWidth || '100%',
										marginHorizontal: itemGap,
										marginVertical: itemGap,
										alignItems: 'center',
									}}
								>
									<FoodItem
										item={dayItem.foodoffer}
										canteen={selectedCanteen as DatabaseTypes.Canteens}
										handleMenuSheet={openSheet}
										handleImageSheet={openManagementSheet}
										cardWidth={cardWidth}
									/>
								</View>
							);
						}
						if (dayItem.foodofferInfoItem) {
							const infoContent = getInfoItemContent(dayItem.foodofferInfoItem);
							if (!infoContent) return null;
							return (
								<View
									key={`info-${dayItem.foodofferInfoItem.id}`}
									style={{
										width: cardWidth || '100%',
										marginHorizontal: itemGap,
										marginVertical: itemGap,
										alignItems: 'center',
									}}
								>
									<FoodOfferInfoItem
										item={dayItem.foodofferInfoItem}
										content={infoContent.content}
										cardWidth={cardWidth}
										screenWidth={screenWidth}
									/>
								</View>
							);
						}
						return null;
					})}
					{item.offers.length === 0 && !hasInfoItems && (
						<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.no_foodoffers_found_for_selection)}</Text>
					)}
				</View>
				{afterElement && (
					<View style={styles.elementContainer}>
						<CustomMarkdown content={afterElement?.content || ''} backgroundColor={foods_area_color} imageWidth={440} imageHeight={293} />
					</View>
				)}
				{feedbacks && feedbacks.length > 0 && (
					<View style={styles.feebackContainer}>
						<Text style={[styles.feedbackLabelsTitle, { color: theme.screen.text }]}>
							{translate(TranslationKeys.feedback_labels)}
						</Text>
						{feedbacks}
					</View>
				)}
				<CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers} />
				<View style={[styles.dayDivider, { backgroundColor: contrastColor }]} />
			</View>
		);
	};

	if (!canteenId) {
		return (
			<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen.background }]}>
				<View style={styles.loader}>
					<Text style={{ color: theme.screen.text }}>{translate(TranslationKeys.no_canteens_found)}</Text>
				</View>
			</SafeAreaView>
		);
	}

	if (loading) {
		return (
			<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen.background }]}>
				<View style={styles.loader}>
					<ActivityIndicator />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={[styles.safeArea, { backgroundColor: theme.screen.background }]}>
			<FlatList
				ref={flatListRef}
				data={days}
				keyExtractor={item => item.date}
				renderItem={renderDay}
				onEndReached={onEndReached}
				onEndReachedThreshold={0.5}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
				scrollEventThrottle={16}
				style={{ flex: 1 }}
				contentContainerStyle={{ backgroundColor: theme.screen.background }}
			/>
			{selectedSheet && (
				<BaseBottomSheet key={selectedSheet} ref={bottomSheetRef} backgroundStyle={{ backgroundColor: theme.sheet.sheetBg }} handleComponent={null} onClose={closeSheet}>
					{SheetComponent && <SheetComponent closeSheet={closeSheet} {...sheetProps} />}
				</BaseBottomSheet>
			)}
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
	},
	dayContainer: {
		paddingVertical: 10,
		paddingHorizontal: 0,
	},
	dateHeaderRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingHorizontal: 10,
	},
	dateHeader: {
		fontSize: 18,
		flex: 1,
	},
	loader: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	foodContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'stretch',
		flexWrap: 'wrap',
		marginTop: 12,
	},
	feebackContainer: {
		width: '100%',
		marginTop: 20,
	},
	feedbackLabelsTitle: {
		fontSize: 24,
		fontFamily: 'Poppins_700Bold',
		paddingHorizontal: 10,
		marginBottom: 6,
	},
	elementContainer: {
		width: '100%',
		marginTop: 12,
		paddingHorizontal: 10,
	},
	dayDivider: {
		height: 1,
		marginTop: 6,
		marginHorizontal: 10,
	},
	visitCountButton: {
		flexDirection: 'row',
		alignItems: 'center',
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		gap: 10,
	},
	ownVisitToggle: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 8,
		marginRight: 4,
	},
	visitCountRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 3,
	},
	visitCountText: {
		fontSize: 14,
	},
});

export default CanteenVisitsScreen;
