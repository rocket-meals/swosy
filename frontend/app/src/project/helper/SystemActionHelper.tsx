import React, {FunctionComponent, useEffect, useState} from "react";
import {Linking, Platform} from "react-native";
import * as IntentLauncher from 'expo-intent-launcher';
import {PlatformHelper} from "./PlatformHelper";
import {LocationType} from "./geo/LocationType";

const isAndroid = PlatformHelper.isAndroid();
const isIOS = PlatformHelper.isIOS();
const isMobile = isAndroid || isIOS;

const ANDROID_PARAM_NEW_ACTIVITY = {flags: 268435456};

export class CommonSystemActionHelper {

	static async openExternalURL(url){
		if(isMobile){
			await Linking.openURL(url);
		} else {
			await window.open(url, '_blank');
		}
	}

	static async openMaps(location: LocationType, useGoogleMaps?) {
		const latitude = location?.latitude;
		const longitude = location?.longitude;

		let alwaysUseGoogleMaps = true;
		if(useGoogleMaps !== undefined && useGoogleMaps !== null){
			alwaysUseGoogleMaps = useGoogleMaps;
		}

		let url =
			"https://www.google.com/maps?q=" +
			latitude +
			"," +
			longitude;

		if(!alwaysUseGoogleMaps){
			if(isIOS){
				url = "maps:" + latitude + "," + longitude;
			} else if(isAndroid){
				url = "geo:" + latitude + "," + longitude
			}
		}

		await CommonSystemActionHelper.openExternalURL(url);
	}

}

class PrivateSystemActionHelper extends CommonSystemActionHelper{

	static async androidStartActivityAsync(activityAction: string, extras?: any) {
		return await IntentLauncher.startActivityAsync(activityAction, {
			...ANDROID_PARAM_NEW_ACTIVITY,
			...extras
		})
	}

	static async openActivity(iosURL: string, androidAction: string, androidExtras?: any) {
		if (isIOS) {
			return await Linking.openURL(iosURL)
		} else if (isAndroid) {
			return await PrivateSystemActionHelper.androidStartActivityAsync(androidAction, androidExtras);
		}
	}

}

class mobileSystemActionHelper extends PrivateSystemActionHelper {
	static async openSystemAppSettings() {
		if(isMobile){
			await Linking.openSettings();
		}
	}

	static async openSystemSettings() {
		return await PrivateSystemActionHelper.openActivity("App-Prefs:", IntentLauncher.ACTION_SETTINGS);
	}
}

class iPhoneSystemActionHelper extends mobileSystemActionHelper {

}

class androidSystemActionHelper extends mobileSystemActionHelper {
	static async openNFCSettings() {
		return await mobileSystemActionHelper.openActivity("", IntentLauncher.ACTION_NFC_SETTINGS);
	}
}


export class SystemActionHelper {

	static mobileSystemActionHelper = mobileSystemActionHelper;
	static iPhoneSystemActionHelper = iPhoneSystemActionHelper;
	static androidSystemActionHelper = androidSystemActionHelper;

}
