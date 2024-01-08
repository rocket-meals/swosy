import type {StorageManager} from 'native-base';
import {ColorMode, useColorMode} from 'native-base';

import AsyncStorage from '@react-native-community/async-storage';

import {Appearance} from "react-native";
import {RequiredStorageKeys} from "../storage/RequiredStorageKeys";
import {ConfigHolder} from "../ConfigHolder";

//TODO dont save it directly into storage, use synched storage variable
export default class ColorCodeHelper {
	static VALUE_THEME_DARK: ColorMode = 'dark';
	static VALUE_THEME_LIGHT: ColorMode = 'light';
	static VALUE_THEME_DEFAULT: ColorMode = ColorCodeHelper.VALUE_THEME_LIGHT;

	static isDarkMode(){
    const { colorMode, toggleColorMode } = useColorMode();
    let nextTheme = colorMode===ColorCodeHelper.VALUE_THEME_LIGHT ? ColorCodeHelper.VALUE_THEME_DARK : ColorCodeHelper.VALUE_THEME_LIGHT;
    return colorMode!==ColorCodeHelper.VALUE_THEME_LIGHT
  }

	static getSystemPreferedColor(){
		const colorScheme = Appearance.getColorScheme();
		if (colorScheme === 'dark') {
			// Use dark color scheme
			return ColorCodeHelper.VALUE_THEME_DARK
		}
		return ColorCodeHelper.VALUE_THEME_LIGHT;
	}

	static async getColorModeFromStorage(): Promise<ColorMode>{
		try {
			let cookieAsString = await AsyncStorage.getItem(RequiredStorageKeys.CACHED_THEME);
			let cookie = ConfigHolder.instance.storage.getCookieFromStorageString(cookieAsString);
			let val = cookie?.value;
			if(!val){
				return ColorCodeHelper.getSystemPreferedColor();
			}
			return val === ColorCodeHelper.VALUE_THEME_DARK ? ColorCodeHelper.VALUE_THEME_DARK : ColorCodeHelper.VALUE_THEME_LIGHT;
		} catch (e) {
			console.log(e);
			return ColorCodeHelper.VALUE_THEME_DEFAULT;
		}
	}

	static async setColorModeToStorage(value: ColorMode){
		try {
		  let cookie = ConfigHolder.instance.storage.getNewCookieFromKeyValue(RequiredStorageKeys.CACHED_THEME, value);
		  let storageString = ConfigHolder.instance.storage.getStorageStringFromCookie(cookie);
			await AsyncStorage.setItem(RequiredStorageKeys.CACHED_THEME, storageString);
		} catch (e) {
			console.log(e);
		}
	}

	static getManager(): StorageManager{
		return {
			get: async () => {
        if (!!ConfigHolder.plugin?.getOverwriteTheme()) {
          return ConfigHolder.plugin?.getOverwriteTheme();
        }
				return await ColorCodeHelper.getColorModeFromStorage();
			},
			set: async (value: ColorMode) => {
				await ColorCodeHelper.setColorModeToStorage(value);
			},
		};
	}
}
