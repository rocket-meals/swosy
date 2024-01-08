import {ConfigHolder, MyActionsheet, PlatformHelper} from "../../../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {useSynchedSettingsNotifications} from "../../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation, useAppTranslationRaw} from "../../translations/AppTranslation";
import {TouchableOpacityIgnoreChildEvents} from "../../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {SystemActionHelper} from "../../../helper/SystemActionHelper";
import {AnimationNotificationBell} from "../../animations/AnimationNotificationBell";
import {DeviceInformationHelper} from "../../../helper/DeviceInformationHelper";
import {NotificationHelper} from "../../../helper/notification/NotificationHelper";
import {MyTouchableOpacity} from "../../buttons/MyTouchableOpacity";

export type NotificationHelperComponentProps = {
    onPress?: (nextValue: boolean) => any;
    active: boolean;
}
export const NotificationHelperComponentRemoteMobile: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    const [notificationSettings, setNotificationSettings] = useSynchedSettingsNotifications()
    const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();
    const [deviceInformation, setDeviceInformation] = DeviceInformationHelper.useLocalDeviceInformation();
    const isSimulator = deviceInformation?.isSimulator;

    const translation_enable = useAppTranslation("enable")
    const translation_disable = useAppTranslation("disable")

    const translation_push_notification = useAppTranslation("push_notification")
    const translation_okay = useAppTranslation("okay")
    const translation_cancel = useAppTranslation("cancel")
    const translation_push_notification_not_enabled_for = useAppTranslation("push_notification_not_enabled_for");
    const translation_push_notification_your_device_not_supported = useAppTranslation("push_notification_your_device_not_supported");
    const translation_open_system_settings = useAppTranslation("open_system_settings");
    const translation_push_notification_please_allow_notifications_in_system_settings = useAppTranslation("push_notification_please_allow_notifications_in_system_settings");
    const translation_push_notification_we_will_ask_for_permission = useAppTranslation("push_notification_we_will_ask_for_permission");
    const translation_push_notification_please_be_patient_trying_to_get_information = useAppTranslation("push_notification_please_be_patient_trying_to_get_information");

    const serverEnabledNotifications = PlatformHelper.isIOS() ? notificationSettings?.ios_enabled : notificationSettings?.android_enabled;
    const platformName = PlatformHelper.getPlatformDisplayName();

    const user = ConfigHolder.instance.getUser();
    const actionsheet = MyActionsheet.useActionsheet();

    let actionsheetOptions = {};

    const notificationTokenSet = !!notificationObj?.pushtokenObj?.data;
    const deviceSupportsNotification = !isSimulator;
    const permissionExplicitlyDenied = NotificationHelper.isDeviceNotificationPermissionDenied(notificationObj);
    const permissionUndetermined = NotificationHelper.isDeviceNotificationPermissionUndetermined(notificationObj);

    function renderTouchable(actionsheetOptions, withoutOpacity = false){
        return (
            <TouchableOpacityIgnoreChildEvents
                useDefaultOpacity={!withoutOpacity}
                onPress={() => {
                    actionsheet.show(actionsheetOptions);
                }}
            >
                {props.children}
            </TouchableOpacityIgnoreChildEvents>
        )
    }

    if(!serverEnabledNotifications){
        actionsheetOptions = {
            title: translation_push_notification,
            acceptLabel: translation_okay,
            cancelLabel: translation_cancel,
            renderDescription: () => {
                return(
                    <View>
                        <AnimationNotificationBell />
                        <Text>{translation_push_notification_not_enabled_for+" "+platformName}</Text>
                    </View>
                )
            }
        }

        return renderTouchable(actionsheetOptions);
    }

    if(!deviceSupportsNotification){
        actionsheetOptions = {
            title: translation_push_notification,
            acceptLabel: translation_okay,
            cancelLabel: translation_cancel,
            renderDescription: () => {
                return(
                    <View>
                        <AnimationNotificationBell />
                        <Text>{translation_push_notification_your_device_not_supported}</Text>
                    </View>
                )
            }
        }
        return renderTouchable(actionsheetOptions);
    }

    if(permissionExplicitlyDenied){
        actionsheetOptions = {
            title: translation_push_notification,
            onAccept: () => {
                SystemActionHelper.mobileSystemActionHelper.openSystemAppSettings()
            },
            acceptLabel: translation_open_system_settings,
            cancelLabel: translation_cancel,
            renderDescription: () => {
                return(
                    <View>
                        <AnimationNotificationBell />
                        <Text>{translation_push_notification_please_allow_notifications_in_system_settings}</Text>
                    </View>
                )
            }
        }
        return renderTouchable(actionsheetOptions);
    }

    if(notificationTokenSet){
        let accessibilityLabel = props?.active ? translation_disable : translation_enable;

        return (
            <MyTouchableOpacity accessibilityLabel={translation_push_notification+" "+accessibilityLabel} onPress={() => {
                if(props.onPress){
                    let nextValue = !props.active;
                    props.onPress(nextValue);
                }
            }} >
                {props.children}
            </MyTouchableOpacity>
        )
    } else {
        if(permissionUndetermined){
            actionsheetOptions = {
                title: translation_push_notification,
                onAccept: async () => {
                    await NotificationHelper.requestDeviceNotificationPermission();
                    let newNotificationObj = await NotificationHelper.loadDeviceNotificationPermission();
                    setNotificationObj(newNotificationObj);
                },
                acceptLabel: translation_okay,
                cancelLabel: translation_cancel,
                renderDescription: () => {
                    return(
                        <View>
                            <AnimationNotificationBell />
                            <Text>{translation_push_notification_we_will_ask_for_permission}</Text>
                        </View>
                    )
                }
            }
            return renderTouchable(actionsheetOptions, true);
        } else {
            actionsheetOptions = {
                title: translation_push_notification,
                onAccept: async () => {

                },
                acceptLabel: "Hmmm?",
                cancelLabel: translation_cancel,
                renderDescription: () => {
                    return(
                        <View>
                            <AnimationNotificationBell />
                            <Text>{translation_push_notification_please_be_patient_trying_to_get_information}</Text>
                        </View>
                    )
                }
            }
            return renderTouchable(actionsheetOptions, true);
        }
    }

    return null;

}
