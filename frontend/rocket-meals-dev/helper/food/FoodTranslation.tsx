import {useSynchedAppTranslationsDict} from '@/states/SynchedTranslations';
import {
	getDirectusTranslation,
	TranslationEntry,
	useDirectusTranslation
} from '@/helper/translations/DirectusTranslationUseFunction';
import {Foods} from "@/helper/database/databaseTypes/types";
import {useProfileLanguageCode, useSynchedProfileCanteen} from "@/states/SynchedProfile";

export function useFoodTranslation(food: Foods): string {
	const translations = food.translations as TranslationEntry[];
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	let alias = food.alias;
	let translation = getDirectusTranslation(languageCode, translations, "name", false, alias);
	return translation;
}
