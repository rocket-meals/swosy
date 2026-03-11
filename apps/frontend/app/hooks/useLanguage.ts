import { useEffect, useMemo, useState } from 'react';
import { configureStore } from '@/redux/store';
import translations from '@/locales/translations.json';
import { CHANGE_LANGUAGE, SET_PIRATE_LANGUAGE } from '@/redux/Types/types';

const changeLanguage = (language: 'en' | 'de' | 'fr' | 'ar' | 'es' | 'ru' | 'tr' | 'zh') => ({
	type: CHANGE_LANGUAGE,
	payload: language,
});

const setPirateLanguage = (enabled: boolean) => ({
	type: SET_PIRATE_LANGUAGE,
	payload: enabled,
});

const applyPirateTransformation = (text: string): string => {
	return text.replace(/r/g, 'rrr').replace(/R/g, 'RRR').replace(/g/g, "'").replace(/G/g, "'");
};

export const useLanguage = () => {
	// console.log(configureStore.getState().settings.language, "lang");

	const [language, setLanguage] = useState(configureStore.getState().settings.language);
	const [pirateLanguage, setPirateLanguageState] = useState(configureStore.getState().settings.pirateLanguage);

	const setLanguageMode = (language: 'en' | 'de' | 'fr' | 'ar' | 'es' | 'ru' | 'tr' | 'zh') => {
		configureStore.dispatch(changeLanguage(language));
	};

	const togglePirateLanguage = (enabled: boolean) => {
		configureStore.dispatch(setPirateLanguage(enabled));
	};

	const translate = useMemo(() => {
		return (key: string) => {
			const text = (translations as any)[key]?.[language] || key;
			if (pirateLanguage) {
				return applyPirateTransformation(text);
			}
			return text;
		};
	}, [language, pirateLanguage]);

	useEffect(() => {
		const unsubscribe = configureStore.subscribe(() => {
			setLanguage(configureStore.getState().settings.language);
			setPirateLanguageState(configureStore.getState().settings.pirateLanguage);
		});

		return () => unsubscribe();
	}, []);

	const specialLanguageOptions = useMemo(() => ({ pirate_language: pirateLanguage }), [pirateLanguage]);

	return { language, setLanguageMode, translate, pirateLanguage, togglePirateLanguage, specialLanguageOptions };
};
