import {useState} from 'react';
import {Text, View} from '@/components/Themed';
import {MyScrollView} from '@/components/scrollview/MyScrollView';
import {MyPushToken, NotificationHelper} from '@/helper/notification/NotificationHelper';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {SettingsRowTextEdit} from '@/components/settings/SettingsRowTextEdit';
import axios from 'axios';
import {CommonSystemActionHelper} from '@/helper/device/CommonSystemActionHelper';

export default function HomeScreen() {
	const [notificationObj, setNotificationObj] = NotificationHelper.useNotificationPermission();

	const [permission, setPermission] = useState(undefined)
	const [requestPermission, setRequestPermission] = useState(undefined)
	const [devicePushToken, setDevicePushToken] = useState<MyPushToken | undefined>(undefined)
	const [devicePushResult, setDevicePushResult] = useState<string |undefined>(undefined)
	const [badgeCount, setBadgeCount] = useState<string |undefined>(undefined)
	const [setBadgeCountResponse, setSetBadgeCountResponse] = useState<string |undefined>(undefined)
	const [scheduleNotification, setScheduleNotification] = useState<string |undefined>(undefined)
	const [allScheduleNotification, setAllScheduleNotification] = useState<string |undefined>(undefined)
	const [notificationChannel, setNotificationChannel] = useState<string |undefined>(undefined)
	const [allNotificationChannels, setAllNotificationChannels] = useState<string |undefined>(undefined)


	async function run(setFunction: any, func: any) {
		try {
			const newPermission = await func();
			setFunction(newPermission)
		} catch (err: any) {
			setFunction(err.toString())
		}
	}

	function renderFunc(name: string, state: any, setState: any, func: any) {
		return (
			<>
				<SettingsRow onPress={() => {
					if (!!setState && !!func) {
						run(setState, func)
					}
				}}
				accessibilityLabel={name}
				labelLeft={name}
				/>
				<Text selectable={true} >{JSON.stringify(state, null, 2)}</Text>
			</>
		)
	}

	return (
		<MyScrollView>
			<View style={{width: '100%', height: '100%'}}>
				{renderFunc('getPermissionsAsync', permission, setPermission, NotificationHelper.getDeviceNotificationPermission)}
				{renderFunc('requestPermissionsAsync', requestPermission, setRequestPermission, NotificationHelper.requestDeviceNotificationPermission)}
				{renderFunc('getDevicePushTokenAsync', devicePushToken, setDevicePushToken, async () => {
					try {
						return NotificationHelper.getExpoPushTokenAsync();
					} catch (e: any) {
						return e.toString()
					}
				})}
				<SettingsRowTextEdit
					key={JSON.stringify(devicePushToken)}
					placeholder={'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]'}
					value={devicePushToken?.data}
					onSave={async (value) => {
						if (value) {
							// Send a notification to this device with token via the Expo push server
							let currentLog = 'Value: ' + value + '\n';

							const message = {
								to: value,
								sound: 'default',
								title: 'Original Title',
								body: 'And here is the body!',
								data: { data: 'goes here' },
							};
							// Send the message using axios
							try {
								const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
								const targetUrl = 'https://exp.host/--/api/v2/push/send';
								await axios.post(proxyUrl + targetUrl, message);
								currentLog += 'Success';
								setDevicePushResult(currentLog);
								return true;
							} catch (e: any) {
								currentLog += e.toString() + '\n'
								setDevicePushResult(currentLog)
							}
						} else {
							setDevicePushResult('No token')
						}
						return false;
					}}
					description={'Enter a device push token to send a notification'}
					rightIcon={'send'}
					accessibilityLabel={
						'test'
					}
					labelLeft={'send'}
				/>
				<Text>{JSON.stringify(devicePushResult, null, 2)}</Text>
				<SettingsRow onPress={() => {
					CommonSystemActionHelper.openExternalURL('https://cors-anywhere.herokuapp.com/')
				}}
				accessibilityLabel={'OPEN CORS'}
				labelLeft={'Enable CORS'}
				/>
				{renderFunc('getBadgeCountAsync', badgeCount, setBadgeCount, NotificationHelper.getBadgeCountAsync)}
				{renderFunc('setBadgeCountAsync 123', setBadgeCountResponse, setSetBadgeCountResponse, NotificationHelper.setBadgeCountAsync.bind(null, 123))}
				{renderFunc('setBadgeCountAsync 0', setBadgeCountResponse, setSetBadgeCountResponse, NotificationHelper.setBadgeCountAsync.bind(null, 0))}
				{renderFunc('scheduleNotificationAsync', scheduleNotification, setScheduleNotification, NotificationHelper.scheduleLocalNotification.bind(null,
					'Look at that notification', 'I\'m so proud of myself!', 10
				))}
				{renderFunc('getAllScheduledNotificationsAsync', allScheduleNotification, setAllScheduleNotification, NotificationHelper.getAllScheduledNotificationsAsync)}
				{renderFunc('setNotificationChannelAsync', notificationChannel, setNotificationChannel, NotificationHelper.setNotificationChannelAsync.bind(null, 'testChannel'))}
				{renderFunc('getNotificationChannelsAsync', allNotificationChannels, setAllNotificationChannels, NotificationHelper.getNotificationChannelsAsync)}


				<View style={{width: '100%'}}><Text>{'Current Hook Values'}</Text></View>
				{renderFunc('notificationObj', notificationObj, null, null)}
			</View>
		</MyScrollView>
	);
}
