import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Dimensions, Platform, Image } from 'react-native';
import { useDispatch } from 'react-redux';
import { DatabaseTypes, FoodSortOption, sortBySortField } from 'repo-depkit-common';
import { addDays, format, parse } from 'date-fns';
import { fetchFoodOffersByCanteen } from '@/redux/actions/FoodOffers/FoodOffers';
import { sortFoodOffers } from '@/helper/foodOfferSortHelper';
import {
    SET_SELECTED_CANTEEN_FOOD_OFFERS,
    SET_SELECTED_CANTEEN_FOOD_OFFERS_LOCAL,
    SET_CANTEEN_FEEDBACK_LABELS,
    SET_SELECTED_DATE
} from '@/redux/Types/types';
import { CanteenFeedbackLabelHelper } from '@/redux/actions/CanteenFeedbacksLabel/CanteenFeedbacksLabel';
import * as Notifications from 'expo-notifications';
import LottieView from 'lottie-react-native';
import noFoodOffersFound from '@/assets/animations/noFoodOffersFound.json';
import { replaceLottieColors } from '@/helper/animationHelper';
import { useFocusEffect } from 'expo-router';
import BottomSheet from '@gorhom/bottom-sheet';

// --- Types ---
export interface DayItem {
    foodoffer: DatabaseTypes.Foodoffers | null;
    foodofferInfoItem: DatabaseTypes.FoodoffersInfoItems | null;
}

export const useLayoutConfig = (amountColumnsForcard?: number) => {
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [listWidth, setListWidth] = useState<number | null>(null);

    useEffect(() => {
        const handleResize = () => setScreenWidth(Dimensions.get('window').width);
        const subscription = Dimensions.addEventListener('change', handleResize);
        return () => subscription?.remove();
    }, []);

    const MIN_CARD_WIDTH = 280;
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

    const itemGap = useMemo(() => {
        if (screenWidth >= 1600) return 28;
        if (screenWidth >= 1300) return 24;
        if (screenWidth >= 1000) return 20;
        if (screenWidth >= 700) return 16;
        if (screenWidth >= 500) return 12;
        if (screenWidth >= 300) return 10;
        return 8;
    }, [screenWidth]);

    return { screenWidth, listWidth, setListWidth, numColumns, cardWidth, itemGap };
};

