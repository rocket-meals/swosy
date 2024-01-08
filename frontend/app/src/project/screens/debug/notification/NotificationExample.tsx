import React, {useEffect, useState} from "react";
import axios from "axios";
import {Input, ScrollView, Text, View} from "native-base";
import {SettingsSpacer} from "../../../components/settings/SettingsSpacer";
import {SettingsRow} from "../../../components/settings/SettingsRow";
import * as Notifications from 'expo-notifications';
import {NotificationHelper} from "../../../helper/notification/NotificationHelper";
import {ConfigHolder} from "../../../../kitcheningredients";
import {SettingsRowTextEditComponent} from "../../../components/settings/SettingsRowTextEditComponent";
import {MyTouchableOpacity} from "../../../components/buttons/MyTouchableOpacity";
import {CommonSystemActionHelper} from "../../../helper/SystemActionHelper";

export const NotificationExample = (props) => {

	const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();

	const [permission, setPermission] = useState(undefined)
	const [requestPermission, setRequestPermission] = useState(undefined)
	const [devicePushToken, setDevicePushToken] = useState(undefined)
	const [devicePushResult, setDevicePushResult] = useState(undefined)
	const [badgeCount, setBadgeCount] = useState(undefined)
	const [setBadgeCountResponse, setSetBadgeCountResponse] = useState(undefined)
	const [scheduleNotification, setScheduleNotification] = useState(undefined)
	const [allScheduleNotification, setAllScheduleNotification] = useState(undefined)
	const [notificationChannel, setNotificationChannel] = useState(undefined)
	const [allNotificationChannels, setAllNotificationChannels] = useState(undefined)


    function getExperienceId(){
		return ConfigHolder?.AppConfig?.experienceId;
	}


	async function run(setFunction, func){
		try{
			let newPermission = await func();
			setFunction(newPermission)
		} catch (err){
			setFunction(err.toString())
		}
	}

	function renderFunc(name, state, setState, func){
		return(
			<>
				<SettingsRow leftContent={name} onPress={() => {
					if(!!setState && !!func){
						run(setState, func)
					}
				}} />
				<Text selectable={true} >{JSON.stringify(state, null, 2)}</Text>
				<SettingsSpacer />
			</>
		)
	}

	return(
		<View style={{width: "100%"}}>
			{renderFunc("getPermissionsAsync", permission, setPermission, Notifications.getPermissionsAsync)}
			{renderFunc("requestPermissionsAsync", requestPermission, setRequestPermission, Notifications.requestPermissionsAsync)}
			{renderFunc("getDevicePushTokenAsync", devicePushToken, setDevicePushToken, async () => {
				try{
					const experienceId = getExperienceId();
					const token = await Notifications.getExpoPushTokenAsync({
						experienceId: experienceId,
					});
					return token;
				} catch (e) {
					return e.toString()
				}
			})}
			<SettingsRowTextEditComponent
				key={JSON.stringify(devicePushToken)}
				saveText={"Save"}
				cancelText={"Cancel"}
				placeholder={"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"}
				initialValue={devicePushToken?.data}
				onChange={async (value) => {
					if(!!value){
						// Send a notification to this device with token via the Expo push server
						let currentLog = "Value: " + value + "\n";

						const message = {
							to: value,
							sound: 'default',
							title: 'Original Title',
							body: 'And here is the body!',
							data: { data: 'goes here' },
						};
						// Send the message using axios
						try{
							const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
							const targetUrl = 'https://exp.host/--/api/v2/push/send';
							await axios.post(proxyUrl + targetUrl, message);
							currentLog += "Success";
							setDevicePushResult(currentLog);
							return true;
						} catch (e) {
							currentLog += e.toString() + "\n"
							setDevicePushResult(currentLog)
						}
					} else {
						setDevicePushResult("No token")
					}
					return false;
				}}
				description={"Enter a device push token to send a notification"}
				icon={"send"}
			/>
			<Text>{JSON.stringify(devicePushResult, null, 2)}</Text>
			<MyTouchableOpacity accessibilityLabel={"CORS"} onPress={() => {
				CommonSystemActionHelper.openExternalURL("https://cors-anywhere.herokuapp.com/")
			}	}>
				<Text>{"CORS"}</Text>
			</MyTouchableOpacity>
			{renderFunc("getBadgeCountAsync", badgeCount, setBadgeCount, Notifications.getBadgeCountAsync)}
			{renderFunc("setBadgeCountAsync 123", setBadgeCountResponse, setSetBadgeCountResponse, Notifications.setBadgeCountAsync.bind(null, 123))}
			{renderFunc("setBadgeCountAsync 0", setBadgeCountResponse, setSetBadgeCountResponse, Notifications.setBadgeCountAsync.bind(null, 0))}
			{renderFunc("scheduleNotificationAsync", scheduleNotification, setScheduleNotification, Notifications.scheduleNotificationAsync.bind(null, {
				content: {
					title: 'Look at that notification',
					body: "I'm so proud of myself!",
				},
				trigger: {
					seconds: 10,
					channelId: 'testChannel',
				},
			}))}
			{renderFunc("getAllScheduledNotificationsAsync", allScheduleNotification, setAllScheduleNotification, Notifications.getAllScheduledNotificationsAsync)}
			{renderFunc("setNotificationChannelAsync", notificationChannel, setNotificationChannel, Notifications.setNotificationChannelAsync.bind(null, 'testChannel', {
				name: 'Test notifications',
			}))}
			{renderFunc("getNotificationChannelsAsync", allNotificationChannels, setAllNotificationChannels, Notifications.getNotificationChannelsAsync)}


			<View><Text>{"Current Hook Values"}</Text></View>
			{renderFunc("notificationObj", notificationObj, null, null)}
		</View>
	)
}
