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
	useIsBuildingsEnabled, useIsCourseTimetableEnabled,
	useIsFoodsEnabled,
	useIsHousingEnabled,
	useIsNewsEnabled
} from '@/states/SynchedAppSettings';

export const MyDrawerAuthenticated = (props: any) => {
	const [isDevelopMode, setIsDevelopMode] = useSyncState<boolean>(PersistentStore.develop);

	const isFoodsEnabled = useIsFoodsEnabled();
	const isHousingEnabled = useIsHousingEnabled();
	const isBuildingsEnabled = useIsBuildingsEnabled();
	const isNewsEnabled = useIsNewsEnabled();
	const isCourseTimetableEnabled = useIsCourseTimetableEnabled();

	const translation_home = useTranslation(TranslationKeys.home);
	const translation_settings = useTranslation(TranslationKeys.settings);
	const translation_canteens = useTranslation(TranslationKeys.canteens);
	const translation_buildings = useTranslation(TranslationKeys.buildings);
	const translation_housing = useTranslation(TranslationKeys.housing);
	const translation_news = useTranslation(TranslationKeys.news);
	const translation_course_timetable = useTranslation(TranslationKeys.course_timetable);
	const translation_food_details = useTranslation(TranslationKeys.food_details);

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
				routeName: 'buildings/index',
				label: translation_buildings,
				title: translation_buildings,
				icon: IconNames.building_icon,
				//header: getMyScreenHeaderFoodOffers()
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
				visibleInDrawer: isHousingEnabled
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
				visibleInDrawer: isDevelopMode
			})}
			{useRenderMyDrawerScreen({
				routeName: 'foods/[food]/index',
				title: translation_food_details,
				label: translation_food_details,
				showBackButton: true,
				icon: null,
				visibleInDrawer: false
			})}
			{renderedMyDrawerWikiItems}
		</MyDrawer>
	)
}