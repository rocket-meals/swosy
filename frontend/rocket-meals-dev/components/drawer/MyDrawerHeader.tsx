import React from "react";
import {Heading, Icon} from "@/components/Themed"
import {DrawerNavigationOptions, DrawerNavigationProp} from "@react-navigation/drawer";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {getHeaderTitle, Header, HeaderTitleProps} from "@react-navigation/elements";
import {ParamListBase, RouteProp} from "@react-navigation/native";
import {useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {DrawerConfigPosition, useDrawerPosition} from "@/helper/sync_state_helper/custom_sync_states/DrawerSyncConfig";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";

/**
 * Defines the properties for the custom drawer header.
 *
 * @prop {DrawerNavigationProp<ParamListBase, string, undefined>} navigation - Navigation prop provided by React Navigation.
 * @prop {RouteProp<ParamListBase>} route - Route prop for the current screen.
 * @prop {DrawerNavigationOptions} options - Drawer navigation options.
 */
export type MyDrawerHeaderProps = {
    navigation: DrawerNavigationProp<ParamListBase, string, undefined>
    route: RouteProp<ParamListBase>,
    options: DrawerNavigationOptions
}

/**
 * Factory function to generate a custom drawer header component.
 *
 * @returns A React component function taking `MyDrawerHeaderProps` as props.
 */
export const getMyDrawerHeader = () => {
    return (props: MyDrawerHeaderProps) => (
        <MyDrawerHeader {...props} />
    );
}

/**
 * Type definition for a function that renders a header component.
 * This can be used for headerLeft, headerRight, or potentially other header components.
 */
export type renderHeader = ((props: {
    tintColor?: string | undefined,
    pressColor?: string | undefined,
    pressOpacity?: number | undefined,
    labelVisible?: boolean | undefined
}) => React.ReactNode) | undefined

/**
 * The main component for rendering a custom drawer header.
 * This component configures the header title and optional left or right icons for toggling the drawer.
 *
 * @param {MyDrawerHeaderProps} props - The properties for configuring the drawer header.
 * @returns A React element representing the custom drawer header.
 */
export const MyDrawerHeader = ({ navigation, route, options }: MyDrawerHeaderProps) => {
    const isLargeDevice = useIsLargeDevice(); // Determines if the device is considered large.
    let [drawerPosition, setDrawerPosition] = useDrawerPosition(); // Gets and sets the current drawer position (left/right).

    const translation_open_drawer = useTranslation(TranslationKeys.open_drawer);

    const title = getHeaderTitle(options, route.name); // Retrieves the title for the header based on navigation options.

    /**
     * Renders the header title element.
     * Applies header style from navigation options to the title.
     *
     * @param {HeaderTitleProps} props - Properties for the header title component.
     * @returns A React element representing the header title.
     */
    const renderHeaderTitle = (props: HeaderTitleProps) => {
        const readOnlyStyle: any = options.headerStyle;
        return <Heading style={readOnlyStyle}>{title}</Heading>;
    }

    /**
     * Optionally renders a drawer toggle icon.
     * This function returns null on large devices where a drawer toggle might not be necessary.
     * Adjusts padding based on the drawer position.
     *
     * @param {Object} props - Properties including tint color, press color, press opacity, and label visibility.
     * @returns A React element for the drawer toggle button, or null.
     */
    function renderDrawerIcon(props: {
        tintColor?: string;
        pressColor?: string;
        pressOpacity?: number;
        labelVisible?: boolean;
    }) {
        if(isLargeDevice) return null; // Do not render icon on large devices.

        // Adjust padding based on the drawer's position to align the icon appropriately.
        let paddingLeft: any = 10;
        let paddingRight = undefined;
        if(drawerPosition === DrawerConfigPosition.Right){
            paddingRight = paddingLeft;
            paddingLeft = undefined;
        }

        // Returns a touchable component with an icon for toggling the drawer.
        return <MyTouchableOpacity style={{paddingLeft: paddingLeft, paddingRight: paddingRight}} accessibilityLabel={translation_open_drawer} onPress={() => navigation.openDrawer()}>
            <Icon name={"menu"} />
        </MyTouchableOpacity>;
    }

    let headerLeft: renderHeader = renderDrawerIcon; // Assign drawer toggle icon to the left or right header based on position.
    let headerRight: renderHeader = undefined; // Initialize headerRight as undefined.

    // Swap header icons if the drawer is positioned on the right.
    if(drawerPosition === DrawerConfigPosition.Right){
        let swap = headerLeft;
        headerLeft = headerRight;
        headerRight = swap;
    }

    // TODO: Refactor Header Title to also support align "right" instead of currently only "left" and "center"
    // Consideration for future improvement to allow more flexible title positioning.

    return <Header
        headerLeft={headerLeft}
        headerTitle={(props: HeaderTitleProps) => renderHeaderTitle(props)}
        headerRight={headerRight}
        title={title}/>;
}
