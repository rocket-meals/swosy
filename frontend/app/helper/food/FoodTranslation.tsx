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
			let translation = getDirectusTranslation(languageCode, translations, 'name', false, food.alias, undefined);
			if (translation) {
				// capitalize first letter
				translation = translation.charAt(0).toUpperCase() + translation.slice(1);
				return translation;
			}
		}

		if (food?.alias) {
			// capitalize first letter
			return food.alias.charAt(0).toUpperCase() + food.alias.slice(1);
			//return food.alias
		}
	}
	return null;
}