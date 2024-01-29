import {Navigator} from 'expo-router';
import React, {useState} from "react";
import {Text} from "@/components/Themed"
import {DrawerContent} from "@react-navigation/drawer";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";
import {MyDrawer, renderMyDrawerScreen} from "@/components/drawer/MyDrawer";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "about-us",
};

export default function AppLayout() {
    // This layout can be deferred because it's not the root layout.
    const loggedIn = isUserLoggedIn();

    if(!loggedIn){

    }

    return <MyDrawer
    >
        {renderMyDrawerScreen("home/index", "Home", "Home", "home")}
        {renderMyDrawerScreen("settings/index", "Settings", "Settings", "cog")}
    </MyDrawer>
}