export const useFoodOffersData = (
    selectedCanteen: DatabaseTypes.Canteens | null,
    selectedDate: string,
    sortBy: string | undefined,
    languageCode: string,
    ownFoodFeedbacks: any,
    profile: any,
    foodCategories: any,
    foodOfferCategories: any
) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [prefetchedFoodOffers, setPrefetchedFoodOffers] = useState<Record<string, DatabaseTypes.Foodoffers[]>>({});
    const [feedbackLabelsLoading, setFeedbackLabelsLoading] = useState(true);
    const canteenFeedbackLabelHelper = useMemo(() => new CanteenFeedbackLabelHelper(), []);

    const getCacheKey = (canteenId: string, date: string) => {
        return `${canteenId}_${format(new Date(date), 'dd.MM.yyyy')}`;
    };

    const getCachedOffers = useCallback((canteenId: string, date: string) => {
        return prefetchedFoodOffers[getCacheKey(canteenId, date)];
    }, [prefetchedFoodOffers]);

    const updateSort = useCallback((id: FoodSortOption, foodOffers: DatabaseTypes.Foodoffers[]) => {
        const sortedOffers = sortFoodOffers(id, foodOffers, {
            languageCode,
            ownFoodFeedbacks,
            profile: profile || { markings: [] },
            foodCategories,
            foodOfferCategories,
        });
        dispatch({ type: SET_SELECTED_CANTEEN_FOOD_OFFERS, payload: sortedOffers });
    }, [languageCode, ownFoodFeedbacks, profile, foodCategories, foodOfferCategories, dispatch]);

    const fetchFoods = useCallback(async (forceFetch = false) => {
        try {
            setLoading(true);
            const canteenId = selectedCanteen?.id as string;
            if (!canteenId || !selectedDate) {
                setLoading(false);
                return;
            }

            let foodOffers = getCachedOffers(canteenId, selectedDate);
            if (!foodOffers || forceFetch) {
                const foodData = await fetchFoodOffersByCanteen(canteenId, selectedDate);
                foodOffers = foodData?.data || [];
            }

            setPrefetchedFoodOffers(prev => ({ ...prev, [getCacheKey(canteenId, selectedDate)]: foodOffers }));

            // Prefetch next 2 days
            for (let i = 1; i <= 2; i++) {
                const date = addDays(new Date(selectedDate), i).toISOString().split('T')[0];
                const cacheKey = getCacheKey(canteenId, date);
                if (!prefetchedFoodOffers[cacheKey]) {
                    fetchFoodOffersByCanteen(canteenId, date)
                        .then(res => {
                            const offers = res?.data || [];
                            setPrefetchedFoodOffers(p => ({ ...p, [cacheKey]: offers }));
                            try {
                                offers.slice(0, 6).forEach((o: any) => {
                                    const img = o?.food?.image_remote_url || o?.food?.image;
                                    if (img) Image.prefetch(img).catch(() => { });
                                });
                            } catch (e) { }
                        })
                        .catch(e => console.error('Error prefetching Food Offers:', e));
                }
            }

            updateSort(sortBy as FoodSortOption, foodOffers);
            dispatch({ type: SET_SELECTED_CANTEEN_FOOD_OFFERS_LOCAL, payload: foodOffers });
            setLoading(false);
        } catch (error) {
            setLoading(false);
            console.error('Error fetching Food Offers:', error);
        }
    }, [selectedCanteen, selectedDate, getCachedOffers, prefetchedFoodOffers, updateSort, sortBy, dispatch]);

    const fetchCanteenLabels = useCallback(async () => {
        try {
            setFeedbackLabelsLoading(true);
            const labels = (await canteenFeedbackLabelHelper.fetchCanteenFeedbackLabels()) as DatabaseTypes.CanteensFeedbacksLabels[];
            dispatch({ type: SET_CANTEEN_FEEDBACK_LABELS, payload: labels });
        } catch (error) {
            console.error('Error fetching Canteen Feedback Labels:', error);
        } finally {
            setFeedbackLabelsLoading(false);
        }
    }, [canteenFeedbackLabelHelper, dispatch]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        Promise.all([fetchFoods(true), fetchCanteenLabels()]).finally(() => setRefreshing(false));
    }, [fetchFoods, fetchCanteenLabels]);

    useEffect(() => {
        fetchFoods();
    }, [selectedCanteen, selectedDate]); // Removed updateSort and others to prevent loops, relying on fetchFoods dependencies

    useEffect(() => {
        fetchCanteenLabels();
    }, [fetchCanteenLabels]);

    const cachedFoodOfferDates = useMemo(() => {
        const canteenId = selectedCanteen?.id;
        if (!canteenId) return [];

        return Object.keys(prefetchedFoodOffers)
            .filter(key => key.startsWith(`${canteenId}_`))
            .map(key => key.replace(`${canteenId}_`, ''))
            .map(date => parse(date, 'dd.MM.yyyy', new Date()))
            .filter(date => !Number.isNaN(date.getTime()))
            .sort((a, b) => a.getTime() - b.getTime())
            .map(date => format(date, 'yyyy-MM-dd'));
    }, [prefetchedFoodOffers, selectedCanteen]);

    const nextAvailableDate = useMemo(() => {
        const canteenId = selectedCanteen?.id as string;
        for (let i = 1; i <= 2; i++) {
            const date = addDays(new Date(selectedDate), i).toISOString().split('T')[0];
            const offers = getCachedOffers(canteenId, date);
            if (offers && offers.length > 0) return date;
        }
        return null;
    }, [prefetchedFoodOffers, selectedCanteen, selectedDate, getCachedOffers]);

    return {
        loading,
        refreshing,
        onRefresh,
        fetchFoods,
        feedbackLabelsLoading,
        cachedFoodOfferDates,
        nextAvailableDate
    };
};

