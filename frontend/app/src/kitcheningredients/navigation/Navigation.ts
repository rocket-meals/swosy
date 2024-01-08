import {RequiredSynchedStates} from "../synchedstate/RequiredSynchedStates";
import {useSynchedJSONState} from "../synchedstate/SynchedState";
import {NavigatorHelper} from "./NavigatorHelper";
import {FunctionComponent} from "react";
import {Home} from "../screens/home/Home";
import {Login} from "../auth/Login";
import {CommonActions, DrawerActions, DrawerActionHelpers} from "@react-navigation/native";

import {RouteHelper} from "./RouteHelper";
import {MenuItem} from "./MenuItem";
import {AboutUs} from "../screens/legalRequirements/AboutUs";
import {PrivacyPolicy} from "../screens/legalRequirements/PrivacyPolicy";
import {License} from "../screens/legalRequirements/License";
import {Settings} from "../screens/settings/Settings";
import {CookiePolicy} from "../screens/legalRequirements/CookiePolicy";
import {Accessibility} from "../screens/legalRequirements/Accessibility";

// todo Update to newest ReactNavigation
// https://reactnavigation.org/docs/navigating-without-navigation-prop/

export interface RouteProps {
  path?: string;
  title?: string;
  // params are a dictionary of key: string /value: any pairs that will be sent to the screen
  params?: {[key: string]: any};
  component: FunctionComponent;
  template?: FunctionComponent;
}

export class Navigation {

    static DEFAULT_ROUTE_HOME = RouteHelper.getNameOfComponent(Home);
    static DEFAULT_ROUTE_LOGIN = RouteHelper.getNameOfComponent(Login);

    static DEFAULT_MENU_KEY_ABOUT_US = RouteHelper.getNameOfComponent(AboutUs);
    static DEFAULT_MENU_KEY_PRIVACY_POLICY = RouteHelper.getNameOfComponent(PrivacyPolicy);
    static DEFAULT_MENU_KEY_LICENSE = RouteHelper.getNameOfComponent(License);
    static DEFAULT_MENU_KEY_ACCESSIBILITY = RouteHelper.getNameOfComponent(Accessibility);
    static DEFAULT_MENU_KEY_SETTINGS = RouteHelper.getNameOfComponent(Settings);

    static ROUTE_PATH_PREFIX = "/";
    static ROUTE_HASH_PREFIX = "#";

    // a dict with string to Route
    private static registeredComponents : {[key: string]: RouteProps} = {};

    private static registeredMenuItems : {[key: string]: MenuItem} = {};
    public static requiredMenuItems : {[key: string]: MenuItem} = {};

    static useNavigationHistory(){
      return useSynchedJSONState(RequiredSynchedStates.navigationHistory)
    }

    static drawerToggle(){
        console.log("drawerToggle");
        console.log("NavigatorHelper.getCurrentNavigation(): "+NavigatorHelper.getCurrentNavigation());
        console.log(NavigatorHelper.getCurrentNavigation());
        console.log(Object.keys(NavigatorHelper.getCurrentNavigation()))
      NavigatorHelper.getCurrentNavigation()?.dispatch(DrawerActions.toggleDrawer());
    }
    static drawerOpen(){
        console.log("drawerOpen");
      NavigatorHelper.getCurrentNavigation()?.dispatch(DrawerActions.openDrawer());
    }
    static drawerClose(){
        console.log("drawerClose");
      NavigatorHelper.getCurrentNavigation()?.dispatch(DrawerActions.closeDrawer());
    }

    static routesResetRegistered(){
      Navigation.registeredComponents = {};
    }

    static routeGetRegistered(){
      return Navigation.registeredComponents;
    }

    static routesRegisterMultipleFromComponents(funComponents: FunctionComponent[], template?): RouteProps[]{
      let routes: RouteProps[] = [];
      for(let i=0; i<funComponents.length; i++){
        let funComponent = funComponents[i];
        let route = Navigation.routeRegister({
          component: funComponent,
          template: template
        });
        routes.push(route);
      }
      return routes;
    }

    static routeRegister(route: RouteProps): RouteProps{
      let path = route.path;
      if(!path){
        path = RouteHelper.getNameOfComponent(route.component);
      }
      let componentName = RouteHelper.getNameOfComponent(route.component);
      let newRoute = {
        path: path,
        title: route?.title || componentName,
        component: route?.component,
        template: route?.template
      };
      Navigation.registeredComponents[componentName] = newRoute
      return newRoute;
    }

//    static routeUnregister(){} // also unregisteres menu?

    static menuRegister(menuItem: MenuItem){
      Navigation.registeredMenuItems[menuItem?.key] = menuItem;
    }

    static menusResetRegistered(){
      Navigation.registeredMenuItems = {};
      Navigation.requiredMenuItems = {};
    }

    static menuGetRegisteredDict(){
      return Navigation.registeredMenuItems;
    }

    static menuGetRequiredMenuDict(){
      return Navigation.requiredMenuItems;
    }

  static menuGetRegisteredList(){
      let menuDict = Navigation.menuGetRegisteredDict();
      let menuList = Object.values(menuDict);
      return menuList;
  }

    //static navigateBack(){}

    static navigateHome(){
      Navigation.navigateTo(Navigation.DEFAULT_ROUTE_HOME);
    }

    static navigateBack(){
      let history = NavigatorHelper.getHistory();

      if(history===null){
        Navigation.navigateHome()
      } if(history.length===1){ // well then we can't go back, since we are on our current page
        Navigation.navigateHome()
      } else {
        NavigatorHelper.getCurrentNavigation()?.dispatch(CommonActions.goBack());
      }
    }

    static getCurrentRouteName(){
      let history = NavigatorHelper.getHistory();
      if(history && history.length>0){
        return history[history.length-1].name;
      }
      return null;
    }

    static paramsToURLSearch(params?){
      let navigateSearch = "";
      if(params){
        let keys = Object.keys(params);
        for(let i=0; i<keys.length; i++){
          let key = keys[i];
          let value = params[key];
          if(value!==undefined && value!==null){
            if(i>0){
              navigateSearch += "&";
            }
            navigateSearch += key+"="+value;
          }
        }
      }
      return navigateSearch;
    }

    static navigateTo(routePathOrComponent, params?, hashChanged?){
      let routeName = "Home";
      if(typeof routePathOrComponent === "string"){
        routeName = routePathOrComponent;
      } else if(typeof routePathOrComponent === "function"){
        routeName = RouteHelper.getNameOfComponent(routePathOrComponent);
      }

      /**
      if(PlatformHelper.isWeb() && !hashChanged){
          //console.log("-- isWeb but the hash is not changed, so we do it now");
          let navigateSearch = Navigation.paramsToURLSearch(params);
          if(navigateSearch){
            navigateSearch = "?"+navigateSearch;
          }
          //console.log("After changing the hash, the hook will be called again, so we do not need to call navigateTo again");
          //@ts-ignore
          window.location.hash = Navigation.ROUTE_PATH_PREFIX+routeName+navigateSearch;
          return; // we do not need to call navigateTo again, because the hash change will trigger the hook
      } else {
        NavigatorHelper.navigateToRouteName(routeName, params)
      }
      */

      NavigatorHelper.navigateToRouteName(routeName, params)
    }

}
