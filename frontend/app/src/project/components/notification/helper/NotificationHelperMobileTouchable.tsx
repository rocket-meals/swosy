import {MyActionsheet} from "../../../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";
import {TouchableOpacityIgnoreChildEvents} from "../../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {SystemActionHelper} from "../../../helper/SystemActionHelper";
import {AnimationNotificationBell} from "../../animations/AnimationNotificationBell";
import {DeviceInformationHelper} from "../../../helper/DeviceInformationHelper";
import {NotificationHelper} from "../../../helper/notification/NotificationHelper";
import {TouchableOpacity} from "react-native";

export type NotificationHelperComponentProps = {
    onPress?: () => any;
    style?: any;
}
export const NotificationHelperMobileTouchable: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();
    const [deviceInformation, setDeviceInformation] = DeviceInformationHelper.useLocalDeviceInformation();
    const isSimulator = deviceInformation?.isSimulator;

    const translation_push_notification = useAppTranslation("push_notification")
    const translation_okay = useAppTranslation("okay")
    const translation_cancel = useAppTranslation("cancel")
    const translation_push_notification_not_enabled_for = useAppTranslation("push_notification_not_enabled_for");
    const translation_push_notification_your_device_not_supported = useAppTranslation("push_notification_your_device_not_supported");
    const translation_open_system_settings = useAppTranslation("open_system_settings");
    const translation_push_notification_please_allow_notifications_in_system_settings = useAppTranslation("push_notification_please_allow_notifications_in_system_settings");
    const translation_push_notification_we_will_ask_for_permission = useAppTranslation("push_notification_we_will_ask_for_permission");
    const translation_push_notification_please_be_patient_trying_to_get_information = useAppTranslation("push_notification_please_be_patient_trying_to_get_information");

    const touchableStyle = props?.style;

    const actionsheet = MyActionsheet.useActionsheet();

    let actionsheetOptions = {};

    const notificationTokenSet = !!notificationObj?.pushtokenObj?.data;
    const deviceSupportsNotification = !isSimulator;
    const permissionExplicitlyDenied = NotificationHelper.isDeviceNotificationPermissionDenied(notificationObj);
    const permissionUndetermined = NotificationHelper.isDeviceNotificationPermissionUndetermined(notificationObj);

    function renderTouchableActionSheet(actionsheetOptions, withoutOpacity = false){
        return (
            <TouchableOpacityIgnoreChildEvents style={touchableStyle}
                useDefaultOpacity={!withoutOpacity}
                onPress={() => {
                    actionsheet.show(actionsheetOptions);
                }}
            >
                {props.children}
            </TouchableOpacityIgnoreChildEvents>
        )
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
        return renderTouchableActionSheet(actionsheetOptions);
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
        return renderTouchableActionSheet(actionsheetOptions);
    }

    if(notificationTokenSet){
        return (
            <TouchableOpacity style={touchableStyle} onPress={async () => {
                if(props?.onPress){
                    await props.onPress();
                }
            }}>
                {props.children}
            </TouchableOpacity>
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
                acceptLabel: translation_open_system_settings,
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
            return renderTouchableActionSheet(actionsheetOptions, true);
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
            return renderTouchableActionSheet(actionsheetOptions, true);
        }
    }

    return null;

}
