import {Linking} from 'react-native';
import {LocationType} from '@/helper/geo/LocationType';
import {PlatformHelper} from '@/helper/PlatformHelper';

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
