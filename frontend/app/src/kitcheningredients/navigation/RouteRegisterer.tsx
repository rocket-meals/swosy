import {Home} from "../screens/home/Home";
import {Login} from "../auth/Login";
// @ts-nocheck
import React from "react";
import {createDrawerNavigator} from "@react-navigation/drawer";

const Drawer = createDrawerNavigator();

export class RouteRegisterer {

    static routeLogin = "login";

    static screens = null;
    static loginScreens = null;

    static HOME_AUTHENTICATED = Home;
    static HOME_UNAUTHENTICATED = Login;

    // this is here since we also get the drawer from here, if you have a better place for this feel free to move it
    private static drawerBorderColor: string | null = null;
    private static drawerBackgroundColor: string | null = null;

    static setDrawerBorderColor(color: string) {
        RouteRegisterer.drawerBorderColor = color;
    }

    static getDrawerBorderColor(): string {
        return RouteRegisterer.drawerBorderColor;
    }

    static setDrawerBackgroundColor(color: string) {
        RouteRegisterer.drawerBackgroundColor = color;
    }

    static getDrawerBackgroundColor(): string {
        return RouteRegisterer.drawerBackgroundColor;
    }

    static registerLegalRequirements(){

    }

    static async register(user, role, permissions){

    }

    // @ts-ignore
    static getDrawer(){
        return Drawer;
    }

    static async loadDrawerScreens(){
        RouteRegisterer.screens = RouteRegisterer.getDrawerScreens();
        RouteRegisterer.loginScreens = RouteRegisterer.getOnlyLoginDrawerScreens()
    }

    static getOnlyLoginDrawerScreens(){

    }

    static getDrawerScreens(){

    }

}
