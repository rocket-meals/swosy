import React from 'react';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import {
  BuildingsTranslations,
  Foodoffers,
  Foods,
  FormCategoriesTranslations,
  FormFieldsTranslations,
  FormsTranslations,
  MarkingsTranslations,
  NewsTranslations,
  WikisTranslations,
} from '@/constants/types';
import { StringHelper } from './stringHelper';

export type TranslationEntry = {
  languages_code: string;
  [key: string]: any;
};

const getIconComponent = (
  iconString: string,
  iconColor: string
): JSX.Element | null => {
  if (!iconString) return null;

  const [library, iconName] = iconString.split(':') as [string, any];

  switch (library) {
    case 'MaterialCommunityIcons':
      return (
        <MaterialCommunityIcons name={iconName} size={24} color={iconColor} />
      );
    case 'MaterialIcons':
      return <MaterialIcons name={iconName} size={24} color={iconColor} />;
    case 'FontAwesome':
      return <FontAwesome name={iconName} size={24} color={iconColor} />;
    default:
      console.warn(`Icon library "${library}" is not supported`);
      return null;
  }
};

interface Translation {
  languages_code: string;
  text?: string;
  name?: string;
  content?: string;
  description?: string;
  title?: string;
}

const getTextFromTranslation = (
  translations: Array<Translation | any>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.text || translation?.name || translation?.content || '';
};

export const getIntroDescriptionTranslation = (
  translations: Array<any>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.intro_description || '';
};

export const getDetailedDescriptionTranslation = (
  translations: Array<any>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.detailed_description || '';
};

export const getFromCategoryTranslation = (
  translations: Array<
    FormCategoriesTranslations | FormsTranslations | FormFieldsTranslations
  >,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.name || '';
};

export const getFoodAttributesTranslation = (
  translations: Array<any>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.name || '';
};

export const getFromDescriptionTranslation = (
  translations: Array<FormFieldsTranslations>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.split('-')[0] === languageCode
  );
  return translation?.description || '';
};

export const getTitleFromTranslation = (
  translations: Array<Translation | WikisTranslations>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';
  const translation = translations.find(
    (t) => t.languages_code?.toString()?.split('-')[0] === languageCode
  );
  return translation?.title || '';
};

const getDescriptionFromTranslation = (
  translations: Array<Translation | MarkingsTranslations>,
  languageCode: string
): string => {
  if (!translations || translations.length === 0) return '';

  const prioritizedTranslation = translations.find(
    (t) =>
      t.languages_code?.toString()?.split('-')[0] === languageCode &&
      t.description
  );

  // Fall back to any translation matching the language code
  const fallbackTranslation = translations.find(
    (t) => t.languages_code?.toString()?.split('-')[0] === languageCode
  );

  const translation = prioritizedTranslation || fallbackTranslation;
  return translation?.description || '';
};

const extractFoodDetails = (food: Foodoffers) => {
  const {
    fat_g,
    protein_g,
    saturated_fat_g,
    sugar_g,
    carbohydrate_g,
    calories_kcal,
    fiber_g,
    salt_g,
  } = food;

  return {
    fat_g,
    protein_g,
    saturated_fat_g,
    sugar_g,
    carbohydrate_g,
    calories_kcal,
    fiber_g,
    salt_g,
  };
};

const DEFAULT_LANGUAGE_CODE_GERMAN = 'de';
const FALLBACK_LANGUAGE_CODE_ENGLISH = 'en';
const MISSING_TRANSLATION = 'Missing translation';

export function getDirectusTranslation(
  params: any,
  translations: TranslationEntry[],
  field: string,
  ignoreFallbackLanguage?: boolean,
  fallback_text?: string | null
): string {
  const languageCode = params?.languageCode || FALLBACK_LANGUAGE_CODE_ENGLISH;

  const translationDict = translations.reduce((acc, translation) => {
    acc[translation.languages_code] = translation;
    return acc;
  }, {} as { [key: string]: TranslationEntry });

  const getTranslation = (
    dict: { [key: string]: TranslationEntry },
    langCode: string,
    params?: any
  ) => {
    const translationEntry = dict[langCode];
    if (!translationEntry) return null;

    let translation = translationEntry[field];
    if (params) {
      Object.keys(params).forEach((key) => {
        translation = StringHelper.replaceAll(
          translation,
          `%${key}`,
          params[key]
        );
      });
    }
    return translation;
  };

  // Try to get the translation for the requested language
  let translation = getTranslation(translationDict, languageCode, params);
  if (translation) return translation;

  // If not found, fallback to English (en)
  translation = getTranslation(
    translationDict,
    FALLBACK_LANGUAGE_CODE_ENGLISH,
    params
  );
  if (translation) return translation;

  // Optionally fallback to German (de) if needed
  if (!ignoreFallbackLanguage) {
    translation = getTranslation(
      translationDict,
      DEFAULT_LANGUAGE_CODE_GERMAN,
      params
    );
    if (translation) return translation;
  }

  // Return fallback text or "Missing translation" if nothing is found
  return fallback_text || `${MISSING_TRANSLATION}(${field})`;
}

const MAX_RATING = 5;
const MIN_RATING = 1;
const MINIMUM_RATING_AS_FAVORITE = (MAX_RATING + MIN_RATING) / 2;

export function isRatingPositive(rating: number | null | undefined): boolean {
  return (
    rating !== null &&
    rating !== undefined &&
    rating >= MINIMUM_RATING_AS_FAVORITE
  );
}

export function isRatingNegative(rating: number | null | undefined): boolean {
  return (
    rating !== null &&
    rating !== undefined &&
    rating < MINIMUM_RATING_AS_FAVORITE
  );
}

export function getFoodName(
  food: string | Foods | null | undefined,
  languageCode: string
) {
  if (typeof food === 'object' && food !== null) {
    const translations = food.translations as TranslationEntry[];
    const translation = getDirectusTranslation(
      { languageCode },
      translations,
      'name',
      false,
      food.alias
    );
    if (translation) {
      return translation.charAt(0).toUpperCase() + translation.slice(1);
    }
    if (food?.alias) {
      return food.alias.charAt(0).toUpperCase() + food.alias.slice(1);
    }
  }
  return null;
}

export const getNewsTranslationByLanguageCode = (
  translations: NewsTranslations[],
  languageCode: string
): any => {
  if (!translations || translations.length === 0) return '';

  const translation = translations?.find(
    (item) => item.languages_code?.toString().split('-')[0] === languageCode
  );

  if (translation) {
    return {
      title: translation.title,
      content: translation.content,
    };
  }
};

export const getBuildingTranslationByLanguageCode = (
  translations: BuildingsTranslations[],
  languageCode: string
) => {
  if (!translations || translations.length === 0) return '';

  const translation = translations?.find(
    (item) => item.languages_code?.toString().split('-')[0] === languageCode
  );

  if (translation?.content) {
    return translation?.content || '';
  }
};

export const getAppElementTranslation = (
  translations: any[],
  languageCode: string
): any => {
  if (!translations || translations.length === 0) return '';

  const translation = translations?.find(
    (item) => item.languages_code?.toString().split('-')[0] === languageCode
  );

  if (translation) {
    return {
      content: translation?.content || '',
      popup_button_text: translation.popup_button_text || '',
      popup_content: translation.popup_content || '',
    };
  }
};


export { getIconComponent, getTextFromTranslation, extractFoodDetails, getDescriptionFromTranslation };
