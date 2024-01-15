import React from 'react';
import {Drawer} from 'expo-router/drawer';
import {StyleSheet} from 'react-native';
import {Text, View} from "@/components/Themed";
import {GestureHandlerRootView} from "react-native-gesture-handler";
import {useIsLargeDevice} from "@/components/DeviceHelper";
import {DrawerContent} from "@react-navigation/drawer";

// Import your screen components

export function BottomRow() {
    return (
        <View style={styles.container}>
            <Text>Bottom Row Content</Text>
            {/* Add other UI elements and functionality here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 50,
        backgroundColor: '#ddd',
        alignItems: 'center',
        justifyContent: 'center',
        // Add other styling as needed
    },
});

function DrawerContentWrapper(props: any) {
    console.log("DrawerContentWrapper");
    console.log(props);

    let registeredRoutes = props?.state?.routeNames;
    console.log("registeredRoutes");
    console.log(registeredRoutes);

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
        <DrawerContent {...props}>
            {props.children}
        </DrawerContent>
    );
}

function DrawerWrapper(props: any) {

    console.log("DrawerWrapper");
    console.log(props);

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

export default function AppLayout() {


    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <DrawerWrapper
            >
                <Drawer.Screen
                    name="home/index" // This is the name of the page and must match the url from root
                    options={{
                        drawerLabel: 'Home',
                        title: 'Home',
                    }}
                />
                <Drawer.Screen
                    name="playground/index" // This is the name of the page and must match the url from root
                    options={{
                        drawerLabel: 'Playground',
                        title: 'Playground',
                    }}
                />
                <Drawer.Screen
                    name="settings/index" // This is the name of the page and must match the url from root
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                    }}
                />
            </DrawerWrapper>
        </GestureHandlerRootView>
    );
}
