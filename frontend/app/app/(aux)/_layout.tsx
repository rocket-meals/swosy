import React from 'react';
import {isUserLoggedIn} from '@/states/User';
import {MyDrawer} from '@/components/drawer/MyDrawer';
import {TranslationKeys, useTranslation} from '@/helper/translations/Translation';
import {MyDrawerCustomItemProps} from '@/components/drawer/MyDrawerCustomItemCenter';
import {DEFAULT_AUTHENTICATED_ROUTE} from "@/app/(app)/home";
import {useMyDrawerAuxItems, useRenderedMyDrawerAuxScreens} from "@/components/drawer/useMyDrawerAuxItems";

//export const unstable_settings = {
//	// Ensure that reloading on `/modal` keeps a back button present.
//	initialRouteName: 'open-or-download-app/index',
//};

export default function AppLayout() {
	// This layout can be deferred because it's not the root layout.
	const loggedIn = isUserLoggedIn();

	const translation_home = useTranslation(TranslationKeys.home);
	const translation_sign_in = useTranslation(TranslationKeys.sign_in);

	const customDrawerAuxItems = useMyDrawerAuxItems()
	const renderedMyDrawerAuxItems = useRenderedMyDrawerAuxScreens()

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
				onPressInternalRouteTo: '/(app)'+DEFAULT_AUTHENTICATED_ROUTE,
				visibleInDrawer: true,
				onPressExternalRouteTo: undefined,
				icon: 'chevron-left',
				position: 0
			}
		)
	}

	if (customDrawerAuxItems) {
		customDrawerItems.push(...customDrawerAuxItems)
	}

	return (
		<MyDrawer
			customDrawerItems={customDrawerItems}
		>
			{renderedMyDrawerAuxItems}
		</MyDrawer>
	)
}
