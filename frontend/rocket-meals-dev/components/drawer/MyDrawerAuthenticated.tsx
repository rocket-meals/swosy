import {MyDrawer, useRenderMyDrawerScreen} from '@/components/drawer/MyDrawer';
import React from 'react';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyDrawerCustomItemProps} from '@/components/drawer/MyDrawerCustomItemCenter';
import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {getMyScreenHeaderFoodOffers} from '@/compositions/foodoffers/MyScreenHeaderFoodOffers';
import {IconNames} from '@/constants/IconNames';
import {useMyDrawerWikiItems, useRenderedMyDrawerWikiScreens} from '@/components/drawer/useMyDrawerWikiItems';
import {
	useIsAccountBalanceEnabled,
	useIsBuildingsEnabled, useIsCourseTimetableEnabled,
	useIsFoodsEnabled,
	useIsHousingEnabled, useIsMapEnabled,
	useIsNewsEnabled
} from '@/states/SynchedAppSettings';
import {getMyScreenHeaderHousing} from "@/compositions/housing/MyScreenHeaderHousing";
import {getMyScreenHeaderBuildings} from "@/compositions/buildings/MyScreenHeaderBuildings";
import {useIsDeveloperModeActive} from "@/states/Develop";
import {useTranslationAccountDelete} from "@/compositions/settings/SettingsRowUserDelete";

export const MyDrawerAuthenticated = (props: any) => {
	const develop = useIsDeveloperModeActive();

	const isFoodsEnabled = useIsFoodsEnabled();
	const isHousingEnabled = useIsHousingEnabled();
	const isMapEnabled = useIsMapEnabled();
	const isBuildingsEnabled = useIsBuildingsEnabled();
	const isNewsEnabled = useIsNewsEnabled();
	const isCourseTimetableEnabled = useIsCourseTimetableEnabled();
	const isAccountBalanceEnabled = useIsAccountBalanceEnabled()

	const translation_accountbalance = useTranslation(TranslationKeys.accountbalance);
	const translation_home = useTranslation(TranslationKeys.home);
	const translation_settings = useTranslation(TranslationKeys.settings);
	const translation_canteens = useTranslation(TranslationKeys.canteens);
	const translation_buildings = useTranslation(TranslationKeys.buildings);
	const translation_housing = useTranslation(TranslationKeys.housing);
	const translation_news = useTranslation(TranslationKeys.news);
	const translation_map = useTranslation(TranslationKeys.map);
	const translation_course_timetable = useTranslation(TranslationKeys.course_timetable);
	const translation_food_details = useTranslation(TranslationKeys.food_details);
	const translation_data_access = useTranslation(TranslationKeys.dataAccess);
	const translation_price_group = useTranslation(TranslationKeys.price_group)
	const translation_eating_habits = useTranslation(TranslationKeys.eating_habits)
	const translation_notification = useTranslation(TranslationKeys.notification)
	const translation_delete_account = useTranslationAccountDelete();

	const customDrawerWikiItems = useMyDrawerWikiItems()
	const renderedMyDrawerWikiItems = useRenderedMyDrawerWikiScreens()

	const customDrawerItems: MyDrawerCustomItemProps[] = [
		/**
     {
     label: "Hallo",
     onPress: undefined,
     onPressInternalRouteTo: undefined,
     onPressExternalRouteTo: undefined,
     icon: "home",
     position: 0
     }
     */
	]

	if (customDrawerWikiItems) {
		customDrawerItems.push(...customDrawerWikiItems)
	}


	return (
		<MyDrawer
			customDrawerItems={customDrawerItems}
		>
			{useRenderMyDrawerScreen({
				routeName: 'home/index',
				label: translation_home,
				title: translation_home,
				icon: 'home',
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'foodoffers/index',
				label: translation_canteens,
				title: translation_canteens,
				icon: IconNames.foodoffers_icon,
				header: getMyScreenHeaderFoodOffers(),
				visibleInDrawer: isFoodsEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'map/index',
				label: translation_map,
				title: translation_map,
				icon: IconNames.map_icon,
				visibleInDrawer: isMapEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'accountbalance/index',
				label: translation_accountbalance,
				title: translation_accountbalance,
				icon: IconNames.account_balance_icon,
				visibleInDrawer: isAccountBalanceEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'buildings/index',
				label: translation_buildings,
				title: translation_buildings,
				icon: IconNames.building_icon,
				header: getMyScreenHeaderBuildings(),
				visibleInDrawer: isBuildingsEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'buildings/[building]/index',
				title: "Building Details",
				label: "Building Details",
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'housing/index',
				label: translation_housing,
				title: translation_housing,
				icon: IconNames.apartments_icon,
				header: getMyScreenHeaderHousing(),
				visibleInDrawer: isHousingEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'housing/[apartment]/index',
				title: "Apartment Details",
				label: "Apartment Details",
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'news/index',
				label: translation_news,
				title: translation_news,
				icon: IconNames.news_icon,
				visibleInDrawer: isNewsEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'course-timetable/index',
				label: translation_course_timetable,
				title: translation_course_timetable,
				icon: IconNames.course_timetable_icon,
				visibleInDrawer: isCourseTimetableEnabled
			})}
			{useRenderMyDrawerScreen({
				routeName: 'settings/index',
				label: translation_settings,
				title: translation_settings,
				icon: IconNames.settings_icon,
			})}
			{useRenderMyDrawerScreen({
				routeName: 'components/index',
				label: 'Components',
				title: 'Components',
				icon: 'drawing-box',
				visibleInDrawer: develop
			})}
			{useRenderMyDrawerScreen({
				routeName: 'foodoffers/[foodoffer]/index',
				title: translation_food_details,
				label: translation_food_details,
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'settings/price-group/index',
				label: translation_price_group,
				title: translation_price_group,
				icon: IconNames.price_group_icon,
				showBackButton: true,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'settings/delete-account/index',
				label: translation_delete_account,
				title: translation_delete_account,
				icon: IconNames.user_account_delete_icon,
				showBackButton: true,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'settings/eatinghabits/index',
				title: translation_eating_habits,
				label: translation_eating_habits,
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'settings/notifications/index',
				title: translation_notification,
				label: translation_notification,
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{useRenderMyDrawerScreen({
				routeName: 'data-access/index',
				label: translation_data_access,
				title: translation_data_access,
				icon: IconNames.data_access_icon,
				visibleInDrawer: false
			})}

			{renderedMyDrawerWikiItems}
		</MyDrawer>
	)
}