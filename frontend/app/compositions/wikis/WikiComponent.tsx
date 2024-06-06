import React, {FunctionComponent} from 'react';
import {Wikis} from '@/helper/database/databaseTypes/types';
import {DirectusTranslatedMarkdown} from '@/components/markdown/DirectusTranslatedMarkdown';
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

	return <DirectusTranslatedMarkdown field={'content'} translations={usedTranslations} />
}
