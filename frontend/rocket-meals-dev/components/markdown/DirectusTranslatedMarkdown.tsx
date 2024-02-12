import React, {FunctionComponent} from "react";
import {View} from "@/components/Themed";
import {TranslationEntry, useDirectusTranslation} from "@/helper/translations/DirectusTranslationUseFunction";
import {ThemedMarkdown} from "@/components/markdown/ThemedMarkdown";

interface AppState {
	translations: TranslationEntry[]
	field: string,
	ignoreFallbackLanguage?: boolean,
	fallback_text?: string | any,
	color?: string
}
export const DirectusTranslatedMarkdown: FunctionComponent<AppState> = (props) => {
		const translations = props?.translations;
		const field = props?.field;
		const content = useDirectusTranslation(translations, field, props?.ignoreFallbackLanguage, props?.fallback_text);

		return (
			<View style={{width: "100%"}}>
				<ThemedMarkdown color={props?.color}>
					{content}
				</ThemedMarkdown>
			</View>
		);
}