export const useSheetHandling = (
    openFoodofferSortingModal: () => void
) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [selectedSheet, setSelectedSheet] = useState<string | null>(null);
    const [sheetProps, setSheetProps] = useState<Record<string, any>>({});
    const [isActive, setIsActive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            return () => setIsActive(false);
        }, [])
    );

    const openSheet = useCallback((sheet: 'menu' | 'sort' | string, props = {}) => {
        if (sheet === 'sort') {
            openFoodofferSortingModal();
            return;
        }
        setSelectedSheet(sheet);
        setSheetProps(props);
    }, [openFoodofferSortingModal]);

    const closeSheet = useCallback(() => {
        bottomSheetRef.current?.snapToIndex(-1);
        bottomSheetRef.current?.close();
        setTimeout(() => {
            setSelectedSheet(null);
            setSheetProps({});
        }, 150);
    }, []);

    useEffect(() => {
        if (isActive && selectedSheet) {
            setTimeout(() => bottomSheetRef.current?.expand(), 150);
        }
    }, [selectedSheet, isActive]);

    return {
        bottomSheetRef,
        selectedSheet,
        sheetProps,
        openSheet,
        closeSheet,
        isActive
    };
};

export const useNotifications = () => {
    const requestPermissions = async () => {
        const { status } = await Notifications.getPermissionsAsync();
        if (status !== 'granted') {
            await Notifications.requestPermissionsAsync();
        }
    };
    useEffect(() => {
        if (Platform.OS !== 'web') requestPermissions();
    }, []);
};

export const useAnimationLogic = (
    appSettings: any,
    foods_area_color: string
) => {
    const [autoPlay, setAutoPlay] = useState(appSettings?.animations_auto_start);
    const [animationJson, setAmimationJson] = useState<any>(null);
    const animationRef = useRef<LottieView>(null);

    useFocusEffect(
        useCallback(() => {
            setAmimationJson(replaceLottieColors(noFoodOffersFound, foods_area_color));
            return () => setAmimationJson(null);
        }, [foods_area_color])
    );

    useFocusEffect(
        useCallback(() => {
            setAutoPlay(appSettings?.animations_auto_start);
            return () => {
                setAutoPlay(false);
                setAmimationJson(null);
            };
        }, [appSettings?.animations_auto_start])
    );

    useEffect(() => {
        if (animationJson && autoPlay && animationRef.current) {
            animationRef.current.play();
        }
    }, [animationJson, autoPlay]);

    return { animationRef, animationJson, autoPlay };
};

export const useDateNavigation = (selectedDate: string) => {
    const dispatch = useDispatch();
    const handleDateChange = useCallback((direction: 'prev' | 'next') => {
        const currentDate = new Date(selectedDate);
        if (direction === 'prev') currentDate.setDate(currentDate.getDate() - 1);
        else currentDate.setDate(currentDate.getDate() + 1);
        dispatch({ type: SET_SELECTED_DATE, payload: currentDate.toISOString().split('T')[0] });
    }, [selectedDate, dispatch]);

    const getDayLabel = useCallback((date: string) => {
        const currentDate = new Date();
        const day = new Date(date);
        currentDate.setHours(0, 0, 0, 0);
        day.setHours(0, 0, 0, 0);
        if (currentDate.toDateString() === day.toDateString()) return 'today';
        currentDate.setDate(currentDate.getDate() - 1);
        if (currentDate.toDateString() === day.toDateString()) return 'yesterday';
        currentDate.setDate(currentDate.getDate() + 2);
        if (currentDate.toDateString() === day.toDateString()) return 'tomorrow';
        return format(day, 'dd.MM.yyyy');
    }, []);

    const getWeekdayKey = useCallback((date: string) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[new Date(date).getDay()];
    }, []);

    return { handleDateChange, getDayLabel, getWeekdayKey };
};
