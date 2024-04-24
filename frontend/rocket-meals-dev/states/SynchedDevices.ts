import {Devices} from '@/helper/database/databaseTypes/types';
import {useSynchedProfile} from '@/states/SynchedProfile';
import {getDeviceInformationWithoutPushToken} from '@/helper/device/DeviceHelper';
import {NotificationHelper} from "@/helper/notification/NotificationHelper";



export function useSynchedDevices(): [Devices | undefined , Devices[], (newDevices: Devices[], timestamp?: number) => Promise<void>, number | undefined, (timestamp?: number) => Promise<void>] {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile();

	const lastUpdateDevices = lastUpdateProfile;

	function getDeviceIdentifier(device: Partial<Devices>) {
		return device.platform+'_'+device.brand+'_'+device.system_version;
	}

	const devices = profile?.devices || [];
	let deviceInformationsWithoutPushToken: Partial<Devices> = getDeviceInformationWithoutPushToken();
	let deviceInformationsId = getDeviceIdentifier(deviceInformationsWithoutPushToken);
	let currentDevice = getCurrentDevice(deviceInformationsId);

	function getCurrentDevice(deviceInformationsId: string | undefined): Devices | undefined {
		let foundDevice: undefined | Devices = undefined;
		if (deviceInformationsId) {
			for (const device of devices) {
				if (getDeviceIdentifier(device) === deviceInformationsId) {
					foundDevice = device;
					break;
				}
			}
		}
		return foundDevice;
	}


	const setDevices = async (newDevices: Devices[], timestamp?: number) => {
		await setProfile((currentProfile) => {
			if(currentProfile){
				currentProfile.devices = newDevices;
			}
			return currentProfile;
		}, timestamp);
	}

	const updateDeviceInformationAndRegisterIfNotFound = async (timestamp?: number) => {
		deviceInformationsWithoutPushToken = getDeviceInformationWithoutPushToken();
		deviceInformationsId = getDeviceIdentifier(deviceInformationsWithoutPushToken);
		const pushTokenObj = await NotificationHelper.loadDeviceNotificationPermission();
		let deviceInformationsWithPushToken = {...deviceInformationsWithoutPushToken,
			pushTokenObj: pushTokenObj
		};


		let newDevices = devices;
		let foundDevice = getCurrentDevice(deviceInformationsId);
		if (!foundDevice) {
			newDevices = [...devices, deviceInformationsWithPushToken];
		} else {
			const deviceInformationsForUpdate = {...foundDevice, ...deviceInformationsWithPushToken}; // we want to keep id or createdAt
			const index = devices.indexOf(foundDevice);
			newDevices = [...devices];
			newDevices[index] = deviceInformationsForUpdate;
		}
		await setDevices(newDevices, timestamp);
	}

	return [currentDevice, devices, setDevices, lastUpdateDevices, updateDeviceInformationAndRegisterIfNotFound];
}