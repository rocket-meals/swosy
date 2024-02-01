import React from "react";
import {Heading, Icon, Text, View} from "@/components/Themed"
import {DrawerItem} from "@react-navigation/drawer";
import {useInsets, useIsLargeDevice} from "@/helper/device/DeviceHelper";
import {Drawer} from "expo-router/drawer";
import {ScrollViewWithGradient} from "@/components/scrollview/ScrollViewWithGradient";
import {LegalRequiredLinks} from "@/components/legal/LegalRequiredLinks";
import {ProjectBanner} from "@/components/project/ProjectBanner";
import {MyTouchableOpacity} from "@/components/buttons/MyTouchableOpacity";
import {useProjectColor} from "@/helper/sync_state_helper/custom_sync_states/ProjectInfo";
import {useMyContrastColor} from "@/helper/color/MyContrastColor";
import {SafeAreaView} from "react-native";
import {getHeaderTitle, Header, HeaderTitleProps} from "@react-navigation/elements";
import {useThemeDetermined} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {useIsDebug} from "@/helper/sync_state_helper/custom_sync_states/Debug";
import {DrawerConfigPosition, useDrawerPosition} from "@/helper/sync_state_helper/custom_sync_states/DrawerSyncConfig";

export function renderMyDrawerScreen(routeName: string, label: string, title: string, icon: string) {
    let projectColor = useProjectColor()
    let contrastColor = useMyContrastColor(projectColor)

    return(
        <Drawer.Screen
            name={routeName} // This is the name of the page and must match the url from root
            options={{
                // @ts-ignore
                visible: true, // [hide-drawer-item] since expo-router would render all registered screens, we need to hide some of them
                drawerLabel: ({ focused, color }) => (
                    <Text style={{ color: focused ? contrastColor : color }}>{label}</Text>
                ),
                title: title,
                drawerIcon: (props) => {return renderCustomDrawerIcon(icon, props)},
                drawerActiveBackgroundColor: projectColor,
            }}
        />
    )
}

function useDrawerWidth() {
    const insets = useInsets()
    let baseDrawerWidth = 320
    let drawerWidth = baseDrawerWidth
    let [drawerPosition, setDrawerPosition] = useDrawerPosition()
    if(drawerPosition === DrawerConfigPosition.Left) {
        drawerWidth = insets.left + baseDrawerWidth
    }
    if(drawerPosition === DrawerConfigPosition.Right) {
        drawerWidth = insets.right + baseDrawerWidth
    }
    return drawerWidth
}

export const MyDrawer = (props: any) => {
    const isLargeDevice = useIsLargeDevice();

    const drawerWidth = useDrawerWidth()
    let [drawerPosition, setDrawerPosition] = useDrawerPosition()

    return (
        <Drawer
            drawerContent={DrawerContentWrapper}
            screenOptions={{
                drawerPosition: drawerPosition,
                drawerType: isLargeDevice ? 'permanent' : 'front',
                drawerStyle: {
                    width: drawerWidth,
                },
                // The drawerIcon is used but IDEA does not recognize it
                drawerIcon: (props) => {return renderCustomDrawerIcon("chevron-right", props)},
                header: ({ navigation, route, options }) => {
                    const title = getHeaderTitle(options, route.name);

                    const renderHeaderTitle = (props: HeaderTitleProps) => {
                        const readOnlyStyle: any = options.headerStyle
                        return <Heading style={readOnlyStyle} >{title}</Heading>
                    }


                    function renderHeaderLeft(props: {
                        tintColor?: string;
                        pressColor?: string;
                        pressOpacity?: number;
                        labelVisible?: boolean;
                    }) {
                        if(isLargeDevice) return null;

                        return <MyTouchableOpacity style={{paddingLeft: 10}} accessibilityLabel={"Open Drawer"} onPress={() => navigation.openDrawer()}>
                            <Icon name={"menu"} />
                        </MyTouchableOpacity>
                    }

                    return <Header
                        headerLeft={renderHeaderLeft}
                        headerTitleAlign={"left"} // let the header be rendered left / flex-start
                        headerTitle={(props: HeaderTitleProps) => {return renderHeaderTitle(props)}}
                        title={title}/>;
                }
            }}
            {...props}
        />
    );
}

function DrawerContentWrapper(props: any) {
    const isDebug = useIsDebug();

    const theme = useThemeDetermined()
    let gradientBackgroundColor = theme?.colors?.card

    const translation_navigate_to = useTranslation(TranslationKeys.navigate_to)
    const translation_home = useTranslation(TranslationKeys.home)
    const accessibilityLabel_home = translation_navigate_to + " " + translation_home

    let renderedDrawerItems = props.state.routes.map((route: any, index: number) => {
        const { options } = props.descriptors[route.key];

        // [hide-drawer-item] Our custom option variable to hide the drawer item
        const visible = options.visible

        let hide_all_not_especially_defined_drawer_items = true
        if(isDebug) {
            hide_all_not_especially_defined_drawer_items = false
        }

        const label =
            options.drawerLabel !== undefined
                ? options.drawerLabel
                : options.title !== undefined
                ? options.title
                : route.name;

        const isFocused = props.state.index === index;
        const drawer_item_accessibility_label = translation_navigate_to + " " + label

        const onPress = () => {
            props.navigation.navigate(route.name);
        };

        let icon = options.drawerIcon
        let backgroundColor = isFocused ? options.drawerActiveBackgroundColor : undefined

        if(!visible && hide_all_not_especially_defined_drawer_items) {
            return null
        }
        return (
            <DrawerItem accessibilityLabel={drawer_item_accessibility_label} label={label} key={index} focused={isFocused} onPress={onPress} style={{backgroundColor: backgroundColor}} icon={icon}/>
        );
    })

    let renderedDrawerItemsWithSeparator = renderedDrawerItems.map((item: any, index: number) => {
        return(
            <View key={index}>
                {item}
                <View style={{width: "100%", height: 1, backgroundColor: undefined}}/>
            </View>
        )
    }   )

    return(
        <View style={{width: "100%", height: "100%", overflow: "hidden"}}>
            <SafeAreaView style={{width: "100%", height: "100%"}}>
                <MyTouchableOpacity
                    accessibilityLabel={accessibilityLabel_home}
                    onPress={() => {
                        props.navigation.navigate("index");
                    }}
                    style={{
                        width: "100%",
                        padding: 10,
                    }}>
                    <ProjectBanner/>
                </MyTouchableOpacity>
                <ScrollViewWithGradient gradientBackgroundColor={gradientBackgroundColor} gradientHeight={24}>
                    <View style={{width: "100%", height: "100%"}}>
                        {renderedDrawerItemsWithSeparator}
                    </View>
                </ScrollViewWithGradient>
                <View style={{width: "100%"}}>
                    <LegalRequiredLinks/>
                </View>
            </SafeAreaView>
    </View>
    );
}

export type MyCustomDrawerIconProps = {
    color: string, size: number, focused: boolean
}
function renderCustomDrawerIcon (iconName: string, { focused, color, size }: MyCustomDrawerIconProps){
    let projectColor = useProjectColor()
    let contrastColor = useMyContrastColor(projectColor)

    return ( // Dirty trick to move the text closer: https://stackoverflow.com/questions/73102614/react-native-remove-space-between-drawericon-and-item-text-on-drawer-screen
        <View style={{marginRight: -20}}>
            <Icon name={iconName} size={size} color={focused ? contrastColor : undefined} />
        </View>
    )
}
