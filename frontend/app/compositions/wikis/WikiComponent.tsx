import React, {FunctionComponent} from 'react';
import {Wikis} from '@/helper/database/databaseTypes/types';
import {DirectusTranslatedMarkdownWithCards} from '@/components/markdown/DirectusTranslatedMarkdownWithCards';
import {TranslationEntry} from "@/helper/translations/DirectusTranslationUseFunction";

interface AppState {
    wiki: Wikis
}
export const WikiComponent: FunctionComponent<AppState> = ({wiki}) => {
	const translations = wiki?.translations

	if (typeof translations === 'undefined' || typeof translations === 'string') {
		return null;
	}

	let usedTranslations = translations as TranslationEntry[];

	return <DirectusTranslatedMarkdownWithCards field={'content'} translations={usedTranslations} />
}
