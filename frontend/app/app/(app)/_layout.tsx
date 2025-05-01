import React, { useEffect } from 'react';
import { Drawer } from 'expo-router/drawer';
import CustomDrawerContent from '@/components/Drawer/CustomDrawerContent';
import { useTheme } from '@/hooks/useTheme';
import { useDispatch, useSelector } from 'react-redux';
import { Redirect, useGlobalSearchParams } from 'expo-router';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import {
  Buildings,
  Canteens,
  Markings,
  MarkingsGroups,
  PopupEvents,
  Profiles,
  Wikis,
} from '@/constants/types';
import {
  SET_APP_ELEMENTS,
  SET_APP_SETTINGS,
  SET_BUILDINGS,
  SET_BUSINESS_HOURS,
  SET_BUSINESS_HOURS_GROUPS,
  SET_CANTEENS,
  SET_FOOD_ATTRIBUTE_GROUPS,
  SET_FOOD_ATTRIBUTES,
  SET_FOOD_CATEGORIES,
  SET_FOOD_COLLECTION,
  SET_FOOD_OFFERS_CATEGORIES,
  SET_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES,
  SET_POPUP_EVENTS,
  SET_WIKIS,
  UPDATE_FOOD_FEEDBACK_LABELS,
  UPDATE_MARKINGS,
  UPDATE_OWN_FOOD_FEEDBACK,
  UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES,
  UPDATE_PROFILE,
} from '@/redux/Types/types';
import { FoodFeedbackLabelHelper } from '@/redux/actions/FoodFeedbacksLabel/FoodFeedbacksLabel';
import { FoodFeedbackHelper } from '@/redux/actions/FoodFeedbacks/FoodFeedbacks';
import { FoodFeedbackLabelEntryHelper } from '@/redux/actions/FoodFeeedbackLabelEntries/FoodFeedbackLabelEntries';
import { MarkingHelper } from '@/redux/actions/Markings/Markings';
import CustomMenuHeader from '@/components/CustomMenuHeader/CustomMenuHeader';
import { CanteenFeedbackLabelEntryHelper } from '@/redux/actions/CanteenFeedbackLabelEntries/CanteenFeedbackLabelEntries';
import { FoodCategoriesHelper } from '@/redux/actions/FoodCategories/FoodCategories';
import { FoodOffersCategoriesHelper } from '@/redux/actions/FoodOffersCategories/FoodOffersCategories';
import { BusinessHoursHelper } from '@/redux/actions/BusinessHours/BusinessHours';
import CustomStackHeader from '@/components/CustomStackHeader/CustomStackHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { WikisHelper } from '@/redux/actions/Wikis/Wikis';
import { AppSettingsHelper } from '@/redux/actions/AppSettings/AppSettings';
import { CanteenHelper } from '@/redux/actions';
import { BuildingsHelper } from '@/redux/actions/Buildings/Buildings';
import { getImageUrl } from '@/constants/HelperFunctions';
import { MarkingGroupsHelper } from '@/redux/actions/MarkingGroups/MarkingGroups';
import { FoodAttributeGroupHelper } from '@/redux/actions/FoodAttributes/FoodAttributeGroup';
import { FoodAttributesHelper } from '@/redux/actions/FoodAttributes/FoodAttributes';
import DeviceMock from '@/components/DeviceMock/DeviceMock';
import { isWeb } from '@/constants/Constants';
import { fetchSpecificField } from '@/redux/actions/Fields/Fields';
import { BusinessHoursGroupsHelper } from '@/redux/actions/BusinessHours/BusinessHoursGroups';
import { PopupEventsHelper } from '@/redux/actions/PopupEvents/PopupEvents';
import { Platform } from 'react-native';
import { AppElementsHelper } from '@/redux/actions/AppElements/AppElements';

