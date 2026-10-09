// Type only: this helper is also bundled into the Directus app (module page "Push-Nachricht").
import type { DatabaseTypes } from 'repo-depkit-common';

const HELPER_NAME = 'PushNotificationHelper';

type PushTokenObject = {
  pushtokenObj?: {
    data?: unknown;
  };
};

export class PushNotificationHelper {
  static getExpoPushTokenFromDevice(device: DatabaseTypes.Devices): string | undefined {
    const expoPushToken = this.readExpoPushToken(device.pushTokenObj);
    if (!expoPushToken) {
      console.log(`${HELPER_NAME}: Device ${device.id} has no push token object with a valid Expo token`);
    }
    return expoPushToken;
  }

  /** The Expo push token inside a raw `devices.pushTokenObj` (object or JSON string), without logging. */
  static readExpoPushToken(raw: unknown): string | undefined {
    const pushTokenObj = this.parsePushTokenObj(raw);
    const expoTokenCandidate = (pushTokenObj as PushTokenObject | undefined)?.pushtokenObj?.data;
    return typeof expoTokenCandidate === 'string' && expoTokenCandidate.length > 0 ? expoTokenCandidate : undefined;
  }

  static getExpoPushTokensToDevicesDict(
    devices: DatabaseTypes.Devices[]
  ): Record<string, DatabaseTypes.Devices[]> {
    const expoPushTokensDict: Record<string, DatabaseTypes.Devices[]> = {};
    for (const device of devices) {
      const expoPushToken = this.getExpoPushTokenFromDevice(device);
      if (!expoPushToken) {
        continue;
      }

      if (!expoPushTokensDict[expoPushToken]) {
        expoPushTokensDict[expoPushToken] = [];
      }

      expoPushTokensDict[expoPushToken].push(device);
    }

    return expoPushTokensDict;
  }

  static getExpoPushTokensFromDevices(devices: DatabaseTypes.Devices[]): string[] {
    return Object.keys(this.getExpoPushTokensToDevicesDict(devices));
  }

  private static parsePushTokenObj(raw: unknown): Record<string, unknown> | undefined {
    if (!raw) {
      return undefined;
    }

    if (typeof raw === 'string') {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch (error) {
        console.warn(`${HELPER_NAME}: Failed to parse push token object`, error);
        return undefined;
      }
    }

    if (typeof raw === 'object') {
      return raw as Record<string, unknown>;
    }

    return undefined;
  }
}
