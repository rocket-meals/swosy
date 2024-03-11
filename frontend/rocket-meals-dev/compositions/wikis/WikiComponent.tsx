import React, {FunctionComponent} from 'react';
import {Wikis} from '@/helper/database/databaseTypes/types';
import {DirectusTranslatedMarkdown} from '@/components/markdown/DirectusTranslatedMarkdown';

interface AppState {
    wiki: Wikis
}
export const WikiComponent: FunctionComponent<AppState> = ({wiki}) => {
	const translations = wiki?.translations

	if (typeof translations === 'undefined' || typeof translations === 'string') {
		return null;
	}

	return <DirectusTranslatedMarkdown field={'content'} translations={translations} />
}
