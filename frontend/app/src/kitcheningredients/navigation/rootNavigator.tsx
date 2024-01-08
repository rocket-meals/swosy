// @ts-nocheck
import React from 'react';
import {RouteRegisterer} from "./RouteRegisterer";
import {Navigation} from "./Navigation";
import {CustomDrawerContent} from "./CustomDrawerContent";
import {ConfigHolder} from "../ConfigHolder";
import {Layout} from "../templates/Layout";
import {DefaultNavigation} from "./DefaultNavigation";
import {RouteHelper} from "./RouteHelper";
import {NavigationHistorySetter} from "./NavigationHistorySetter";
import {useSynchedDrawerConfig} from "../synchedstate/SynchedState";

export const RootStack = (props) => {

  let isSmallDevice = Layout.usesSmallDevice();

  const startURL = props?.startURL || null;

  let initialRouteName = RouteHelper.getInitialRouteName(startURL);
  let search = RouteHelper.getSearchParam(startURL);

  const [initialSearch, setInitialSearch] = React.useState(search);
  const [drawerConfig, setDrawerConfig] = useSynchedDrawerConfig();

  let Drawer = RouteRegisterer.getDrawer();

  // TODO do we have this?
  // navigationOptions={{unmountInactiveRoutes: true}}

    /**
    React.useEffect(() => {
        // Listen for changes in drawerConfig.drawerPosition
        // When it changes, update the drawerKey to force a re-render of Drawer.Navigator
        setDrawerKey(prevKey => prevKey + 1);
    }, [drawerConfig?.drawerPosition]);
     */

  let largeScreenDrawerType = "front";

  const hideDrawer = ConfigHolder.instance.isDrawerHidden()
  if(!hideDrawer){
    largeScreenDrawerType = "permanent";
  }

  let drawerType = isSmallDevice ? 'front' : largeScreenDrawerType /** 'front' | 'back' | 'slide' | 'permanent' */

  let drawerBorderColor = RouteRegisterer.getDrawerBorderColor();
  let drawerStyle = !!drawerBorderColor ? {borderColor: drawerBorderColor} : undefined;


  const showOnlyScreensForAnonymUser = !ConfigHolder.instance.getUser();
  let screens = showOnlyScreensForAnonymUser ? DefaultNavigation.getAnonymUserScreens(initialSearch) : DefaultNavigation.getAllScreens(initialSearch);
  let unmountOnBlur = showOnlyScreensForAnonymUser ? true : false; // Otherwise logged out user can see the screens of the logged in user, since they are not unmounted

  let pluginRootComponent = null;
  if(!!ConfigHolder.plugin.getRootComponent){
    pluginRootComponent = ConfigHolder.plugin.getRootComponent(props);
  }

  if(!initialRouteName){
    initialRouteName = Navigation.DEFAULT_ROUTE_HOME;
  }

  console.log("Render RootStack")

  let drawerPosition = drawerConfig?.drawerPosition || 'left';

  return (
    <>
      <NavigationHistorySetter/>
      <Drawer.Navigator initialRouteName={initialRouteName}
                        key={ConfigHolder.instance.state.reloadNumber+JSON.stringify(drawerConfig)}
                        redirectToLogin={props.redirectToLogin+""}
                        reloadNumber={drawerType+ConfigHolder.instance.state.reloadNumber+drawerPosition}
                        drawerContent={(props) => <CustomDrawerContent drawerPosition={drawerPosition} {...props} />}
                        drawerType={drawerType}// for react navigation old
                        drawerStyle={drawerStyle}// for react navigation old
                        drawerPosition={drawerPosition} // for react navigation old
                        screenOptions={{
                            drawerType: drawerType,
                            drawerStyle: drawerStyle,
                            drawerPosition: drawerPosition,
                          headerShown: false,
                          animationEnabled: false,
                          unmountOnBlur: unmountOnBlur
                          // preload screens
                        }}
      >
        {screens}
      </Drawer.Navigator>
      {pluginRootComponent}
    </>
  );
}
