import React, {FunctionComponent} from "react";
import {NotificationIcon} from "./NotificationIcon";
import {NotificationHelperComponentRemote} from "./helper/NotificationHelperComponentRemote";
import {PlatformHelper} from "../../../kitcheningredients";
import {NotificationHelperComponentLocal} from "./helper/NotificationHelperComponentLocal";

export interface AppState{
	accountRequired?: boolean;
	localNotificationKey?: string;
	localNotificationEnabledNative?: boolean;
	localNotificationEnabledWeb?: boolean;
	getNotificationMessageObject?: () => any;
	textColor?: string;
	onPress?: (nextValue: boolean) => any;
	active?: boolean;
	style?: any;
}
export const NotificationItem: FunctionComponent<AppState> = (props) => {

	const localNotificationKey = props.localNotificationKey || "";

	// native: local notification
	// native: push notification
	// web: local notification?
	// web: mail notification?

	const isWebAndShowLocalNotification = PlatformHelper.isWeb() && props?.localNotificationEnabledWeb;
	const isNativeAndShowLocalNotification = PlatformHelper.isSmartPhone() && props?.localNotificationEnabledNative;
	const showLocalNotification = isWebAndShowLocalNotification || isNativeAndShowLocalNotification;

	if(!!localNotificationKey && showLocalNotification){
			return (
				<NotificationHelperComponentLocal localNotificationKey={localNotificationKey} getNotificationMessageObject={props?.getNotificationMessageObject} style={props?.style} onPress={props?.onPress} active={props.active}>
					{props.children}
				</NotificationHelperComponentLocal>
			)
	}

	return(
		<NotificationHelperComponentRemote accountRequired={props?.accountRequired} onPress={props?.onPress} active={props?.active} >
			<NotificationIcon active={props?.active} color={props?.textColor} />
		</NotificationHelperComponentRemote>
	)
}
