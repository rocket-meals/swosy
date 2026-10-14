import { useEffect, useMemo, useState } from 'react';
import { configureStore } from '@/redux/store';
import { translationResources } from '@/locales/translationResources';
import { CHANGE_LANGUAGE, SET_FUN_LANGUAGE_MODE, SET_PIRATE_LANGUAGE } from '@/redux/Types/types';
import { StringHelper, MathHelper, normalizeTranslationLanguage, toFullLanguageCode, TranslationLanguage } from 'repo-depkit-common';

// The store keeps the full language code ("de-DE"), the same value as `profiles.language` and the
// `languages` collection on the server. A short code ("de") is turned into the full one here.
const changeLanguage = (language: string) => ({
	type: CHANGE_LANGUAGE,
	payload: toFullLanguageCode(language) ?? language,
});

/**
 * The language the text catalogue is looked up in: the short code (`"de"`) of the stored full code
 * (`"de-DE"`). Also accepts the short codes older app versions stored, German when nothing fits.
 */
export const getTranslationLanguage = (language: string | null | undefined): TranslationLanguage => normalizeTranslationLanguage(language) ?? TranslationLanguage.DE;

const setPirateLanguageAction = (enabled: boolean) => ({
	type: SET_PIRATE_LANGUAGE,
	payload: enabled,
});

const setFunLanguageModeAction = (mode: string | null) => ({
	type: SET_FUN_LANGUAGE_MODE,
	payload: mode,
});

export const applyPirateTransformation = (text: string): string => {
	let result = text;
	// 1. Roll the R: r → rr, R → RR
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'r', replace: 'rr' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'R', replace: 'RR' });
	// 2. Vowel elongation: a → aa, o → oo
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'a', replace: 'aa' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'A', replace: 'AA' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'o', replace: 'oo' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'O', replace: 'OO' });
	// 3. Consonant aspiration: b → bh, g → gh, t → th
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'b', replace: 'bh' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'B', replace: 'Bh' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'g', replace: 'gh' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'G', replace: 'Gh' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 't', replace: 'th' });
	result = StringHelper.replaceAllLiteralWithOptions({ str: result, find: 'T', replace: 'Th' });
	// 4. Append "Arr!" for full sentences (ending with sentence-ending punctuation)
	if (/[.!?]\s*$/.test(text.trim())) {
		result = result + ' Arr!';
	}
	return result;
};

export const applyBackwardsTransformation = (text: string): string => {
	return text.split('').reverse().join('');
};

export const applyLeetspeakTransformation = (text: string): string => {
	const leet: Record<string, string> = {
		A: '4', E: '3', I: '1', O: '0', S: '5', T: '7', B: '8', G: '9',
	};
	return text.toUpperCase().split('').map(c => leet[c] ?? c).join('');
};

export const applyAlternatingCaseTransformation = (text: string): string => {
	let letterIndex = 0;
	return text.split('').map(c => {
		if (/[a-zA-Z]/.test(c)) {
			return letterIndex++ % 2 === 0 ? c.toUpperCase() : c.toLowerCase();
		}
		return c;
	}).join('');
};

export const applyTypoglycemiaTransformation = (text: string): string => {
	return StringHelper.replaceAllWithCallback({
		str: text,
		find: /\b[a-zA-ZÄäÖöÜüß]{4,}\b/g,
		replace: (word) => {
			const first = word[0];
			const last = word[word.length - 1];
			const inner = word.slice(1, -1).split('').reverse().join('');
			return first + inner + last;
		},
	});
};

export const applyGlitchTransformation = (text: string): string => {
	return StringHelper.replaceAllWithCallback({
		str: text,
		find: /\b[a-zA-ZÄäÖöÜüß]+\b/g,
		replace: (word) => {
			const chars = word.split('');
			for (let i = chars.length - 1; i > 0; i--) {
				const j = Math.floor(MathHelper.random() * (i + 1));
				[chars[i], chars[j]] = [chars[j], chars[i]];
			}
			return chars.join('');
		},
	});
};

export const FUN_LANGUAGE_MODES = {
	BACKWARDS: 'backwards',
	LEETSPEAK: 'leetspeak',
	ALTERNATING: 'alternating',
	TYPOGLYCEMIA: 'typoglycemia',
	GLITCH: 'glitch',
} as const;

export type FunLanguageMode = typeof FUN_LANGUAGE_MODES[keyof typeof FUN_LANGUAGE_MODES];

export const applyFunModeTransformation = (text: string, mode: string | null): string => {
	if (!mode || !text) return text;
	switch (mode) {
		case FUN_LANGUAGE_MODES.BACKWARDS: return applyBackwardsTransformation(text);
		case FUN_LANGUAGE_MODES.LEETSPEAK: return applyLeetspeakTransformation(text);
		case FUN_LANGUAGE_MODES.ALTERNATING: return applyAlternatingCaseTransformation(text);
		case FUN_LANGUAGE_MODES.TYPOGLYCEMIA: return applyTypoglycemiaTransformation(text);
		case FUN_LANGUAGE_MODES.GLITCH: return applyGlitchTransformation(text);
		default: return text;
	}
};

export const useLanguage = () => {
	// console.log(configureStore.getState().settings.language, "lang");

	const [language, setLanguage] = useState(configureStore.getState().settings.language);
	const [pirateLanguage, setPirateLanguage] = useState(configureStore.getState().settings.pirateLanguage);
	const [funLanguageMode, setFunLanguageMode] = useState<string | null>(configureStore.getState().settings.funLanguageMode);

	const translationLanguage = getTranslationLanguage(language);

	const setLanguageMode = (language: string) => {
		configureStore.dispatch(changeLanguage(language));
	};

	const togglePirateLanguage = (enabled: boolean) => {
		configureStore.dispatch(setPirateLanguageAction(enabled));
	};

	const toggleFunLanguageMode = (mode: string | null) => {
		configureStore.dispatch(setFunLanguageModeAction(mode));
	};

	const translate = useMemo(() => {
		return (key: string) => {
			const text = translationResources[key]?.[translationLanguage] || key;
			let result = text;
			if (pirateLanguage) {
				result = applyPirateTransformation(result);
			}
			if (funLanguageMode) {
				result = applyFunModeTransformation(result, funLanguageMode);
			}
			return result;
		};
	}, [translationLanguage, pirateLanguage, funLanguageMode]);

	useEffect(() => {
		const unsubscribe = configureStore.subscribe(() => {
			setLanguage(configureStore.getState().settings.language);
			setPirateLanguage(configureStore.getState().settings.pirateLanguage);
			setFunLanguageMode(configureStore.getState().settings.funLanguageMode);
		});

		return () => unsubscribe();
	}, []);

	const translateDynamic = useMemo(() => {
		return (text: string) => {
			if (!text) return text;
			let result = text;
			if (pirateLanguage) {
				result = applyPirateTransformation(result);
			}
			if (funLanguageMode) {
				result = applyFunModeTransformation(result, funLanguageMode);
			}
			return result;
		};
	}, [pirateLanguage, funLanguageMode]);

	const specialLanguageOptions = useMemo(
		() => ({ pirate_language: pirateLanguage, fun_language_mode: funLanguageMode }),
		[pirateLanguage, funLanguageMode]
	);

	return { language, translationLanguage, setLanguageMode, translate, translateDynamic, pirateLanguage, togglePirateLanguage, funLanguageMode, toggleFunLanguageMode, specialLanguageOptions };
};
