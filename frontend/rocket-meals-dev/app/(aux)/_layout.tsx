import {Navigator} from 'expo-router';
import React, {useState} from "react";
import {Text} from "@/components/Themed"
import {DrawerContent} from "@react-navigation/drawer";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "about-us",
};


function DrawerContentWrapper(props: any) {
    let registeredRoutes = props?.state?.routeNames;

    /**
     * TODO: Find a nice way to show only routes for users role
     * TODO: Render routes with expandable subroutes like in: https://stackoverflow.com/questions/47766564/need-to-show-expandable-list-view-inside-navigation-drawer
     * registeredRoutes = [ "home/index", "playground/index", "settings/index", "index", "playground/syncStates/index" ]
     */

    /**
     * FOR REFERENCE:
     export { default as DrawerContent } from './views/DrawerContent';
     export { default as DrawerContentScrollView } from './views/DrawerContentScrollView';
     export { default as DrawerItem } from './views/DrawerItem';
     export { default as DrawerItemList } from './views/DrawerItemList';
     export { default as DrawerToggleButton } from './views/DrawerToggleButton';
     export { default as DrawerView } from './views/DrawerView';
     */

    return (
        <DrawerContent {...props} />
    );
}

function DrawerWrapper(props: any) {

    const isLargeDevice = useIsLargeDevice();
    return (
        <Drawer
            drawerContent={DrawerContentWrapper}
            screenOptions={{
                drawerType: isLargeDevice ? 'permanent' : 'front',
            }}
            {...props}
        />
    );
}

function AppLayoutDrawer() {


    return (
        <DrawerWrapper
        >
            <Drawer.Screen
                name="about-us" // This is the name of the page and must match the url from root
                options={{
                    drawerLabel: 'About us',
                    title: 'About us',
                    headerShown: false,
                }}
            />
        </DrawerWrapper>
    );
}


export default function AppLayout() {
    // This layout can be deferred because it's not the root layout.
    return <AppLayoutDrawer />
}
