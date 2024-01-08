import * as Notifications from "expo-notifications";
import {useSynchedJSONState, ConfigHolder} from "../../../kitcheningredients";
import {SynchedStateKeys} from "../synchedVariables/SynchedStateKeys";
import {Platform} from "react-native";


export enum NotificationPermissionStatus {
    GRANTED = "granted",
    DENIED = "denied",
    UNDETERMINED = "undetermined",
}
export type NotificationPermissionType = {
    status: NotificationPermissionStatus,
    expires: string,
    granted: string,
    canAskAgain: boolean
}
export type NotificationPushTokenType = {
    data: string,
}
export type NotificationObjType = {
    permission: NotificationPermissionType,
    pushtokenObj: NotificationPushTokenType
}
export class NotificationHelper{

    static getExperienceId(){
        return ConfigHolder?.AppConfig?.experienceId;
    }

    static useNotificationPermission(): [NotificationObjType, (notificationObj: NotificationObjType) => void]{
        const [notificationObj, setNotificationObjRaw] = useSynchedJSONState(SynchedStateKeys.SYNCHED_NotificationPermission);
        const setNotificationObj = (newNotificationObj) => {
            let newNotificationObjCopy: NotificationObjType = {...notificationObj};
            if(newNotificationObj?.permission!==undefined){
                newNotificationObjCopy.permission = newNotificationObj?.permission;
            }
            if(newNotificationObj?.pushtokenObj!==undefined){
                newNotificationObjCopy.pushtokenObj = newNotificationObj?.pushtokenObj;
            }
            setNotificationObjRaw(newNotificationObj);
        }
        return [notificationObj, setNotificationObj];
    }

    static isDeviceNotificationPermissionDenied(notificationObj: NotificationObjType){
        return notificationObj?.permission?.status === NotificationPermissionStatus.DENIED;
    }

    static isDeviceNotificationPermissionGranted(notificationObj: NotificationObjType){
        return notificationObj?.permission?.status === NotificationPermissionStatus.GRANTED;
    }

    static isDeviceNotificationPermissionUndetermined(notificationObj: NotificationObjType){
        return notificationObj?.permission?.status === NotificationPermissionStatus.UNDETERMINED;
    }

    static getExperienceId(){
        return ConfigHolder?.AppConfig?.experienceId;
    }

    static async loadDeviceNotificationPermission(): Promise<NotificationObjType>{
        let permission = await NotificationHelper.getDeviceNotificationPermission();
        let pushtokenObj = undefined;
        if(permission?.status === NotificationPermissionStatus.GRANTED){
            const experienceId = NotificationHelper.getExperienceId();
            pushtokenObj = await Notifications.getExpoPushTokenAsync({
                experienceId: experienceId,
            });
        }
        return {
            permission: permission,
            pushtokenObj: pushtokenObj
        }
    }

    private static async getDeviceNotificationPermission(): Promise<NotificationPermissionType>{
        try{
            let permission = await Notifications.getPermissionsAsync();
            // @ts-ignore
            return permission;
        } catch (err) {
            //TODO: handle emulator
            //console.log(err)
        }
    }


    static async requestDeviceNotificationPermission(): Promise<NotificationPermissionType>{
        try{
            let permission = await Notifications.requestPermissionsAsync(
                {
                    android: {
                      // On Android, all available permissions are granted by default
                    },
                    ios: {
                        allowAlert: true,
                        allowBadge: true,
                        allowSound: true,
                        allowAnnouncements: true,
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

    private static async getExpoPushTokenAsync(): Promise<NotificationPushTokenType>{
        try{
            // @ts-ignore
            const experienceId = getExperienceId();
            const token = await Notifications.getExpoPushTokenAsync({
                experienceId: experienceId,
            });
            return token;
        } catch (err) {
            //TODO: handle emulator
            //console.log(err)
            return undefined;
        }

    }

    static async scheduleLocalNotification(title, body, secondsFromNow, customIdentifier){
        let notification_id = await Notifications.scheduleNotificationAsync( {
            content: {
                title: title,
                body: body,
                data: { customIdentifier: customIdentifier },
                sound: Platform.OS === "android" ? null : "default", // https://stackoverflow.com/a/70085728/8908657
            },
            trigger: {
                seconds: secondsFromNow,
                channelId: 'testChannel',
            },
        })
        let notification = await NotificationHelper.getScheduledLocalNotification(notification_id);
        return notification;
    }

    static async cancelScheduledLocalNotification(notificationId){
        await Notifications.cancelScheduledNotificationAsync(notificationId)
        let foundNotification = await NotificationHelper.getScheduledLocalNotification(notificationId)
        return !foundNotification;
    }

    static async getAllScheuledLocalNotifications(){
        let notifications = await Notifications.getAllScheduledNotificationsAsync()
        return notifications;
    }

    static async getScheduledLocalNotification(notificationId){
        let notifications = await NotificationHelper.getAllScheuledLocalNotifications()
        if(!!notifications){
            return notifications.find((notification) => notification?.identifier === notificationId)
        }
        return null;
    }

    static async getScheduleLocalNotificationByCustomIdentifier(customIdentifier){
        let notifications = await NotificationHelper.getAllScheuledLocalNotifications()
        if(!!notifications){
            return notifications.find((notification) => notification?.content?.data?.customIdentifier === customIdentifier)
        }
        return null;
    }

}
