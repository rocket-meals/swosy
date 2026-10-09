import React, { createContext, ReactNode, useCallback, useContext, useMemo } from 'react';
import { commonTranslations, CommonTranslationKeys, DEFAULT_TRANSLATION_LANGUAGE, translateWithResources, type TranslationLanguage } from 'repo-depkit-common';

export type SettingsContextType = {
	primaryColor: string;
	onAccountRequired?: () => void;
	/** Language of the app (`de`, `en`, `de-DE`, ...), used for the shared texts of common-ui components. */
	language?: string;
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

type SettingsProviderProps = {
	primaryColor: string;
	onAccountRequired?: () => void;
	language?: string;
	children: ReactNode;
};

export const SettingsProvider = ({ primaryColor, onAccountRequired, language, children }: SettingsProviderProps) => {
	const value = useMemo(
		() => ({ primaryColor, onAccountRequired, language }),
		[primaryColor, onAccountRequired, language]
	);
	return (
		<SettingsContext.Provider value={value}>
			{children}
		</SettingsContext.Provider>
	);
};

export const useSettingsContext = (): SettingsContextType | undefined => {
	return useContext(SettingsContext);
};

/**
 * Translates a shared key (`CommonTranslationKeys`) in the language of the `SettingsProvider`.
 * Apps may not override shared keys, so the shared catalogue gives the same text as the app would.
 */
export const useCommonTranslation = (): ((key: CommonTranslationKeys) => string) => {
	const language = useSettingsContext()?.language;
	return useCallback(
		(key: CommonTranslationKeys) =>
			translateWithResources({ resources: commonTranslations, key, language: (language ?? DEFAULT_TRANSLATION_LANGUAGE) as TranslationLanguage }),
		[language]
	);
};
