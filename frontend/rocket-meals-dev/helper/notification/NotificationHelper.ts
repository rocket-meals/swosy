import * as Notifications from 'expo-notifications';
import {Platform} from 'react-native';
import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import Constants from 'expo-constants';
import {ExpoPushToken} from 'expo-notifications';
import {PlatformHelper} from '@/helper/PlatformHelper';
import {IosAuthorizationStatus} from 'expo-notifications/src/NotificationPermissions.types';

export type NotificationObjType = {
    permission?: Notifications.NotificationPermissionsStatus,
    pushtokenObj?: ExpoPushToken
}

export type MyPushToken = ExpoPushToken;

export class NotificationHelper {
	static getProjectId(): string {
		return Constants.expoConfig?.extra?.eas?.projectId;
	}

	static useNotificationPermission(): [NotificationObjType, (notificationObj: NotificationObjType) => void] {
		const [notificationObj, setNotificationObjRaw] = useSyncState<NotificationObjType>(PersistentStore.notificationPermission);
		const setNotificationObj = async (newNotificationObj: NotificationObjType) => {
			const newNotificationObjCopy: NotificationObjType = JSON.parse(JSON.stringify(notificationObj));
			if (newNotificationObj?.permission!==undefined) {
				newNotificationObjCopy.permission = newNotificationObj?.permission;
			}
			if (newNotificationObj?.pushtokenObj!==undefined) {
				newNotificationObjCopy.pushtokenObj = newNotificationObj?.pushtokenObj;
			}
			await setNotificationObjRaw(newNotificationObj);
		}
		let usedNotificationObj = notificationObj;
		if (!usedNotificationObj) {
			usedNotificationObj = {
				permission: undefined,
				pushtokenObj: undefined
			}
		}

		return [usedNotificationObj, setNotificationObj];
	}

	static getBadgeCountAsync() {
		return Notifications.getBadgeCountAsync();
	}

	static setBadgeCountAsync(count: number) {
		return Notifications.setBadgeCountAsync(count);
	}

	static isDeviceNotificationPermissionDenied(notificationObj: NotificationObjType) {
		return notificationObj?.permission?.granted === false
	}

	static isDeviceNotificationPermissionGranted(notificationObj: NotificationObjType) {
		return notificationObj?.permission?.granted
	}

	static isDeviceNotificationPermissionUndetermined(notificationObj: NotificationObjType) {
		if (PlatformHelper.isIOS()) {
			return notificationObj?.permission?.ios?.status === IosAuthorizationStatus.NOT_DETERMINED
		} else if (PlatformHelper.isAndroid()) {
			return notificationObj?.permission?.android?.importance === undefined
		}
	}

	static async loadDeviceNotificationPermission(): Promise<NotificationObjType> {
		const permission = await NotificationHelper.getDeviceNotificationPermission();
		let pushtokenObj = undefined;
		if (!!permission && permission.granted) {
			pushtokenObj = await NotificationHelper.getExpoPushTokenAsync()
		}
		return {
			permission: permission,
			pushtokenObj: pushtokenObj
		}
	}

	static async getDeviceNotificationPermission(): Promise<Notifications.NotificationPermissionsStatus | undefined> {
		try {
			return await Notifications.getPermissionsAsync();
		} catch (err) {
			//TODO: handle emulator
			//console.log(err)
		}
	}


	static async requestDeviceNotificationPermission():  Promise<Notifications.NotificationPermissionsStatus | undefined> {
		try {
			const permission = await Notifications.requestPermissionsAsync(
				{
					android: {
						// On Android, all available permissions are granted by default
					},
					ios: {
						allowAlert: true,
						allowBadge: true,
						allowSound: true,
					}
				}
			);
			// @ts-ignore
			return permission;
		} catch (err) {
			//TODO: handle emulator
			//console.log(err)
			return undefined;
		}
	}

	static async getExpoPushTokenAsync():  Promise<ExpoPushToken | undefined> {
		try {
			const projectId = NotificationHelper.getProjectId();
			return await Notifications.getExpoPushTokenAsync({
				projectId: projectId,
			});
		} catch (err) {
			//TODO: handle emulator
			//console.log(err)
			return undefined;
		}
	}

	static async scheduleLocalNotification(title: string, body: string, secondsFromNow: number, customIdentifier?: string) {
		const notification_id = await Notifications.scheduleNotificationAsync( {
			content: {
				title: title,
				body: body,
				data: { customIdentifier: customIdentifier },
				sound: Platform.OS === 'android' ? false : 'default', // https://stackoverflow.com/a/70085728/8908657
			},
			trigger: {
				seconds: secondsFromNow,
				channelId: 'testChannel',
			},
		})
		const notification = await NotificationHelper.getScheduledLocalNotification(notification_id);
		return notification;
	}

	static async cancelScheduledLocalNotification(notificationId: string) {
		await Notifications.cancelScheduledNotificationAsync(notificationId)
		const foundNotification = await NotificationHelper.getScheduledLocalNotification(notificationId)
		return !foundNotification;
	}

	static getNotificationChannelsAsync() {
		return Notifications.getNotificationChannelsAsync();
	}

	static setNotificationChannelAsync(channel: string) {
		Notifications.setNotificationChannelAsync(channel, {
			name: channel,
			importance: Notifications.AndroidImportance.HIGH,
			sound: 'default',
		});
	}

	static async getAllScheduledNotificationsAsync() {
		const notifications = await Notifications.getAllScheduledNotificationsAsync()
		return notifications;
	}

	static async getScheduledLocalNotification(notificationId: string) {
		const notifications = await NotificationHelper.getAllScheduledNotificationsAsync()
		if (notifications) {
			return notifications.find((notification) => notification?.identifier === notificationId)
		}
		return null;
	}

	static async getScheduleLocalNotificationByCustomIdentifier(customIdentifier: string) {
		const notifications = await NotificationHelper.getAllScheduledNotificationsAsync()
		if (notifications) {
			return notifications.find((notification) => notification?.content?.data?.customIdentifier === customIdentifier)
		}
		return null;
	}
}
