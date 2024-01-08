// @ts-nocheck
import {BaseTemplate} from "../templates/BaseTemplate";
import {ConfigHolder} from "../ConfigHolder";
import {MenuItem} from "./MenuItem";
import {Navigation} from "./Navigation";


import {Login} from "../auth/Login";
import {LoginTemplate} from "../templates/LoginTemplate";
import {Home} from "../screens/home/Home";
import {RouteProps} from "./Navigation";
import React from "react";
import {RouteRegisterer} from "./RouteRegisterer";
import {AboutUs} from "../screens/legalRequirements/AboutUs";
import {License} from "../screens/legalRequirements/License";
import {PrivacyPolicy} from "../screens/legalRequirements/PrivacyPolicy";
import {RouteHelper} from "./RouteHelper";
import {Settings} from "../screens/settings/Settings";
import {BaseNoPaddingTemplate} from "../templates/BaseNoPaddingTemplate";
import {CloneChildrenWithProps} from "../helper/CloneChildrenWithProps";
import {CookiePolicy} from "../screens/legalRequirements/CookiePolicy";
import {Accessibility} from "../screens/legalRequirements/Accessibility";

export class DefaultNavigation {

  static async registerRoutesAndMenus(user, role, permissions){
    Navigation.menusResetRegistered();
    Navigation.routesResetRegistered();

    DefaultNavigation.registerDefaultRoutes(user, role, permissions);
    DefaultNavigation.registerLegalRequirements();
    if(!!ConfigHolder.plugin){
      await ConfigHolder.plugin.registerRoutes(user, role, permissions);
    }
  }

  static registerDefaultRoutes(user, role, permissions){
    let loginRoute = Navigation.routeRegister({
      component: Login,
      template: LoginTemplate,
    })

    let homeRoute = Navigation.routeRegister({
      component: Home,
      template: BaseTemplate,
    })

    if(!user){
      let loginMenu = MenuItem.fromRoute(loginRoute)
      loginMenu.position = 1000;
      Navigation.menuRegister(MenuItem.fromRoute(loginRoute))
    } else {
      //Navigation.menuRegister(MenuItem.fromRoute(homeRoute))
    }
  }

  static registerLegalRequirements(){

    const BaseTemplateWithoutCookiesForce = (props) => {return <BaseTemplate autoOpenCookies={false}  {...props}/>};

    let about_us_menu_item = MenuItem.fromRoute(Navigation.routeRegister({
      title: "Impressum",
      component: AboutUs,
      template: BaseTemplateWithoutCookiesForce
    }))
    Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_ABOUT_US] = about_us_menu_item;

    let privacy_policy_menu_item = MenuItem.fromRoute(Navigation.routeRegister({
      title: "Datenschutz",
      component: PrivacyPolicy,
      template: BaseTemplateWithoutCookiesForce
    }))
    Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_PRIVACY_POLICY] = privacy_policy_menu_item;

    let license_menu_item = MenuItem.fromRoute(Navigation.routeRegister({
      title: "Lizenz",
      component: License,
      template: BaseTemplate
    }));
    Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_LICENSE] = license_menu_item;

    let settings_menu_item = MenuItem.fromRoute(Navigation.routeRegister({
      title: "Einstellungen",
      component: Settings,
      template: BaseNoPaddingTemplate
    }));
    Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_SETTINGS] = settings_menu_item;

    let accessibility_menu_item = MenuItem.fromRoute(Navigation.routeRegister({
      title: "Barrierefreiheitserklärung",
      component: Accessibility,
      template: BaseTemplate
    }))
    Navigation.requiredMenuItems[Navigation.DEFAULT_MENU_KEY_ACCESSIBILITY] = accessibility_menu_item;

  }



  static getAllScreens(initialSearch){
    let registeredRoutes = Navigation.routeGetRegistered();
    return DefaultNavigation.getScreensFor(registeredRoutes, initialSearch);
  }

  private static getRegisteredRouteForScreenByComponent(component){
    return(
      {
        [RouteHelper.getNameOfComponent(component)]: Navigation.routeGetRegistered()[RouteHelper.getNameOfComponent(component)]
      }
    )
  }

  private static getRegisteredRoutesForScreenByComonents(...components){
    let registeredRoutes = {};
    for(let i = 0; i < components.length; i++){
      registeredRoutes = {
        ...registeredRoutes,
        ...DefaultNavigation.getRegisteredRouteForScreenByComponent(components[i])
      }
    }
    return registeredRoutes;
  }

  static getAnonymUserScreens(initialSearch){
    let loginScreens = DefaultNavigation.getScreensFor(
      {
        [Navigation.DEFAULT_ROUTE_LOGIN]: Navigation.routeGetRegistered()[Navigation.DEFAULT_ROUTE_LOGIN],
        ...DefaultNavigation.getRegisteredRoutesForScreenByComonents(AboutUs, License, PrivacyPolicy, Settings, Accessibility)
      },
      initialSearch
    );
    return loginScreens;
  }

  static isAnonymUserRoute(routeName){
    let anonymScreens = DefaultNavigation.getAnonymUserScreens({});
    for(let i = 0; i < anonymScreens.length; i++){
      if(anonymScreens[i].routeName === routeName){
        return true;
      }
    }
    return false;
  }

  static getScreensFor(registeredRoutes, initialSearch){
    let Drawer = RouteRegisterer.getDrawer();
    let renderedScreens = [];
    for(let routeKey in registeredRoutes){
      let routeInfo: RouteProps = registeredRoutes[routeKey];
      let component = routeInfo?.component;
      if(component){
        let template = routeInfo?.template;
        let screenContent = (props) => {
          return React.createElement(component, {...props})
        };
        if(!!template){
          screenContent = (props) => {
            let customProps = {};
            let renderedComponent = React.createElement(component, {...props, ...customProps})
            return React.createElement(template, {...props, ...customProps, children: renderedComponent, title: routeInfo?.title})
          };
        }

        renderedScreens.push(
            <Drawer.Screen key={routeInfo?.path} name={routeInfo?.path} params={routeInfo?.params} initialParams={initialSearch}>
            {screenContent}
            </Drawer.Screen>
        );
      }}
    return renderedScreens;
  }

}
