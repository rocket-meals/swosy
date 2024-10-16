import {Platform} from 'react-native';
import {WebBrowserCustomTabsResults} from "expo-web-browser";
import * as WebBrowser from "expo-web-browser";

export class PlatformHelper {

	static isWeb() {
		return Platform.OS === 'web';
	}

	static isIOS() {
		return Platform.OS === 'ios';
	}

	static isAndroid() {
		return Platform.OS === 'android';
	}

	static async getAndroidPreferredBrowserPackageOption(){
		let customTabsSupporting: WebBrowserCustomTabsResults = await WebBrowser.getCustomTabsSupportingBrowsersAsync()
		const preferredBrowserPackage = customTabsSupporting.preferredBrowserPackage;
		console.log("customTabsSupporting: ")
		console.log(JSON.stringify(customTabsSupporting, null, 2))
		// Set default to Chrome in case no preferred or available browsers are found
		let defaultPrefferedBrowserPacckage = "com.android.chrome"; // Set a default fallback (can be Chrome)

		// Get the preferred browser if available
		let usedPreferredBrowserPackage = customTabsSupporting.preferredBrowserPackage;

		// If no preferred browser, use the first available from browserPackages or servicePackages
		if (!usedPreferredBrowserPackage) {
			if (customTabsSupporting.browserPackages.length > 0) {
				// Use the first available browser from browserPackages
				usedPreferredBrowserPackage = customTabsSupporting.browserPackages[0];
			} else if (customTabsSupporting.servicePackages.length > 0) {
				// If no browserPackages, fall back to the first available servicePackage
				usedPreferredBrowserPackage = customTabsSupporting.servicePackages[0];
			} else {
				// Fallback to Chrome if no packages are available
				usedPreferredBrowserPackage = defaultPrefferedBrowserPacckage;
			}
		}

		return {browserPackage: usedPreferredBrowserPackage};
	}

	static isSmartPhone() {
		//or is it better to as !isWeb
		return PlatformHelper.isAndroid() ||  PlatformHelper.isIOS()
	}

	static getPlatformDependentValue(webValue: any, iosValue: any, androidValue: any, defaultValue: any) {
		if (PlatformHelper.isWeb()) {
			return webValue;
		} else if (PlatformHelper.isIOS()) {
			return iosValue;
		} else if (PlatformHelper.isAndroid()) {
			return androidValue;
		}
		return defaultValue;
	}

	static getPlatformDisplayName() {
		if (PlatformHelper.isWeb()) {
			return 'Web';
		} else if (PlatformHelper.isIOS()) {
			return 'iOS';
		} else if (PlatformHelper.isAndroid()) {
			return 'Android';
		} else {
			return 'Unknown';
		}
	}
}
