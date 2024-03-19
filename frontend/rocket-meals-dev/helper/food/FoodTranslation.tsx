import {getDirectusTranslation, TranslationEntry} from '@/helper/translations/DirectusTranslationUseFunction';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useProfileLanguageCode} from "@/states/SynchedProfile";

export function useFoodTranslation(food: Foods): string | null {
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	return getFoodName(food, languageCode);
}

export function getFoodName(food: string | Foods | null | undefined, languageCode: string) {
	if (typeof food === 'object' && food !== null) {
		let translations = food.translations as TranslationEntry[]
		if (translations) {
			let translation = getDirectusTranslation(languageCode, translations, 'name', false, undefined, undefined);
			if (translation) {
				return translation;
			}
		}

		if (food?.alias) {
			return food.alias
		}
	}
	return null;
}