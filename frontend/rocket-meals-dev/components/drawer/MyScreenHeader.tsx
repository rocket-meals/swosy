import React from "react";
import {Heading, Icon, useViewBackgroundColor} from "@/components/Themed"
import {DrawerHeaderProps, DrawerNavigationOptions, DrawerNavigationProp} from "@react-navigation/drawer";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {getHeaderTitle, Header, HeaderTitleProps} from "@react-navigation/elements";
import {ParamListBase, RouteProp} from "@react-navigation/native";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {DrawerConfigPosition, useDrawerPosition, useIsDrawerPermanentVisible} from "@/states/DrawerSyncConfig";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {Divider} from "@gluestack-ui/themed";
import {IconNames} from "@/constants/IconNames";
import {MyAccessibilityRoles} from "@/helper/accessibility/MyAccessibilityRoles";
import {Platform, Text, View} from "react-native";
import {useSafeAreaFrame, useSafeAreaInsets} from "react-native-safe-area-context";
import HeaderShownContext from "@react-navigation/elements/src/Header/HeaderShownContext";
import {useFocusEffect} from "expo-router";
import {PlatformHelper} from "@/helper/PlatformHelper";

/**
 * Defines the properties for the custom drawer header.
 *
 * @prop {DrawerNavigationProp<ParamListBase, string, undefined>} navigation - Navigation prop provided by React Navigation.
 * @prop {RouteProp<ParamListBase>} route - Route prop for the current screen.
 * @prop {DrawerNavigationOptions} options - Drawer navigation options.
 */
export type MyScreenHeaderPropsRequired = {
    navigation: DrawerNavigationProp<ParamListBase, string, undefined>
    route: RouteProp<ParamListBase>
    options: DrawerNavigationOptions
}

export type MyScreenHeaderPropsOptional = {
    custom_title?: string
    custom_renderHeaderDrawerOpposite?: renderHeaderContentElement
    hideDivider?: boolean
}

export type MyScreenHeaderProps = MyScreenHeaderPropsRequired & MyScreenHeaderPropsOptional;

/**
 * Factory function to generate a custom drawer header component.
 *
 * @returns A React component function taking `MyDrawerHeaderProps` as props.
 */
export type getMyScreenHeaderFunction = () => (props: DrawerHeaderProps) => React.ReactNode

export const getMyScreenHeader: getMyScreenHeaderFunction = () => {
    return (props: MyScreenHeaderPropsRequired) => (
        <MyScreenHeader {...props} />
    );
}

/**
 * Type definition for a function that renders a header component.
 * This can be used for headerLeft, headerRight, or potentially other header components.
 */
export type renderHeaderContentElement = ((props?: {
    tintColor?: string | undefined,
    pressColor?: string | undefined,
    pressOpacity?: number | undefined,
    labelVisible?: boolean | undefined
}) => React.ReactNode) | undefined

/**
 * The main component for rendering a custom drawer header.
 * This component configures the header title and optional left or right icons for toggling the drawer.
 *
 * @param navigation
 * @param route
 * @param options
 * @param custom_title
 * @param custom_renderHeaderDrawerOpposite
 * @param hideDivider
 * @param {MyScreenHeaderPropsRequired} props - The properties for configuring the drawer header.
 * @returns A React element representing the custom drawer header.
 */
