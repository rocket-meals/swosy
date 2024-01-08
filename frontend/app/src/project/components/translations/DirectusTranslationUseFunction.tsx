import React, {FunctionComponent} from "react";
import {useSynchedProfile} from "../profile/ProfileAPI";
import {DirectusTranslationHelper} from "./DirectusTranslationHelper";
import {StringHelper} from "../../helper/StringHelper";

export function useProfileLanguageCode(){
	let default_language_code = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE;
	const [profile, setProfile] = useSynchedProfile();
	let language_code = profile?.language || default_language_code;
	return language_code;
}

export function useDirectusTranslation(translations, field, ignoreFallbackLanguage?, fallback_text?, params?: any): string {
	const translationDict = getLanguageDict(translations);
	let language_code = useProfileLanguageCode();

	function getLanguageDict(translations) {
		let translationDict = {};
		if(!!translations && translations.length > 0){
			for (let translation of translations) {
				translationDict[translation?.languages_code] = translation;
			}
		}
		return translationDict;
	}

	function getTranslation(translationDict, languages_code, params?: any) {
		let translationEntry = translationDict[languages_code];
		if (!translationEntry) {
			return null;
		}
		let translation = translationEntry[field]
		if(!!params){
			let paramKeys = Object.keys(params);
			for(let i=0; i<paramKeys.length; i++){
				let paramKey = paramKeys[i];
				let paramValue = params[paramKey];
				translation = StringHelper.replaceAll(translation, "%"+paramKey, paramValue);
			}
		}
		return translation;
	}

	let translation = getTranslation(translationDict, language_code, params);
	if (!!translation) {
		return translation
	}

	// First fallback language
	let default_language_code = DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE;
	let fallback_translation = getTranslation(translationDict, default_language_code, params);
	if (!!fallback_translation && !ignoreFallbackLanguage) { //TODO: maybe allow an user to set a proposal for his language
		return fallback_translation
	}

	// Second fallback language
	default_language_code = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE;
	fallback_translation = getTranslation(translationDict, default_language_code, params);
	if (!!fallback_translation && !ignoreFallbackLanguage) { //TODO: maybe allow an user to set a proposal for his language
		return fallback_translation
	}

	if(fallback_text!==undefined && fallback_text!==null){
		return fallback_text;
	}

	return "Missing translation";
}