export default function Layout() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { deviceMock } = useGlobalSearchParams();
  const dispatch = useDispatch();
  const wikisHelper = new WikisHelper();
  const markingHelper = new MarkingHelper();
  const canteenHelper = new CanteenHelper();
  const profileHelper = new ProfileHelper();
  const buildingsHelper = new BuildingsHelper();
  const popupEventsHelper = new PopupEventsHelper();
  const appSettingsHelper = new AppSettingsHelper();
  const appElementsHelper = new AppElementsHelper();
  const foodFeedbackHelper = new FoodFeedbackHelper();
  const businessHoursHelper = new BusinessHoursHelper();
  const markingGroupsHelper = new MarkingGroupsHelper();
  const foodAttributesHelper = new FoodAttributesHelper();
  const foodCategoriesHelper = new FoodCategoriesHelper();
  const foodfeedbackLabelHelper = new FoodFeedbackLabelHelper();
  const foodAttributeGroupHelper = new FoodAttributeGroupHelper();
  const businessHoursGroupsHelper = new BusinessHoursGroupsHelper();
  const foodOffersCategoriesHelper = new FoodOffersCategoriesHelper();
  const foodFeedbackLabelEntryHelper = new FoodFeedbackLabelEntryHelper();
  const canteenFeedbackLabelEntryHelper = new CanteenFeedbackLabelEntryHelper();
  const { loggedIn, user, profile } = useSelector(
    (state: any) => state.authReducer
  );
  const { popupEvents } = useSelector((state: any) => state.food);
  const { drawerPosition } = useSelector((state: any) => state.settings);

  if (!loggedIn) {
    return <Redirect href='/(auth)/login' />;
  }

  const fetchFields = async () => {
    try {
      const fieldResponse: any = await fetchSpecificField('foods');
      if (fieldResponse) {
        const foodImageCollection = fieldResponse['image'];
        dispatch({ type: SET_FOOD_COLLECTION, payload: foodImageCollection });
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);
  // Fetch food feedback labels
  const getFoodFeedBackLabels = async () => {
    try {
      const foodFeedbackLabels =
        await foodfeedbackLabelHelper.fetchFoodFeedbackLabels({});
      if (foodFeedbackLabels) {
        dispatch({
          type: UPDATE_FOOD_FEEDBACK_LABELS,
          payload: foodFeedbackLabels,
        });
      } else {
        console.log('No food feedback labels found');
      }
    } catch (e) {
      console.error('Error fetching food feedback labels: ', e);
    }
  };

  // Fetch profile function
  const fetchProfile = async () => {
    try {
      const profile = (await profileHelper.fetchProfileById(
        user?.profile,
        {}
      )) as Profiles;
      if (profile?.id) {
        getOwnFeedback(profile?.id);
        getFeedbackEntries(profile?.id);
        getCanteenFeedbackEntries(profile?.id);
        dispatch({ type: UPDATE_PROFILE, payload: profile });
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const getOwnFeedback = async (id: string) => {
    try {
      // Fetch own feedback
      const result = await foodFeedbackHelper.fetchFoodFeedbackByProfileId(id);
      if (result) {
        dispatch({ type: UPDATE_OWN_FOOD_FEEDBACK, payload: result });
      }
    } catch (error) {
      console.error('Error fetching own feedback:', error);
    }
  };

  const getFeedbackEntries = async (id: string) => {
    try {
      const result =
        await foodFeedbackLabelEntryHelper.fetchFoodFeedbackLabelEntriesByProfile(
          id
        );
      if (result) {
        dispatch({
          type: UPDATE_OWN_FOOD_FEEDBACK_LABEL_ENTRIES,
          payload: result,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback entries:', error);
    }
  };

  const getCanteenFeedbackEntries = async (id: string) => {
    try {
      const result =
        await canteenFeedbackLabelEntryHelper.fetchCanteenFeedbackLabelEntriesByProfile(
          id
        );
      if (result) {
        dispatch({
          type: SET_OWN_CANTEEN_FEEDBACK_LABEL_ENTRIES,
          payload: result,
        });
      }
    } catch (error) {
      console.error('Error fetching feedback entries:', error);
    }
  };

  const getMarkings = async () => {
    try {
      const markingResult = (await markingHelper.fetchMarkings(
        {}
      )) as Markings[];
      const markingGroupResult = (await markingGroupsHelper.fetchMarkingGroups(
        {}
      )) as MarkingsGroups[];

      // Normalize sort values to ensure undefined, null, or empty values don't break sorting
      const normalizeSort = (value: any) =>
        value === undefined || value === null || value === ''
          ? Infinity
          : value;

      // Sort marking groups by their "sort" field
      const sortedGroups = [...markingGroupResult].sort(
        (a, b) => normalizeSort(a.sort) - normalizeSort(b.sort)
      );

      // Create a map for quick lookup of each marking's group
      const markingToGroupMap = new Map<string, MarkingsGroups>();
      sortedGroups.forEach((group) => {
        group.markings.forEach((markingId) => {
          markingToGroupMap.set(markingId, group);
        });
      });

      // Helper function to get group sort value
      const getGroupSort = (marking: Markings): number => {
        const group = markingToGroupMap.get(marking.id);
        return normalizeSort(group?.sort);
      };

      // Helper function to get marking's own sort value
      const getMarkingSort = (marking: Markings): number => {
        return normalizeSort(marking.sort);
      };

      // Sort markings based on the specified criteria
      const sortedMarkings = [...markingResult].sort((a, b) => {
        const groupSortA = getGroupSort(a);
        const groupSortB = getGroupSort(b);

        // First, compare group sorts
        if (groupSortA !== groupSortB) {
          return groupSortA - groupSortB;
        }

        // If both markings belong to the same group, sort by their "sort" value
        const markingSortA = getMarkingSort(a);
        const markingSortB = getMarkingSort(b);

        if (markingSortA !== markingSortB) {
          return markingSortA - markingSortB;
        }

        // If no sort values exist, sort alphabetically by alias
        return (a.alias || '').localeCompare(b.alias || '');
      });

      dispatch({ type: UPDATE_MARKINGS, payload: sortedMarkings });
    } catch (error) {
      console.error('Error fetching markings:', error);
    }
  };

  const getFoodCategories = async () => {
    try {
      const result = await foodCategoriesHelper.fetchFoodCategories({});
      if (result) {
        dispatch({ type: SET_FOOD_CATEGORIES, payload: result });
      }
    } catch (error) {
      console.error('Error fetching food categories:', error);
    }
  };

  const getFoodOffersCategories = async () => {
    try {
      const result = await foodOffersCategoriesHelper.fetchFoodOffersCategories(
        {}
      );
      if (result) {
        dispatch({ type: SET_FOOD_OFFERS_CATEGORIES, payload: result });
      }
    } catch (error) {
      console.error('Error fetching food offers categories:', error);
    }
  };

  const getAllFoodAttributes = async () => {
    try {
      const result = await foodAttributesHelper.fetchAllFoodAttributes();
      if (result) {
        dispatch({ type: SET_FOOD_ATTRIBUTES, payload: result });
      }
    } catch (error) {
      console.error('Error fetching Food attribute', error);
    }
  };

  const getAllFoodAttributesGroups = async () => {
    try {
      const result = await foodAttributeGroupHelper.fetchAllFoodAttributeGroups(
        {}
      );
      if (result) {
        dispatch({ type: SET_FOOD_ATTRIBUTE_GROUPS, payload: result });
      }
    } catch (error) {
      console.error('Error fetching Food attribute groups', error);
    }
  };
  const getAllBusinessHoursGroups = async () => {
    try {
      const result = await businessHoursGroupsHelper.fetchBusinessHoursGroups(
        {}
      );
      if (result) {
        dispatch({ type: SET_BUSINESS_HOURS_GROUPS, payload: result });
      }
    } catch (error) {
      console.error('Error fetching Food attribute groups', error);
    }
  };

  const getBusinessHours = async () => {
    try {
      const businessHours = await businessHoursHelper.fetchBusinessHours({});
      dispatch({ type: SET_BUSINESS_HOURS, payload: businessHours });
    } catch (error) {
      console.error('Error fetching business hours:', error);
    }
  };

  const getWikis = async () => {
    try {
      const response = (await wikisHelper.fetchWikis()) as Wikis[];
      if (response) {
        dispatch({ type: SET_WIKIS, payload: response });
      }
    } catch (error) {
      console.error('Error fetching wikis:', error);
    }
  };

  const getAppSettings = async () => {
    try {
      const result = await appSettingsHelper.fetchAppSettings({});
      if (result) {
        dispatch({ type: SET_APP_SETTINGS, payload: result });
      }
    } catch (error) {
      console.error('Error fetching app settings:', error);
    }
  };

  const getAllEvents = async () => {
    try {
      const response =
        (await popupEventsHelper.fetchAllPopupEvents()) as PopupEvents[];

      if (response) {
        const currentDate = new Date();

        const platformKey =
          Platform.OS === 'ios'
            ? 'show_on_ios'
            : Platform.OS === 'android'
            ? 'show_on_android'
            : 'show_on_web';

        const filteredEvents = response
          .filter((event: PopupEvents) => {
            const start = event.date_start ? new Date(event.date_start) : null;
            const end = event.date_end ? new Date(event.date_end) : null;

            const isDateValid =
              (!start && !end) ||
              (start && !end && currentDate >= start) ||
              (start && end && currentDate >= start && currentDate <= end);

            const isPlatformValid = event[platformKey];

            return isDateValid && isPlatformValid;
          })
          .map((event, index) => ({
            ...event,
            isOpen: false,
            isCurrent: index === 0,
          }));

        if (filteredEvents.length !== popupEvents.length) {
          dispatch({ type: SET_POPUP_EVENTS, payload: filteredEvents });
        }
      }
    } catch (error) {
      console.log('Error Fetching Popup Events', error);
    }
  };

  const getAllAppElements = async () => {
    try {
      const result = await appElementsHelper.fetchAllAppElements({});
      if (result) {
        dispatch({ type: SET_APP_ELEMENTS, payload: result });
      }
    } catch (error) {
      console.error('Error fetching app elements:', error);
    }
  };
  const fetchConfig: { key: string; action: () => Promise<void> }[] = [
    { key: CollectionKeys.POPUP_EVENTS, action: getAllEvents },
    { key: CollectionKeys.APP_ELEMENTS, action: getAllAppElements },
    { key: CollectionKeys.MARKINGS_GROUPS, action: getMarkings },
    { key: CollectionKeys.FOODS_CATEGORIES, action: getFoodCategories },
    {
      key: CollectionKeys.FOODOFFERS_CATEGORIES,
      action: getFoodOffersCategories,
    },
    {
      key: CollectionKeys.FOODS_FEEDBACKS_LABELS,
      action: getFoodFeedBackLabels,
    },
    { key: CollectionKeys.BUSINESSHOURS, action: getBusinessHours },
    {
      key: CollectionKeys.BUSINESSHOURS_GROUPS,
      action: getAllBusinessHoursGroups,
    },
    { key: CollectionKeys.WIKIS, action: getWikis },
    { key: CollectionKeys.APP_SETTINGS, action: getAppSettings },
    {
      key: CollectionKeys.FOODS_ATTRIBUTES_GROUPS,
      action: getAllFoodAttributesGroups,
    },
    { key: CollectionKeys.FOODS_ATTRIBUTES, action: getAllFoodAttributes },
  ];

  const getAllCollectionDatesLastUpdate = async () => {
    try {
      const result =
        (await collectionLastUpdateHelper.fetchCollectionDatesLastUpdate(
          {}
        )) as CollectionsDatesLastUpdate[];
      if (result) {
        const serverMap = transformUpdateDatesToMap(result);

        await Promise.all(
          fetchConfig.map(({ key, action }) => {
            if (shouldFetch(key, serverMap, lastUpdatedMap)) {
              return action();
            }
            return Promise.resolve();
          })
        );

        dispatch({
          type: SET_COLLECTION_DATES_LAST_UPDATED,
          payload: serverMap,
        });
      }
    } catch (error) {
      console.error('Error fetching app elements:', error);
    }
  };
  useEffect(() => {
    if (user?.id) {
      fetchProfile();
    }
    getAllAppElements();
    getAllEvents();
    getMarkings();
    getFoodCategories();
    getFoodOffersCategories();
    getFoodFeedBackLabels();
    getBusinessHours();
    getAllBusinessHoursGroups();
    getWikis();
    fetchAllCanteens();
    getAppSettings();
    getAllFoodAttributesGroups();
    getAllFoodAttributes();
  }, [user]);

  return (
    <>
      {deviceMock && deviceMock === 'iphone' && isWeb && <DeviceMock />}
      <Drawer
        screenOptions={{
          headerStyle: { backgroundColor: theme.header.background },
          headerTintColor: theme.header.text,
          drawerType: 'front',
          drawerPosition: drawerPosition === 'system' ? 'left' : drawerPosition,
        }}
        detachInactiveScreens={true}
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        backBehavior='history'
      >
        <Drawer.Screen
          name='index'
          options={{
            title: t('please_select_your_canteen'),
            headerLeft: () => null,
          }}
        />
        <Drawer.Screen
          name='foodoffers'
          options={{
            title: 'Canteens',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name='account-balance/index'
          options={{
            header: () => (
              <CustomMenuHeader
                label={t('accountbalance')}
                key={'Account-Balance'}
              />
            ),
            title: t('accountbalance'),
          }}
        />
        <Drawer.Screen
          name='campus'
          options={{
            title: 'Campus',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name='housing'
          options={{
            title: 'Housing',
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name='news/index'
          options={{
            title: 'News',
            header: () => <CustomMenuHeader label={t('news')} key={'News'} />,
          }}
        />
        <Drawer.Screen
          name='course-timetable/index'
          options={{
            header: () => (
              <CustomMenuHeader
                label={t('course_timetable')}
                key={'course_timetable'}
              />
            ),
            title: 'Course Timetable',
          }}
        />
        <Drawer.Screen
          name='settings/index'
          options={{
            title: 'Settings',
            header: () => (
              <CustomMenuHeader label={t('settings')} key={'settings'} />
            ),
          }}
        />
        <Drawer.Screen
          name='faq-food/index'
          options={{
            title: 'FAQ-Food',
          }}
        />
        <Drawer.Screen
          name='faq-living/index'
          options={{
            title: 'FAQ-Living',
          }}
        />

        <Drawer.Screen
          name='management/index'
          options={{
            header: () => (
              <CustomMenuHeader
                label={t('role_management')}
                key={'Management'}
              />
            ),
            title: 'Management',
          }}
        />

        <Drawer.Screen
          name='notification/index'
          options={{
            header: () => (
              <CustomStackHeader
                label={t('notification')}
                key={'notification'}
              />
            ),
            title: t('notification'),
          }}
        />
        <Drawer.Screen
          name='support-FAQ/index'
          options={{
            title: t('feedback_support_faq'),
            header: () => (
              <CustomStackHeader
                label={t('feedback_support_faq')}
                key={'Feedback Support Faq'}
              />
            ),
          }}
        />

        <Drawer.Screen
          name='feedback-support/index'
          options={{
            title: 'Feedback & Support',
            header: () => (
              <CustomStackHeader
                label={`${t('feedback')} & ${t('support')}`}
                key={'Feedback & Support'}
              />
            ),
          }}
        />

        <Drawer.Screen
          name='support-ticket'
          options={{
            title: 'Support Ticket',
            headerShown: false,
          }}
        />

        <Drawer.Screen
          name='licenseInformation/index'
          options={{
            header: () => (
              <CustomStackHeader
                label={t('license_information')}
                key={'license_information'}
              />
            ),
            title: 'License Information',
          }}
        />

        <Drawer.Screen
          name='data-access/index'
          options={{
            title: 'Data Access',
            header: () => (
              <CustomStackHeader label={t('dataAccess')} key={'Data Access'} />
            ),
          }}
        />

        <Drawer.Screen
          name='eating-habits/index'
          options={{
            title: 'Eating Habits',
            header: () => (
              <CustomStackHeader
                label={t('eating_habits')}
                key={'Eating Habits'}
              />
            ),
          }}
        />
        <Drawer.Screen
          name='price-group/index'
          options={{
            title: 'Price Group',
            header: () => (
              <CustomStackHeader label={t('price_group')} key={'Price Group'} />
            ),
          }}
        />

        <Drawer.Screen
          name='form-categories/index'
          options={{
            header: () => (
              <CustomStackHeader label={t('select_a_form_category')} />
            ),
          }}
        />
        <Drawer.Screen
          name='forms/index'
          options={{
            header: () => <CustomStackHeader label={t('select_a_form')} />,
          }}
        />
        <Drawer.Screen
          name='form-submissions/index'
          options={{
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name='form-submission/index'
          options={{
            headerShown: false,
          }}
        />
      </Drawer>
    </>
  );
}
