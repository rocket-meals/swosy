import { DatabaseTypes } from 'repo-depkit-common';
import { NotificationHelper } from '@/helper/NotificationHelper';
import { getCurrentDevice, getDeviceIdentifier, getDeviceInformationWithoutPushToken } from '@/helper/DeviceHelper';
import { ProfileHelper } from '@/redux/actions/Profile/Profile';
import { UPDATE_PROFILE } from '@/redux/Types/types';

/**
 * Writes the current notification permission and Expo push token of this device into the
 * profile's `devices`, in the shape the backend reads (`pushTokenObj.pushtokenObj.data`).
 * Without this the backend has no token to send a push message to, even after the user allowed
 * notifications. Does nothing when the stored device already matches.
 */
export async function syncCurrentDevicePushNotificationState(opts: { profile: DatabaseTypes.Profiles | undefined | null; dispatch: (action: any) => void }): Promise<void> {
	const { profile, dispatch } = opts;
	if (!profile?.id) {
		return;
	}
	try {
		const deviceInformationsWithoutPushToken = getDeviceInformationWithoutPushToken();
		const deviceInformationsId = getDeviceIdentifier(deviceInformationsWithoutPushToken);
		const pushTokenObj = await NotificationHelper.loadDeviceNotificationPermission();
		const deviceInformationsWithPushToken = {
			...deviceInformationsWithoutPushToken,
			pushTokenObj: pushTokenObj,
		};

		const newDevices = profile.devices ? [...profile.devices] : [];
		const foundDevice = getCurrentDevice(deviceInformationsId, newDevices);
		if (!foundDevice) {
			newDevices.push(deviceInformationsWithPushToken as any);
		} else {
			const deviceInformationsForUpdate = {
				...foundDevice,
				...deviceInformationsWithPushToken,
			};
			if (JSON.stringify(foundDevice) === JSON.stringify(deviceInformationsForUpdate)) {
				return;
			}
			const index = newDevices.indexOf(foundDevice);
			newDevices[index] = deviceInformationsForUpdate;
		}
		const result = (await new ProfileHelper().updateProfile({
			...profile,
			devices: newDevices,
		})) as DatabaseTypes.Profiles;
		if (result) {
			dispatch({
				type: UPDATE_PROFILE,
				payload: result,
			});
		}
	} catch (e) {
		console.error('Error updating device information:', e);
	}
}
