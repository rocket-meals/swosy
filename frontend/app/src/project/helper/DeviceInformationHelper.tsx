import React from "react";
import {useSynchedJSONState, DeviceHelper} from "../../kitcheningredients";
import {SynchedStateKeys} from "./synchedVariables/SynchedStateKeys";
import {NotificationHelper} from "./notification/NotificationHelper";

export class DeviceInformationHelper {

	static useLocalDeviceInformation(): any{
		return useSynchedJSONState(SynchedStateKeys.SYNCHED_DeviceInformations);
	}

	static async getDeviceInformation(): Promise<any>{ // Promise<DeviceInformationType>
		const baseInformation = await DeviceHelper.getInformations();
		delete baseInformation.deviceFingerprint; // We dont want to deal with extra policy: https://www.npmjs.com/package/react-native-device-info#getdeviceid

		let pushTokenObj = await NotificationHelper.loadDeviceNotificationPermission();

		let informations = {
			...baseInformation,
			pushTokenObj: pushTokenObj,
		}

		return informations
	}

}
