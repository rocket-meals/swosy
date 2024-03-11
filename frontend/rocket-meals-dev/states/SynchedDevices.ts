import {Devices} from '@/helper/database/databaseTypes/types';
import {useSynchedProfile} from '@/states/SynchedProfile';
import {getDeviceInformation} from '@/helper/device/DeviceHelper';



export function useSynchedDevices(): [Devices[], (newDevices: Devices[], timestamp?: number) => Promise<void>, (number | undefined), (timestamp?: number) => Promise<void>] {
	const [profile, setProfile, lastUpdateProfile] = useSynchedProfile();

	const lastUpdateDevices = lastUpdateProfile;

	function getDeviceIdentifier(device: Partial<Devices>) {
		return device.platform+'_'+device.brand+'_'+device.system_version;
	}

	const devices = profile?.devices || [];
	const setDevices = async (newDevices: Devices[], timestamp?: number) => {
		const newProfile = {...profile, devices: newDevices};
		await setProfile(newProfile, timestamp);
	}

	const updateDeviceIfNotRegistered = async (timestamp?: number) => {
		const deviceInformations: Partial<Devices> = await getDeviceInformation();
		const deviceInformationsId = getDeviceIdentifier(deviceInformations);
		let newDevices = devices;

		if (deviceInformationsId) {
			let foundDevice = undefined;
			for (const device of devices) {
				if (getDeviceIdentifier(device) === deviceInformationsId) {
					foundDevice = device;
					break;
				}
			}
			if (!foundDevice) {
				newDevices = [...devices, deviceInformations];
			} else {
				const deviceInformationsForUpdate = {...foundDevice, ...deviceInformations}; // we want to keep id or createdAt
				const index = devices.indexOf(foundDevice);
				newDevices = [...devices];
				newDevices[index] = deviceInformationsForUpdate;
			}
		}
		await setDevices(newDevices, timestamp);
	}

	return [devices, setDevices, lastUpdateDevices, updateDeviceIfNotRegistered];
}