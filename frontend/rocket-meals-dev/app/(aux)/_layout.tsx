import React from 'react';
import {isUserLoggedIn} from '@/states/User';
import {MyDrawer, useRenderMyDrawerScreen} from '@/components/drawer/MyDrawer';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyDrawerCustomItemProps} from '@/components/drawer/MyDrawerCustomItemCenter';
import {getMyScreenHeaderWikisByCustomId, useMyDrawerWikiItems} from "@/components/drawer/useMyDrawerWikiItems";
import {IconNames} from "@/constants/IconNames";
import {getMyScreenHeaderFoodOffers} from "@/compositions/foodoffers/MyScreenHeaderFoodOffers";
import {Custom_Wiki_Ids} from "@/states/SynchedWikis";

export const unstable_settings = {
	// Ensure that reloading on `/modal` keeps a back button present.
	initialRouteName: 'about-us',
};

export default function AppLayout() {
	// This layout can be deferred because it's not the root layout.
	const loggedIn = isUserLoggedIn();

	const translation_home = useTranslation(TranslationKeys.home);
	const translation_sign_in = useTranslation(TranslationKeys.sign_in);

	const customDrawerWikiItems = useMyDrawerWikiItems()

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

	if (!loggedIn) {
		customDrawerItems.push(
			{
				label: translation_sign_in,
				onPress: undefined,
				onPressInternalRouteTo: '(auth)/login',
				visibleInDrawer: true,
				onPressExternalRouteTo: undefined,
				icon: 'chevron-left',
				position: 0
			}
		)
	}
	if (loggedIn) {
		customDrawerItems.push(
			{
				label: translation_home,
				onPress: undefined,
				onPressInternalRouteTo: '/(app)/home',
				visibleInDrawer: true,
				onPressExternalRouteTo: undefined,
				icon: 'chevron-left',
				position: 0
			}
		)
	}

	return (
		<MyDrawer
			customDrawerItems={customDrawerItems}
		>
		</MyDrawer>
	)
}
