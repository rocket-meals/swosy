import {Navigator} from 'expo-router';
import React, {useState} from "react";
import {Text} from "@/components/Themed"
import {DrawerContent} from "@react-navigation/drawer";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";
import {MyDrawer, MyDrawerCustomItem, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "about-us",
};

export default function AppLayout() {
    // This layout can be deferred because it's not the root layout.
    const loggedIn = isUserLoggedIn();

    const translation_home = useTranslation(TranslationKeys.home);
    const translation_sign_in = useTranslation(TranslationKeys.sign_in);

    const customDrawerItems: MyDrawerCustomItem[] = [
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

    if(!loggedIn){
        customDrawerItems.push(
            {
                label: translation_sign_in,
                onPress: undefined,
                onPressInternalRouteTo: "(auth)/login",
                onPressExternalRouteTo: undefined,
                icon: "chevron-left",
                position: 0
            }
        )
    }
    if(loggedIn){
        customDrawerItems.push(
            {
                label: translation_home,
                onPress: undefined,
                onPressInternalRouteTo: "/(app)/home",
                onPressExternalRouteTo: undefined,
                icon: "chevron-left",
                position: 0
            }
        )
    }

    return <MyDrawer
        customDrawerItems={customDrawerItems}
    >
        {renderMyDrawerScreen("home/index", "Home", "Home", "home")}
        {renderMyDrawerScreen("settings/index", "Settings", "Settings", "cog")}
    </MyDrawer>
}
