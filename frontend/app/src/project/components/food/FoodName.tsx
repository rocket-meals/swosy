import React, {FunctionComponent, useEffect, useState} from "react";
import {Foods} from "../../directusTypes/types";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {StringHelper} from "../../helper/StringHelper";

interface AppState {
	food?: Foods,
}
export const useFoodName = (food) => {
	const translations = food?.translations;
	const ignoreMissingTranslation = !food;
	const fallbackText = !!ignoreMissingTranslation ? "" : undefined;
	let content = useDirectusTranslation(translations, "name");
	if(!!content && content.length>0){
		content = StringHelper.capitalizeFirstLetter(content)
	}
	return content;
}

export const FoodName: FunctionComponent<AppState> = (props) => {
	const food = props?.food;
	const content = useFoodName(food);
	return content;
}
