import React from 'react';
import {TranslationKeys, useTranslation} from "@/helper/translations/Translation";
import {SystemActionHelper} from "@/helper/device/CommonSystemActionHelper";
import {NotificationHelper} from "@/helper/notification/NotificationHelper";
import {useSynchedAppSettings} from "@/states/SynchedAppSettings";
import {DisabledTouchableOpacity} from "@/components/buttons/DisabledTouchableOpacity";
import {MyButtonNotify} from "@/components/buttons/MyButtonNotify";
import {useMyModalConfirmer} from "@/components/modal/MyModalConfirmer";
import {Text, View} from "@/components/Themed";
import {AnimationAstronautComputer} from "@/compositions/animations/AnimationAstronautComputer";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {useIsDemo} from "@/states/SynchedDemo";

export type MyNewButtonProps = {
    onPress?: () => void;
	active?: boolean;
	tooltip: string;
	accessibilityLabel: string;
}
export const MyNotificationRemoteButton = (props: MyNewButtonProps) => {
	const [appSettings, setAppSettings] = useSynchedAppSettings();
	const isDemo = useIsDemo();

	const [notificationGranted, pushTokenObj, updateDeviceInformationAndRegisterIfNotFound, requestDeviceNotificationPermission] = NotificationHelper.useNotificationPermission();
	const translation_notify = useTranslation(TranslationKeys.notification);
	const transltation_device_android_system = useTranslation(TranslationKeys.device_android_system);
	const translation_device_ios_system = useTranslation(TranslationKeys.device_ios_system);
	const translation_device_web_system = useTranslation(TranslationKeys.device_web_system);
	const translation_this_feature_is_not_available_currently_reason = useTranslation(TranslationKeys.this_feature_is_not_available_currently_reason);

	const translation_notification_please_enable_notifications_in_order_to_use_this_feature = useTranslation(TranslationKeys.notification_please_enable_notifications_in_order_to_use_this_feature);

	function renderNotificationInformation() {
		return(
			<View style={{width: "100%"}}>
				<AnimationAstronautComputer />
				<View style={{
					width: "100%",
					paddingHorizontal: 20,
				}}>
					<View style={{
						width: "100%",
						paddingBottom: 20,
					}}>
						<Text>{translation_notification_please_enable_notifications_in_order_to_use_this_feature}</Text>
					</View>
				</View>
			</View>
		)
	}

	const showCustomAskForNotificationPermission = useMyModalConfirmer({
		title: translation_notify,
		onConfirm: () => {
			if(isDemo){
				props.onPress?.();
			}
			if(PlatformHelper.isSmartPhone()){
				if(NotificationHelper.isDeviceNotificationPermissionUndetermined(pushTokenObj)){
					requestDeviceNotificationPermission();
				} else {
					SystemActionHelper.MobileSystemActionHelper.openSystemAppSettings();
				}
			}

		},
		renderAsContentPreItems: (key: string, hide: () => void) => {
			return renderNotificationInformation();
		}
	})


	const notifications_ios_enabled = appSettings?.notifications_ios_enabled;
	const notifications_android_enabled = appSettings?.notifications_android_enabled;
	const notifications_email_enabled = appSettings?.notifications_email_enabled;

	const canDeactivate = true;

	let reasonNotAbleToActivate = null;
	let canActivate = false;
	if(PlatformHelper.isIOS()){
		canActivate = !!notifications_ios_enabled;
		reasonNotAbleToActivate = translation_device_ios_system;
	}
	if(PlatformHelper.isAndroid()){
		canActivate = !!notifications_android_enabled;
		reasonNotAbleToActivate = transltation_device_android_system;
	}
	if(PlatformHelper.isWeb()){
		canActivate = !!notifications_email_enabled;
		reasonNotAbleToActivate = translation_device_web_system;
	}
	if(isDemo){
		canActivate = true;
	}

	const onPress = () => {
		if(props.active){
			props.onPress?.();
		} else {
			if(PlatformHelper.isSmartPhone()){
				if(!notificationGranted){
					showCustomAskForNotificationPermission();
				} else {
					props.onPress?.();
				}
			}
			if(PlatformHelper.isWeb()) {
				props.onPress?.();
			}
		}
	}

	let button = <MyButtonNotify tooltip={props.tooltip} accessibilityLabel={props.accessibilityLabel} active={props.active} onPress={onPress} />

	const canUse = props.active ? canDeactivate : canActivate;
	let wrapper: any = button;
	if(!canUse){
		wrapper = <DisabledTouchableOpacity reason={translation_this_feature_is_not_available_currently_reason+reasonNotAbleToActivate}>
			{button}
		</DisabledTouchableOpacity>
	}

	return wrapper
}