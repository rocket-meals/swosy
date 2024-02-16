import React, {ReactNode} from "react";
import {View, Text} from "@/components/Themed";
import {useInsets, useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {LegalRequiredLinks} from "@/components/legal/LegalRequiredLinks";
import {ProjectBanner} from "@/components/project/ProjectBanner";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {useProjectColor} from "@/states/ProjectInfo";
import {DimensionValue, SafeAreaView} from "react-native";
import {useThemeDetermined} from "@/states/ColorScheme";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {DrawerConfigPosition, useDrawerPosition} from "@/states/DrawerSyncConfig";
import {DrawerContentComponentProps} from "@react-navigation/drawer/src/types";
import {getMyDrawerItemIcon} from "@/components/drawer/MyDrawerItemIcon";
import {MyDrawerCustomItemProps} from "@/components/drawer/MyDrawerCustomItem";
import {getMyScreenHeader, MyScreenHeaderProps} from "@/components/drawer/MyScreenHeader";
import {getMyDrawerItems} from "@/components/drawer/MyDrawerItems";
import {ViewStyle} from "react-native/Libraries/StyleSheet/StyleSheetTypes";
import {StyleProp} from "react-native/Libraries/StyleSheet/StyleSheet";
import {MySafeAreaView} from "@/components/MySafeAreaView";
import {MyDrawerSafeAreaView} from "@/components/drawer/MyDrawerSafeAreaView";
import {DrawerHeaderProps} from "@react-navigation/drawer";
import {IconNames} from "@/constants/IconNames";

export type MyDrawerItemProps = {
    routeName: string;
    label: string;
    title: string;
    icon: string | undefined | null;
    visibleInDrawer?: boolean | null | undefined;
    header?: ((props: DrawerHeaderProps) => ReactNode) | undefined
};

// Function to render individual screens within the Drawer navigation.
// It dynamically sets the drawer's appearance based on the current project color.
export function renderMyDrawerScreen({routeName, label, title, icon, visibleInDrawer, header}: MyDrawerItemProps) {
    let projectColor = useProjectColor(); // Fetch the current project color for use in styling.

    let usedVisible = true;
    if(visibleInDrawer!==undefined){
        usedVisible = !!visibleInDrawer;
    }

    return(
        <Drawer.Screen
            name={routeName} // The route name must match the URL from the root for navigation.
            options={{
                // @ts-ignore - Expo's TypeScript definitions might not recognize 'visible' as a valid option.
                visible: usedVisible, // This custom property is used to conditionally render drawer items.
                label: label,
                title: title,
                drawerIcon: getMyDrawerItemIcon(icon),
                drawerActiveBackgroundColor: projectColor, // Customize the background color of the active drawer item.
                header: header || getMyScreenHeader() // Render a custom header for the drawer.
            }}
        />
    );
}

/**
 * Custom hook to calculate and provide the appropriate width for the drawer.
 */
function useDrawerWidth(): number | DimensionValue {
    const insets = useInsets(); // Get safe area insets to adjust drawer width accordingly.
    let [drawerPosition, setDrawerPosition] = useDrawerPosition(); // Fetch and set the current drawer position (left/right).
    const isLargeDevice = useIsLargeDevice(); // Determine if the device has a large screen.

    if(!isLargeDevice) {
        return "80%"; // Use a fixed width for the drawer on small devices.
    } else {
        const baseDrawerWidth = 320; // Define a base width for the drawer.
        let drawerWidth = baseDrawerWidth;

        // Adjust drawer width based on its position and the safe area insets.
        if(drawerPosition === DrawerConfigPosition.Left) {
            drawerWidth += insets.left;
        }
        if(drawerPosition === DrawerConfigPosition.Right) {
            drawerWidth += insets.right;
        }
        return drawerWidth; // Return the calculated drawer width.
    }
}

// Component type definition for custom drawer items.
export type MyDrawerProps = {
    customDrawerItems?: MyDrawerCustomItemProps[];
    children?: React.ReactNode;
};

// Main drawer component that renders the navigation drawer along with custom items.
export const MyDrawer = (props: MyDrawerProps) => {
    const isLargeDevice = useIsLargeDevice(); // Determine if the device has a large screen.
    const customDrawerItems = props?.customDrawerItems; // Optional custom drawer items.

    const drawerWidth = useDrawerWidth(); // Calculate the dynamic width of the drawer.
    let [drawerPosition, setDrawerPosition] = useDrawerPosition(); // Get and set the current drawer position.

    return (
        <Drawer
            drawerContent={(props: DrawerContentComponentProps) => {
                // Render custom drawer content, passing through custom items and props.
                return <DrawerContentWrapper customDrawerItems={customDrawerItems} {...props} />;
            }}
            screenOptions={{
                drawerPosition: drawerPosition, // Set the drawer to appear on the left or right.
                drawerType: isLargeDevice ? 'permanent' : 'front', // Use a permanent drawer on large devices.
                drawerStyle: {
                    width: drawerWidth, // Apply the dynamically calculated width.
                },
                drawerIcon: getMyDrawerItemIcon(IconNames.chevron_right_icon), // Default icon for the drawer items.
                header: getMyScreenHeader() // Render a custom header for the drawer.
            }}
            {...props}
        />
    );
};

function renderDrawerContentTop(props: DrawerContentComponentProps){
    const translation_navigate_to = useTranslation(TranslationKeys.navigate_to);
    const translation_home = useTranslation(TranslationKeys.home);
    const accessibilityLabel_home = translation_navigate_to + " " + translation_home;

    return(
        <MyTouchableOpacity
            accessibilityLabel={accessibilityLabel_home}
            onPress={() => {
                props.navigation.navigate("index"); // Navigate to the home screen when the banner is pressed.
            }}
            style={{
                width: "100%",
                padding: 10,
            }}>
            <ProjectBanner/>
        </MyTouchableOpacity>
    )
}

function renderDrawerContentBottom(){
    return(
        <View style={{width: "100%"}}>
            <LegalRequiredLinks/>
        </View>
    )
}

// Wrapper component for the content inside the drawer.
// It manages the layout of custom drawer items, the project banner, and legal links.
type DrawerContentWrapperProps = {
    customDrawerItems?: MyDrawerCustomItemProps[];
} & DrawerContentComponentProps;

function DrawerContentWrapper(props: DrawerContentWrapperProps) {
    const theme = useThemeDetermined(); // Determine the current theme to apply appropriate styles.
    let gradientBackgroundColor = theme?.colors?.card; // Set a background color for the gradient effect.

    let renderedDrawerItemsWithSeparator = getMyDrawerItems(props); // Get the list of drawer items to render.

    return(
        <View style={{width: "100%", height: "100%", overflow: "hidden"}}>
            <MyDrawerSafeAreaView>
                {renderDrawerContentTop(props)}
                <View style={{
                    flex: 1,
                    width: "100%",
                    height: "100%",
                    overflow: "hidden",
                }}>
                    <ScrollViewWithGradient gradientBackgroundColor={gradientBackgroundColor} gradientHeight={24}>
                        <View style={{width: "100%", height: "100%"}}>
                            {renderedDrawerItemsWithSeparator}
                        </View>
                    </ScrollViewWithGradient>
                </View>
                {renderDrawerContentBottom()}
            </MyDrawerSafeAreaView>
        </View>
    );
}
