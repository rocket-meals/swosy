import React, {FunctionComponent, useEffect, useState} from "react";
import {useSynchedProfile} from "../profile/ProfileAPI";
import {DirectusTranslationHelper} from "./DirectusTranslationHelper";
import {useSynchedRemoteFields} from "../../helper/synchedJSONState";


export interface AppState {
	collection: string,
	field: string,
	ignoreFallbackLanguage?: boolean,
}
export const DirectusCollectionFieldsDescriptionTranslation: FunctionComponent<AppState> = (props) => {

	const [remoteAppFields, setRemoteAppFields] = useSynchedRemoteFields()
	let default_language_code = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE;
	const [profile, setProfile] = useSynchedProfile();
	let language_code = profile?.language || default_language_code;

	const collection = props.collection;
	const fieldName = props.field;

	const collectionsSettings = remoteAppFields[collection] || {};
	const fieldsSettings = collectionsSettings[fieldName] || {};
	const fieldsTranslations = fieldsSettings?.meta?.translations || [];
	const fieldsTranslationsDict = getFieldsTranslationsDict(fieldsTranslations);

	function getFieldsTranslationsDict(fieldsTranslations){
		let fieldsTrasnlationsDict = {};

		for(let fieldsTranslationObj of fieldsTranslations){
			let fieldsLanguage = fieldsTranslationObj?.language;
			let translation = fieldsTranslationObj?.translation;
			fieldsTrasnlationsDict[fieldsLanguage] = translation;
		}
		return fieldsTrasnlationsDict;
	}

	function getTranslation(fieldsTranslationsDict, languages_code){
		return fieldsTranslationsDict[languages_code];
	}

	//TODO this can be refactored from DirectusTranslation
	let translation = getTranslation(fieldsTranslationsDict, language_code);
	if(!!translation){
		return <>
			{translation}
		</>
	}

	let fallback_translation = getTranslation(fieldsTranslationsDict, default_language_code);
	const ignoreFallbackLanguage = props?.ignoreFallbackLanguage;
	if(!!fallback_translation && !ignoreFallbackLanguage){
		return <>
			{fallback_translation}
		</>
	}

	return <>{fieldName}</>
}