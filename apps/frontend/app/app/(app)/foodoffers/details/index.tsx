import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, View, useWindowDimensions } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import Feedbacks from '@/components/Feedbacks';
import Details from '@/components/Details';
import Labels from '@/components/Labels';
import { getImageUrl, getpreviousFeedback } from '@/constants/HelperFunctions';
import { CollectibleAt, DatabaseTypes } from 'repo-depkit-common';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import { useDispatch } from 'react-redux';
import { useAppSelector } from '@/redux/hooks';
import useSelectedCanteen from '@/hooks/useSelectedCanteen';
import { DELETE_FOOD_FEEDBACK_LOCAL, UPDATE_FOOD_FEEDBACK_LOCAL, UPDATE_PROFILE } from '@/redux/Types/types';
import MarkingBottomSheet from '@/components/MarkingBottomSheet';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import NotificationSheet from '@/components/NotificationSheet/NotificationSheet';
import usePlatformHelper from '@/helper/platformHelper';
import { NotificationHelper } from '@/helper/NotificationHelper';
import { getCurrentDevice, getDeviceIdentifier, getDeviceInformationWithoutPushToken } from '@/helper/DeviceHelper';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { createSelector } from 'reselect';
import { useLanguage } from '@/hooks/useLanguage';
import { myContrastColor } from '@/helper/ColorHelper';
import { TranslationKeys } from '@/locales/keys';
import useSetPageTitle from '@/hooks/useSetPageTitle';
import { handleFoodRating } from '@/helper/feedback';
import { RootState } from '@/redux/reducer';
import CollectibleSpot from '@/components/CollectibleItem/CollectibleSpot';
import useRatingPermissionModal from '@/hooks/useRatingPermissionModal';
import FoodHeader from './components/FoodHeader';
import NotificationSection from './components/NotificationSection';
import TabController from './components/TabController';
import { useFoodDetails } from './hooks/useFoodDetails';
import { useFoodAttributes } from './hooks/useFoodAttributes';

const selectFoodState = (state: RootState) => state.food;

const selectPreviousFeedback = createSelector(
    [selectFoodState, (_: RootState, foodId?: string | null) => foodId],
    (foodState, foodId) => (foodId ? getpreviousFeedback(foodState.ownFoodFeedbacks, foodId.toString()) : undefined)
);

