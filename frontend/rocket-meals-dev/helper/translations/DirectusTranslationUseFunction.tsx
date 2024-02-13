import {useProfileLanguageCode, useSynchedProfile} from "@/states/SynchedProfile";
import {DirectusTranslationHelper} from "@/helper/translations/DirectusTranslationHelper";
import {StringHelper} from "@/helper/string/StringHelper";

export type TranslationEntry = {
    languages_code: string,
    [key: string]: any
}

export function useDirectusTranslation(translations: TranslationEntry[], field: string, ignoreFallbackLanguage?: boolean, fallback_text?: string, params?: any): string {
  let [languageCode, setLanguageCode] = useProfileLanguageCode();

  console.log("translations", translations)

  const translationDict = getLanguageDict(translations);

  type TranslationDict = {[key: string]: TranslationEntry};

  function getLanguageDict(translations: TranslationEntry[]) {
    let translationDict: TranslationDict = {};
    if(!!translations && translations.length > 0){
      for (let translation of translations) {
        translationDict[translation?.languages_code] = translation;
      }
    }
    return translationDict;
  }

  function getTranslation(translationDict: TranslationDict, languages_code: string, params?: any) {
    let translationEntry = translationDict[languages_code];
    if (!translationEntry) {
      return null;
    }
    let translation = translationEntry[field]
    if(!!params){
      let paramKeys = Object.keys(params);
      for(let i=0; i<paramKeys.length; i++){
        let paramKey = paramKeys[i];
        let paramValue = params[paramKey];
        translation = StringHelper.replaceAll(translation, "%"+paramKey, paramValue);
      }
    }
    return translation;
  }

  console.log("translationDict", translationDict)

  let translation = getTranslation(translationDict, languageCode, params);
  if (!!translation) {
    return translation
  }

  // First fallback language
  let default_language_code = DirectusTranslationHelper.FALLBACK_LANGUAGE_CODE;
  let fallback_translation = getTranslation(translationDict, default_language_code, params);
  if (!!fallback_translation && !ignoreFallbackLanguage) { //TODO: maybe allow an user to set a proposal for his language
    return fallback_translation
  }

  // Second fallback language
  default_language_code = DirectusTranslationHelper.DEFAULT_LANGUAGE_CODE;
  fallback_translation = getTranslation(translationDict, default_language_code, params);
  if (!!fallback_translation && !ignoreFallbackLanguage) { //TODO: maybe allow an user to set a proposal for his language
    return fallback_translation
  }

  if(fallback_text!==undefined && fallback_text!==null){
    return fallback_text;
  }

  return "Missing translation";
}
