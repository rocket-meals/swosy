import {MyActionsheet} from "../../../../kitcheningredients";
import React, {FunctionComponent} from "react";
import {Text, View} from "native-base";
import {useSynchedSettingsNotifications} from "../../../helper/synchedJSONState";
import {AppTranslation, useAppTranslation} from "../../translations/AppTranslation";
import {TouchableOpacityIgnoreChildEvents} from "../../../helper/overlay/TouchableOpacityIgnoreChildEvents";
import {AnimationNotificationBell} from "../../animations/AnimationNotificationBell";
import {MyTouchableOpacity} from "../../buttons/MyTouchableOpacity";

export type NotificationHelperComponentProps = {
    onPress?: (nextValue: boolean) => any;
    active: boolean;
}
export const NotificationHelperComponentRemoteWeb: FunctionComponent<NotificationHelperComponentProps> = (props) => {

    const [notficationSettings, setNotficationSettings] = useSynchedSettingsNotifications()
    const actionsheet = MyActionsheet.useActionsheet();
    const server_notification_email = notficationSettings?.email_enabled;

    const translation_enable = useAppTranslation("enable")
    const translation_disable = useAppTranslation("disable")

    const translation_push_notification = useAppTranslation("push_notification")
    const translation_okay = useAppTranslation("okay")
    const translation_cancel = useAppTranslation("cancel")
    const translation_push_notification_currently_no_email_support = useAppTranslation("push_notification_currently_no_email_support");

    let actionsheetOptions = {};

    function renderTouchable(actionsheetOptions, withoutOpacity = false){
        return (
            <TouchableOpacityIgnoreChildEvents
                useDefaultOpacity={!withoutOpacity}
                onPress={() => {
                actionsheet.show(actionsheetOptions);
            }}>
                    {props.children}
            </TouchableOpacityIgnoreChildEvents>
        )
    }

    if(!server_notification_email){
        actionsheetOptions = {
            title: translation_push_notification,
            acceptLabel: translation_okay,
            cancelLabel: translation_cancel,
            renderDescription: () => {
                return(
                    <View>
                        <AnimationNotificationBell />
                        <Text>{translation_push_notification_currently_no_email_support}</Text>
                    </View>
                )
            }
        }
        return renderTouchable(actionsheetOptions);
    } else {
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
    }
}