export default function FoodDetailsScreen() {
    useSetPageTitle(TranslationKeys.food_details);

    const { id, foodId } = useLocalSearchParams();
    const offerId = Array.isArray(id) ? id[0] : id;
    const initialFoodId = Array.isArray(foodId) ? foodId[0] : foodId;

    const { theme } = useTheme();
    const { translate } = useLanguage();
    const dispatch = useDispatch();
    const { width: screenWidth } = useWindowDimensions();
    
    const menuSheetRef = useRef<BottomSheet>(null);
    const notificationSheetRef = useRef<BottomSheet>(null);
    
    const { isSmartPhone, isAndroid, isIOS } = usePlatformHelper();
    const { user, profile } = useAppSelector((state) => state.authReducer);
    const { primaryColor, appSettings, serverInfo, selectedTheme: mode } = useAppSelector((state) => state.settings);
    
    const previousFeedback = useAppSelector((state) => selectPreviousFeedback(state, initialFoodId));
    
    // Hooks
    const profileHelper = useMemo(() => new ProfileHelper(), []);
    const foodfeedbackHelper = useMemo(() => new FoodFeedbackHelper(), []);
    const [notificationGranted, pushTokenObj, _, requestDeviceNotificationPermission] = NotificationHelper.useNotificationPermission(profile);
    
    const { foodDetails, foodAttributes, loading: foodAttributesLoading } = useFoodDetails({ offerId, initialFoodId });
    const { groupedAttributes } = useFoodAttributes({ foodAttributes, foodDetails });

    const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
    const contrastColor = myContrastColor(foods_area_color, theme, mode === 'dark');
    const defaultImage = getImageUrl(String(appSettings.foods_placeholder_image)) || appSettings.foods_placeholder_image_remote_url || getImageUrl(serverInfo?.info?.project?.project_logo);

    const selectedCanteen = useSelectedCanteen();
    const foodOfferCanteenId = selectedCanteen?.id as string | undefined;
    const { openRatingPermissionModal } = useRatingPermissionModal();

    const [activeTab, setActiveTab] = useState('feedbacks');
    const [isActive, setIsActive] = useState(false);

    const openNotificationSheet = useCallback(() => {
        notificationSheetRef?.current?.expand();
    }, []);

    const closeNotificationSheet = useCallback(() => {
        notificationSheetRef?.current?.close();
    }, []);

    const openMenuSheet = useCallback(() => {
        menuSheetRef?.current?.expand();
    }, []);

    const closeMenuSheet = useCallback(() => {
        menuSheetRef?.current?.close();
    }, []);

    const openFullScreenImage = useCallback(() => {
        if (foodDetails?.image_remote_url) {
            router.push({
                pathname: '/(app)/image-full-screen',
                params: { uri: foodDetails.image_remote_url },
            });
        } else if (foodDetails?.image) {
            router.push({
                pathname: '/(app)/image-full-screen',
                params: { assetId: String(foodDetails.image) },
            });
        } else {
            router.push({
                pathname: '/(app)/image-full-screen',
                params: { uri: defaultImage },
            });
        }
    }, [foodDetails, defaultImage]);

    const renderContent = useCallback(
        (foodDetails: DatabaseTypes.Foods) => {
            switch (activeTab) {
                case 'feedbacks':
                    return (
                        <Feedbacks
                            foodDetails={foodDetails}
                            offerId={offerId ? offerId.toString() : undefined}
                            canteenId={foodOfferCanteenId}
                        />
                    );
                case 'details':
                    return <Details groupedAttributes={groupedAttributes} loading={foodAttributesLoading} />;
                case 'labels':
                    return (
                        <Labels
                            foodDetails={foodDetails}
                            offerId={offerId ? offerId.toString() : undefined}
                            handleMenuSheet={openMenuSheet}
                            color={foods_area_color}
                        />
                    );
                default:
                    return null;
            }
        },
        [activeTab, offerId, foodOfferCanteenId, groupedAttributes, foodAttributesLoading, openMenuSheet, foods_area_color]
    );

    const rateFood = useCallback((rating: number) => {
        if (!user?.id) {
            openRatingPermissionModal();
            return;
        }
        const newRating = previousFeedback?.rating === rating ? null : rating;

        handleFoodRating({
            foodId: foodDetails?.id,
            profileId: profile?.id,
            userId: user?.id || '',
            rating: newRating,
            canteenId: foodOfferCanteenId,
            previousFeedback,
            dispatch,
        });
    }, [user, previousFeedback, foodDetails, profile, foodOfferCanteenId, dispatch, openRatingPermissionModal]);

    const updateFoodFeedbackNotification = useCallback(async () => {
        try {
            const payload = {
                ...previousFeedback,
                canteen: foodOfferCanteenId,
                notify: !previousFeedback?.notify,
            };
            const updateFeedbackResult = (await foodfeedbackHelper.updateFoodFeedback(foodDetails?.id, profile?.id, payload)) as DatabaseTypes.FoodsFeedbacks;
            if (updateFeedbackResult?.id) {
                dispatch({
                    type: UPDATE_FOOD_FEEDBACK_LOCAL,
                    payload: updateFeedbackResult,
                });
            } else {
                dispatch({
                    type: DELETE_FOOD_FEEDBACK_LOCAL,
                    payload: previousFeedback?.id,
                });
            }
        } catch (e) {
            console.error('Error creating feedback:', e);
        }
    }, [previousFeedback, foodOfferCanteenId, foodDetails, profile, dispatch, foodfeedbackHelper]);

    const getContainerWidth = useMemo(() => {
        let containerWidth = '100%';

        if (isWeb) {
            if (screenWidth < 600) {
                containerWidth = '95%';
            } else {
                containerWidth = '80%';
            }
        } else {
            containerWidth = '100%';
        }

        return containerWidth;
    }, [screenWidth]);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            return () => {
                setIsActive(false);
            };
        }, [])
    );

    const updateDeviceInfo = useCallback(async () => {
        try {
            const deviceInformationsWithoutPushToken = getDeviceInformationWithoutPushToken();
            const deviceInformationsId = getDeviceIdentifier(deviceInformationsWithoutPushToken);
            const pushTokenObj = await NotificationHelper.loadDeviceNotificationPermission();
            let deviceInformationsWithPushToken = {
                ...deviceInformationsWithoutPushToken,
                pushTokenObj: pushTokenObj,
                display_group: '',
            };

            let newDevices = profile?.devices || [];
            let foundDevice = getCurrentDevice(deviceInformationsId, newDevices);
            if (!foundDevice) {
                newDevices.push(deviceInformationsWithPushToken as any);
            } else {
                const deviceInformationsForUpdate = {
                    ...foundDevice,
                    ...deviceInformationsWithPushToken,
                }; // we want to keep id or createdAt
                const index = newDevices.indexOf(foundDevice);
                newDevices = [...newDevices];
                newDevices[index] = deviceInformationsForUpdate;
            }
            const result = (await profileHelper.updateProfile({
                ...profile,
                devices: newDevices,
            })) as DatabaseTypes.Profiles;
            if (result) {
                dispatch({
                    type: UPDATE_PROFILE,
                    payload: result,
                });
            }
        } catch (e) {
            console.error('Error updating device information:', e);
        }
    }, [profile, dispatch, profileHelper]);

    useEffect(() => {
        if (profile?.id) {
            updateDeviceInfo();
        }
    }, [profile?.id]); // Added dependency to run only when profile.id changes/exists.

    const updateNotification = useCallback(async () => {
        if (!user?.id) {
            openRatingPermissionModal();
            return;
        }
        if (isSmartPhone()) {
            const result = await NotificationHelper.getDeviceNotificationPermission();
            if (isAndroid()) {
                console.log('Result.granted', result?.granted);
                if (result?.granted) {
                    updateFoodFeedbackNotification();
                } else {
                    if (NotificationHelper.isDeviceNotificationPermissionUndetermined(pushTokenObj)) {
                        requestDeviceNotificationPermission();
                    }
                }
            }
            if (isIOS()) {
                const result = await NotificationHelper.requestDeviceNotificationPermission();
                console.log('Result.grantedios', result);
                if (result?.granted) {
                    updateFoodFeedbackNotification();
                } else {
                    if (NotificationHelper.isDeviceNotificationPermissionUndetermined(pushTokenObj)) {
                        requestDeviceNotificationPermission();
                    }
                }
            }
        } else {
            openNotificationSheet();
        }
    }, [user, isSmartPhone, isAndroid, isIOS, pushTokenObj, requestDeviceNotificationPermission, updateFoodFeedbackNotification, openNotificationSheet, openRatingPermissionModal]);

    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: theme.screen.background,
            }}
        >
            <ScrollView
                style={{
                    backgroundColor: theme.screen.background,
                    padding: isWeb ? 20 : 10,
                }}
                contentContainerStyle={{
                    ...styles.contentContainer,
                    width: '100%',
                    backgroundColor: theme.screen.background,
                }}
            >
                <View
                    style={{
                        width: '100%',
                        height: '100%',
                        alignItems: 'center',
                    }}
                >
                    <FoodHeader
                        foodDetails={foodDetails}
                        screenWidth={screenWidth}
                        openFullScreenImage={openFullScreenImage}
                        rateFood={rateFood}
                        previousFeedback={previousFeedback}
                        appSettings={appSettings}
                        foodsAreaColor={foods_area_color}
                        theme={theme}
                        translate={translate}
                        defaultImage={defaultImage}
                    />
                    
                    <NotificationSection
                        theme={theme}
                        containerWidth={getContainerWidth}
                        translate={translate}
                        previousFeedback={previousFeedback}
                        updateNotification={updateNotification}
                        foodsAreaColor={foods_area_color}
                        foodDetails={foodDetails}
                    />

                    <TabController
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        theme={theme}
                        contrastColor={contrastColor}
                        translate={translate}
                        containerWidth={getContainerWidth}
                        foodsAreaColor={foods_area_color}
                    />

                    <View
                        style={{
                            ...styles.pagerView,
                            width: isWeb ? '95%' : '100%',
                            paddingHorizontal: isWeb ? (screenWidth > 1000 ? 20 : 0) : 10,
                        }}
                    >
                        {foodDetails?.id && renderContent(foodDetails)}
                    </View>
                </View>
                <CollectibleSpot collectibleKey={CollectibleAt.collectible_at_foodoffers_details} />
            </ScrollView>
            
            {isActive && (
                <BaseBottomSheet
                    ref={notificationSheetRef}
                    index={-1}
                    backgroundStyle={{
                        ...styles.sheetBackground,
                        backgroundColor: theme.sheet.sheetBg,
                    }}
                    enablePanDownToClose
                    handleComponent={null}
                    onClose={closeNotificationSheet}
                >
                    <NotificationSheet closeSheet={closeNotificationSheet} previousFeedback={previousFeedback} foodDetails={foodDetails} />
                </BaseBottomSheet>
            )}
            
            {isActive && <MarkingBottomSheet ref={menuSheetRef} onClose={closeMenuSheet} />}
        </SafeAreaView>
    );
}
