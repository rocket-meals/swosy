import {Linking} from 'react-native';
import {LocationType} from '@/helper/geo/LocationType';
import {PlatformHelper} from '@/helper/PlatformHelper';
import * as IntentLauncher from 'expo-intent-launcher';

const isAndroid = PlatformHelper.isAndroid();
const isIOS = PlatformHelper.isIOS();
const isMobile = isAndroid || isIOS;

export class CommonSystemActionHelper {
	static async openExternalURL(url: string, newWindow = false) {
		if (isMobile) {
			await Linking.openURL(url);
		} else {
			let target = '_self';
			if (newWindow) {
				target = '_blank';
			}
			await window.open(url, target);
		}
	}

	static async openMaps(location: LocationType, useGoogleMaps?: boolean) {
		const latitude = location?.latitude;
		const longitude = location?.longitude;

		let alwaysUseGoogleMaps = true;
		if (useGoogleMaps !== undefined && useGoogleMaps !== null) {
			alwaysUseGoogleMaps = useGoogleMaps;
		}

		let url =
            'https://www.google.com/maps?q=' +
            latitude +
            ',' +
            longitude;

		if (!alwaysUseGoogleMaps) {
			if (isIOS) {
				url = 'maps:' + latitude + ',' + longitude;
			} else if (isAndroid) {
				url = 'geo:' + latitude + ',' + longitude
			}
		}

		await CommonSystemActionHelper.openExternalURL(url, true);
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