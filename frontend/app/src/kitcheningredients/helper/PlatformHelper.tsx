import React from "react";
import {Platform} from "react-native";

export class PlatformHelper {

	static isWeb(){
		return Platform.OS === "web";
	}

	static isIOS(){
		return Platform.OS === "ios";
	}

	static isAndroid(){
		return Platform.OS === "android";
	}

	static isSmartPhone(){
		//or is it better to as !isWeb
		return PlatformHelper.isAndroid() ||  PlatformHelper.isIOS()
	}

	static getPlatformDisplayName(){
		if(PlatformHelper.isWeb()){
			return "Web";
		} else if(PlatformHelper.isIOS()){
			return "iOS";
		} else if(PlatformHelper.isAndroid()){
			return "Android";
		} else {
			return "Unknown";
		}
	}

}
