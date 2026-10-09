// src/utils/getPushToken.ts
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/**
 * Returns the Expo push token of this device.
 *
 * With `requestPermission: false` the system permission dialog is never shown: the token is only
 * returned when the user already allowed notifications. iOS shows that dialog exactly once, so on
 * iOS it must not be spent at app start but only after our own explanation (see
 * usePushNotificationOptInPrompt).
 */
export async function registerForPushNotificationsAsync(options: { requestPermission: boolean } = { requestPermission: true }): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return null;
    }

    const Notifications = await import('expo-notifications');
    let token: string | null = null;

    if (!Device.isDevice) {
      console.log('Must use physical device for Push Notifications');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted' && options.requestPermission) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Failed to get push token: permission not granted');
      return null;
    }

    const projectId = "36f72583-5997-4602-8609-05f39444f2e7";
    const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
    token = tokenResponse.data;

    console.log('Push Token:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  } catch (error) {
    console.error('Error while getting push token:', error);
    return null;
  }
}