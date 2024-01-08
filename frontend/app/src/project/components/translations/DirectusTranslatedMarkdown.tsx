import React, {FunctionComponent, useEffect, useState} from "react";
import {Text, View} from "native-base";
import {DirectusMarkdown} from "../../../kitcheningredients";
import {useDirectusTranslation} from "./DirectusTranslationUseFunction";

interface AppState {
	item?: any,
	field?: string,
	ignoreFallbackLanguage?: boolean,
	fallback_text?: string | any,
	color?: string
}
export const DirectusTranslatedMarkdown: FunctionComponent<AppState> = (props) => {
		const item = props?.item;
		const translations = item?.translations;
		const field = props?.field;
		const content = useDirectusTranslation(translations, field, props?.ignoreFallbackLanguage, props?.fallback_text);

		return (
			<View style={{width: "100%"}}>
				<DirectusMarkdown color={props?.color} data={{
					content: content
				}} fieldname={"content"} />
			</View>
		);
}
