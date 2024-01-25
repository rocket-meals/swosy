import {Redirect} from 'expo-router';
import React, {useState} from "react";
import {Icon, Text, View} from "@/components/Themed"
import {DrawerContent} from "@react-navigation/drawer";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {isUserLoggedIn} from "@/helper/sync_state_helper/custom_sync_states/User";
import {MyCard} from "@/components/card/MyCard";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {LegalRequiredLinks} from "@/components/legal/LegalRequiredLinks";
import {BottomTabDescriptorMap} from "@react-navigation/bottom-tabs/src/types";
import {ProjectBanner} from "@/components/project/ProjectBanner";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "index",
};


function DrawerContentWrapper(props: any) {
    return(
        <View style={{width: "100%", height: "100%"}}>
            <MyTouchableOpacity
                onPress={() => {
                    props.navigation.navigate("index");
                }}
                style={{
                width: "100%",
                padding: 10,
            }}>
                <ProjectBanner/>
            </MyTouchableOpacity>
            <DrawerContent {...props}>

            </DrawerContent>
        <View style={{width: "100%"}}>
            <LegalRequiredLinks/>
        </View>
    </View>
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
    let projectColor = useProjectColor()
    let contrastColor = useMyContrastColor(projectColor)

    // TODO: Set the hamburger menu icon to custom icon

    function renderMyDrawerScreen(routeName: string, label: string, title: string, icon: string){
        return(
            <Drawer.Screen
                name={routeName} // This is the name of the page and must match the url from root
                options={{
                    drawerLabel: ({ focused, color }) => (
                        <Text style={{ color: focused ? contrastColor : color }}>{label}</Text>
                    ),
                    title: title,
                    drawerIcon: ({ focused, color, size }) => (
                        <Icon name={icon} size={size} color={focused ? contrastColor : undefined} />
                    ),
                    drawerActiveBackgroundColor: projectColor,
                }}
            />
        )
    }

    function hideMyDrawerScreen(routeName: string){
        return(
            <Drawer.Screen
                name={routeName} // This is the name of the page and must match the url from root
                options={{
                    drawerItemStyle: { display: 'none' }
                }}
            />
        )
    }

    // TODO: find a better solution to hide unwanted screens
    // TODO: find a way to show only screens for the role of the user

    return (
            <DrawerWrapper
            >
                {renderMyDrawerScreen("home/index", "Home", "Home", "home")}
                {renderMyDrawerScreen("settings/index", "Settings", "Settings", "cog")}
                {hideMyDrawerScreen("index")}
            </DrawerWrapper>
    );
}


export default function AppLayout() {
    const [ isLoading, setIsLoading ] = useState<boolean>(false);
    const loggedIn = isUserLoggedIn();

    // AUTHENTICATION: Followed this guide: https://docs.expo.dev/router/reference/authentication/

    // You can keep the splash screen open, or render a loading screen like we do here.
    if (isLoading) {
        return <Text>Loading...</Text>;
    }

    // Only require authentication within the (app) group's layout as users
    // need to be able to access the (auth) group and sign in again.
    if (!loggedIn) {
        // On web, static rendering will stop here as the user is not authenticated
        // in the headless Node process that the pages are rendered in.
        // @ts-ignore
        return <Redirect href="/(auth)/login" />;
    }

    // This layout can be deferred because it's not the root layout.
    return <AppLayoutDrawer />;
}