export const MyScreenHeader = ({ navigation, route, options, custom_title, custom_renderHeaderDrawerOpposite, hideDivider, ...props }: MyScreenHeaderProps) => {
    const isDrawerPermanentVisible = useIsDrawerPermanentVisible(); // Determine if the device is considered large.

    let [drawerPosition, setDrawerPosition] = useDrawerPosition(); // Gets and sets the current drawer position (left/right).

    const translation_open_drawer = useTranslation(TranslationKeys.open_drawer);

    const default_title = getHeaderTitle(options, route.name); // Retrieves the title for the header based on navigation options.
    const usedTitle = custom_title || default_title

    // Adjust padding based on the drawer's position to align the icon appropriately.
    let paddingLeft: any = 10;
    let paddingRight = 10;
    const paddingVertical = 10;

    /**
     * Renders the header title element.
     * Applies header style from navigation options to the title.
     *
     * @param {HeaderTitleProps} props - Properties for the header title component.
     * @returns A React element representing the header title.
     */
    const renderHeaderTitle = (props?: HeaderTitleProps) => {
        const readOnlyStyle: any = options.headerStyle;
        const headerPaddingLeft = isDrawerPermanentVisible ? paddingLeft : 0
        return <View style={{paddingVertical: paddingVertical, paddingLeft: headerPaddingLeft}}><Heading accessibilityRole={MyAccessibilityRoles.Header} style={readOnlyStyle}>{usedTitle}</Heading></View>
    }

    /**
     * Optionally renders a drawer toggle icon.
     * This function returns null on large devices where a drawer toggle might not be necessary.
     * Adjusts padding based on the drawer position.
     *
     * @param {Object} props - Properties including tint color, press color, press opacity, and label visibility.
     * @returns A React element for the drawer toggle button, or null.
     */
    function renderDrawerIcon(props?: {
        tintColor?: string;
        pressColor?: string;
        pressOpacity?: number;
        labelVisible?: boolean;
    }) {
        if(isDrawerPermanentVisible) {
            return null
        }




        // Returns a touchable component with an icon for toggling the drawer.
        return <MyTouchableOpacity style={{paddingLeft: paddingLeft, paddingRight: paddingRight, paddingVertical: paddingVertical}} accessibilityLabel={translation_open_drawer} onPress={() => navigation.openDrawer()}>
            <Icon name={IconNames.drawer_menu_icon} />
        </MyTouchableOpacity>
    }


    const isFlipped = drawerPosition === DrawerConfigPosition.Right;
    let primaryHeaderContent = <>
        {renderDrawerIcon()}
        {renderHeaderTitle()}
    </>
    if(isFlipped){
        primaryHeaderContent = <>
            {renderHeaderTitle()}
            {renderDrawerIcon()}
        </>
    }

    let secondaryHeaderContent: React.ReactNode = null; // Initialize headerRight as undefined.
    if(custom_renderHeaderDrawerOpposite){
        secondaryHeaderContent = custom_renderHeaderDrawerOpposite();
    }

    // Swap header icons if the drawer is positioned on the right.


    let headerLeft = isFlipped? secondaryHeaderContent : primaryHeaderContent;
    let headerRight = isFlipped? primaryHeaderContent : secondaryHeaderContent;

    // TODO: Refactor Header Title to also support align "right" instead of currently only "left" and "center"
    // Consideration for future improvement to allow more flexible title positioning.

    // make the header render order from left to right: headerLeft, headerTitle, headerRight

    const renderedDivider = hideDivider? null : <Divider />;

    const insets = useSafeAreaInsets();
    const frame = useSafeAreaFrame();

    const isParentHeaderShown = React.useContext(HeaderShownContext);

    // On models with Dynamic Island the status bar height is smaller than the safe area top inset.
    const hasDynamicIsland = Platform.OS === 'ios' && insets.top > 50;
    const statusBarHeight = hasDynamicIsland ? insets.top - 5 : insets.top;
    const headerStatusBarHeight = isParentHeaderShown ? 0 : statusBarHeight

    /**
     * Old Header had the problem that headerLeft and HeaderRight would not grow the header
     <Header
     // make the header grow if the headerLeft or headerRight is not null
     // header title align right
     headerStyle={{
     flexGrow: 1,
     backgroundColor: "green"
     }}
     headerBackgroundContainerStyle={{
     flexGrow: 1,
     backgroundColor: "blue"
     }}
     headerTransparent={true}
     headerLeft={headerLeft}
     headerRight={headerRight}
     title={usedTitle}
     />
     */

    // create a focusEffect to set the title of the window on web
    useFocusEffect(() => {
        if(PlatformHelper.isWeb()){
            document.title = usedTitle
        }
    })

    return <>
        <View style={{
            marginLeft: insets.left,
            marginRight: insets.right,
            marginTop: headerStatusBarHeight,
            flexDirection: "row",
        }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flex: 1 }}>
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                }}>
                    {headerLeft}
                </View>
                <View style={{
                    flexShrink: 1,
                    alignItems: "center",
                    flexDirection: "row",
                }}>
                    {headerRight}
                </View>
            </View>
        </View>
        {renderedDivider}
    </>
}
