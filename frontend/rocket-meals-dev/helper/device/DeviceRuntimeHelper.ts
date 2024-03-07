import Constants from 'expo-constants'
import {UrlHelper} from "@/helper/UrlHelper";

export function isInExpoGo() {
    // TODO: Check if this is the correct way to check if the app is running in expo go
    //const isRunningInExpoGo = Constants.appOwnership === 'expo'

    let urlToLogin = UrlHelper.getURLToLogin();
    return urlToLogin.startsWith("exp://");
}

export function isInExpoGoDev() {
    let urlToLogin = UrlHelper.getURLToLogin();
    if(isInExpoGo()) { // app is running in expo go
        return !urlToLogin.startsWith("exp://u.expo.dev"); // url is like: exp://192.168.178.35:8081 or something like that
    }
    return false;
}

export function isInExpoGoStandalone() {
    let urlToLogin = UrlHelper.getURLToLogin();
    if(isInExpoGo()) { // app is running in expo go
        return urlToLogin.startsWith("exp://u.expo.dev"); // this is when the update is uploaded to expo for example via expo publish or our workflow
    }
    return false;
}