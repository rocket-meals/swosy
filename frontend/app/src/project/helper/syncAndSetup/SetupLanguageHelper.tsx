import React, {FunctionComponent, useEffect, useState} from "react";

import * as RNLocalize from "react-native-localize";
import {DirectusTranslationHelper} from "../../components/translations/DirectusTranslationHelper";
import {ProfileAPI} from "../../components/profile/ProfileAPI";

export class SetupLanguageHelper {

	static getUsersInstalledLanguageCodesInPreferedOrder(){
		let preferedLocales = RNLocalize.getLocales() || []; //get preferred locales of the user

		let codes = [];
		for(let i=0; i<preferedLocales.length; i++){
			let preferedLocale = preferedLocales[i];
			let languageCode = preferedLocale.languageTag; // !languageCode would be "de" where we want languageTag "de-DE"
			codes.push(languageCode);
		}
		return codes;
	}

	static doesSelectedLanguageExistInLanguages(profileLanguage, availableLanguageDict){
		return !!availableLanguageDict[profileLanguage];
	}

	static getClosestLangCode(langCode, availableLanguageDict){
		let availableLangCodes = Object.keys(availableLanguageDict);
		if(!!langCode){ // e. G. langCode = "de-US" or "de-DE"
			let firstPart = langCode.split("-")[0]; // e. G. de
			for(let i=0; i<availableLangCodes.length; i++){
				let availableLangCode = availableLangCodes[i]; // e. G. "de-DE"
				if(availableLangCode.startsWith(firstPart)){ //
					return availableLangCode;
				}
			}
		}
		return false;
	}

	static getBestLanguageCodeForUser(usersInstalledLanguageCodesPreferedOrder, availableLanguageDict){
		for(let i=0; i<usersInstalledLanguageCodesPreferedOrder.length; i++){ //loop all languages user knows
			let usersInstalledLanguageCode = usersInstalledLanguageCodesPreferedOrder[i];
			let closesLangCode = SetupLanguageHelper.getClosestLangCode(usersInstalledLanguageCode, availableLanguageDict)
			if(!!closesLangCode){ //is users language known by the server
				return closesLangCode;
			}
		}
		return DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE
	}

	static getAvailableLanguageCodeDict(availableLanguages){
		let langCodeDict = {};
		for(let i=0; i<availableLanguages.length; i++){
			let availableLanguage = availableLanguages[i]; // {code: "de-DE", name: "German"}
			let languageCode = availableLanguage.code; // "de-DE"
			langCodeDict[languageCode] = languageCode;
		}
		return langCodeDict;
	}

	static getNewProfileWithDefaultLanguageSet(profile, availableLanguages, cachedOSLanguage, currentDevicePreferedLocales){
		let profileCopy = {...profile};
		console.log("setDefaultLanguage");
		let profileLanguage = profile[ProfileAPI.getLanguageFieldName()];
		let availableLanguageDict = SetupLanguageHelper.getAvailableLanguageCodeDict(availableLanguages);

		console.log("profileLanguage: "+profileLanguage)
		let doesSelectedLanguageExist = SetupLanguageHelper.doesSelectedLanguageExistInLanguages(profileLanguage, availableLanguageDict);
		console.log("doesSelectedLanguageExist: "+doesSelectedLanguageExist)
		console.log("currentDevicePreferedLocales");
		console.log(currentDevicePreferedLocales);

		let userChangedOSLanguage = JSON.stringify(cachedOSLanguage) !== JSON.stringify(currentDevicePreferedLocales);
		let updateLanguage = !doesSelectedLanguageExist || userChangedOSLanguage
		console.log("updateLanguage: "+updateLanguage)
		if(updateLanguage){
			let bestLanguageCodeForUser = SetupLanguageHelper.getBestLanguageCodeForUser(currentDevicePreferedLocales, availableLanguageDict)
			console.log("bestLanguageCodeForUser: "+bestLanguageCodeForUser);
			if(!!bestLanguageCodeForUser){
				profileCopy[ProfileAPI.getLanguageFieldName()] = bestLanguageCodeForUser;
			}
		}
		return profileCopy;
	}

}
