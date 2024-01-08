// @ts-nocheck
import React from "react";
import {Dimensions, PixelRatio} from 'react-native';
import DeviceInfo from 'react-native-device-info'
//import * as DeviceInfo from 'expo-device';
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import {PlatformHelper} from "./PlatformHelper";

export interface DeviceInformation{
  display_width: any,
  display_height: any,
  display_scale: any,
  display_pixelratio: any,
  display_fontscale: any,
  isSimulator: boolean,
  isTablet: boolean,
  isLandscape: boolean,
  brand: string,
  platform: string,
  systemVersion: string,
  isIOS: boolean,
  isAndroid: boolean,
  isWeb: boolean,
}

export class DeviceHelper {

  /** Removed due to privacy policy problems on google
  private static async getDeviceFingerprint(): Promise<string> {
    let internalId = await DeviceInfo.getUniqueId();
    if (PlatformHelper.isWeb()) {
      try {
        const fpPromise = FingerprintJS.load()
        const fp = await fpPromise
        const result = await fp.get()
        console.log(result?.visitorId)
        internalId = result?.visitorId;
      } catch (e) {
        console.log("Error while getting fingerprint");
        console.error(e)
        internalId = "unknown-browser-fingerprint";
      }
    }
    return internalId;
  }
   */

  private static async getBrand(): Promise<string> {
    let brand = await DeviceInfo.getBrand();
    if(PlatformHelper.isWeb()){
      const baseOs = await DeviceInfo.getBaseOs();
      brand = baseOs;
    }
    return brand;
  }

  static async getInformations(): Promise<DeviceInformation> {
    const windowWidth = Dimensions.get('screen').width;
    const windowHeight = Dimensions.get('screen').height;
    const windowScale = Dimensions.get('screen').scale;
    const isSimulator = await DeviceInfo.isEmulator();
    const isTablet = await DeviceInfo.isTablet();
    const brand = await DeviceHelper.getBrand();
    const platform = PlatformHelper.getPlatformDisplayName();
    const systemVersion = await DeviceInfo.getSystemVersion();
    let isLandscape = await DeviceInfo.isLandscape();
    if(PlatformHelper.isWeb()){
      isLandscape = windowWidth > windowHeight;
    }

    return {
      display_width: windowWidth,
      display_height: windowHeight,
      display_scale: windowScale,
      display_pixelratio: PixelRatio.get(),
      display_fontscale: PixelRatio.getFontScale(),
      isSimulator: isSimulator,
      isTablet: isTablet,
      isLandscape: isLandscape,
      brand: brand,
      platform: platform,
      systemVersion: systemVersion,
      isIOS: PlatformHelper.isIOS(),
      isAndroid: PlatformHelper.isAndroid(),
      isWeb: PlatformHelper.isWeb(),
    }
  }
}
