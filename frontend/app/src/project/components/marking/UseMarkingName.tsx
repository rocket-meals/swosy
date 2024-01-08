import React, {FunctionComponent} from "react";
import {Markings} from "../../directusTypes/types";
import {useDirectusTranslation} from "../translations/DirectusTranslationUseFunction";
import {Text} from "native-base";

export const useMarkingName: (marking: Markings) => string = (marking: Markings) => {
	const translations = marking?.translations;
	const ignoreMissingTranslation = !marking;
	let translatedName = useDirectusTranslation(translations, "name");

	let name = translatedName;
	let renderedLabel = marking?.label || "";
	if(marking?.label){
		renderedLabel = "("+marking?.label+")";
	}
	let rowContent = name+" "+renderedLabel;
	return rowContent
}
