import {Redirect} from 'expo-router';
import React, {useState} from "react";
import {Heading, Icon, Text, View} from "@/components/Themed"
import {DrawerContent, DrawerItem} from "@react-navigation/drawer";
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
import {SafeAreaView} from "react-native";
import {getHeaderTitle, Header, HeaderTitleProps} from "@react-navigation/elements";
import {useThemeDetermined} from "@/helper/sync_state_helper/custom_sync_states/ColorScheme";

export const unstable_settings = {
    // Ensure that reloading on `/modal` keeps a back button present.
    initialRouteName: "index",
};


function DrawerContentWrapper(props: any) {
    const theme = useThemeDetermined()
    let gradientBackgroundColor = theme?.colors?.card

    let renderedDrawerItems = props.state.routes.map((route: any, index: number) => {
        const { options } = props.descriptors[route.key];
        const label =
            options.drawerLabel !== undefined
                ? options.drawerLabel
                : options.title !== undefined
                ? options.title
                : route.name;

        const isFocused = props.state.index === index;

        const onPress = () => {
            props.navigation.navigate(route.name);
        };

        let icon = options.drawerIcon
        let backgroundColor = isFocused ? options.drawerActiveBackgroundColor : undefined

        return (
            <DrawerItem label={label} key={index} focused={isFocused} onPress={onPress} style={{backgroundColor: backgroundColor}} icon={icon}/>
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

function renderCustomDrawerIcon (iconName: string, { focused, color, size }){
    let projectColor = useProjectColor()
    let contrastColor = useMyContrastColor(projectColor)

    return ( // Dirty trick to move the text closer: https://stackoverflow.com/questions/73102614/react-native-remove-space-between-drawericon-and-item-text-on-drawer-screen
        <View style={{marginRight: -20}}>
            <Icon name={iconName} size={size} color={focused ? contrastColor : undefined} />
        </View>
    )
}

function DrawerWrapper(props: any) {
    const isLargeDevice = useIsLargeDevice();

    return (
        <Drawer
            drawerContent={DrawerContentWrapper}
            screenOptions={{
                drawerType: isLargeDevice ? 'permanent' : 'front',
                // The drawerIcon is used but IDEA does not recognize it
                drawerIcon: (props) => {return renderCustomDrawerIcon("chevron-right", props)},
                header: ({ navigation, route, options }) => {
                const title = getHeaderTitle(options, route.name);

                const renderHeaderTitle = (props: HeaderTitleProps) => {
                    return <Heading style={options.headerStyle} >{title}</Heading>
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
                />;
                }
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
                    drawerIcon: (props) => {return renderCustomDrawerIcon(icon, props)},
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
