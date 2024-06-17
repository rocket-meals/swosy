import React, {FunctionComponent} from 'react';
import {View} from '@/components/Themed';
import {TranslationEntry, useDirectusTranslation} from '@/helper/translations/DirectusTranslationUseFunction';
import {ThemedMarkdown} from '@/components/markdown/ThemedMarkdown';
import {ThemedMarkdownWithCards} from "@/components/markdown/ThemedMarkdownWithCards";

interface AppState {
	translations: TranslationEntry[]
	field: string,
	ignoreFallbackLanguage?: boolean,
	fallback_text?: string | any,
	color?: string
}
export const DirectusTranslatedMarkdownWithCards: FunctionComponent<AppState> = (props) => {
	const translations = props?.translations;
	const field = props?.field;
	const content = useDirectusTranslation(translations, field, props?.ignoreFallbackLanguage, props?.fallback_text);

	return (
		<View style={{width: '100%'}}>
			<ThemedMarkdownWithCards color={props?.color}>
				{content}
			</ThemedMarkdownWithCards>
		</View>
	);
}
