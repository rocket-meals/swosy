import React, {FunctionComponent, useEffect, useState} from "react";
import {useDirectusTranslation} from "./DirectusTranslationUseFunction";
import {useSynchedAppTranslations} from "../../helper/synchedJSONState";
import {Text} from "native-base";
import {DefaultTranslator, useBackgroundColor} from "../../../kitcheningredients";
import {ColorHelper} from "../../helper/ColorHelper";

interface AppTranslationProps {
	id: string;
	params?: any;
	prefix?: string;
	postfix?: string;
	ignoreFallbackLanguage?: boolean;
	backgroundColor?: string;
	color?: string;
}
export const AppTranslation: FunctionComponent<AppTranslationProps> = ({id, params, postfix, ignoreFallbackLanguage, prefix, children, backgroundColor, color, useHeaderTextColor, ...rest}) => {
	const content = useAppTranslation(id, ignoreFallbackLanguage, params);
	const dynamicBackgroundColor = useBackgroundColor()
	const contrastColor = ColorHelper.useContrastColor(backgroundColor || dynamicBackgroundColor);
	let dynamicColor = color || contrastColor;
	return <Text color={dynamicColor} {...rest} >{prefix}{content}{postfix}</Text>
}

export function useAppTranslationMarkdown(id, ignoreFallbackLanguage?, params?){
	return useAppTranslationRaw(id, "markdown", ignoreFallbackLanguage, params);
}

export function useAppTranslation(id, ignoreFallbackLanguage?, params?): string {
	return useAppTranslationRaw(id, "content", ignoreFallbackLanguage, params);
}

export function useAppTranslationRaw(id, field, ignoreFallbackLanguage?, params?): string {
	const [remoteAppTranslations, setRemoteAppTranslations] = useSynchedAppTranslations();
	let translations = [];
	if(!!remoteAppTranslations){
		let appTranslation = remoteAppTranslations[id];
		translations = appTranslation?.translations || [];
	}

	const defaultTranslation = DefaultTranslator.useTranslation(id);
	let fallbackText = defaultTranslation || "Missing translation ("+id+")";
	let content = useDirectusTranslation(translations, field, ignoreFallbackLanguage, fallbackText);
	if(!!params){
		let keys = Object.keys(params);
		for(let key of keys){
			let value = params[key];
			content = content.replace(key, value);
		}
	}

	return content;
}
