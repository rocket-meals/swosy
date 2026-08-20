/**
 * ContentTranslationHelper.ts – the `*_translations` rows of a Directus item.
 *
 * This is content: meal names, news, form labels – written by editors or by an import parser,
 * stored per item in a related translations table and keyed by the full `languages.code`.
 * This helper reads and writes those rows; it never produces a translation itself.
 *
 * The two neighbours it is easy to confuse it with:
 * - `helpers/translations/` – the **static catalogue** of texts the server itself formulates
 *   (push notifications, generated documents). Shipped with the code, keyed by a translation key.
 * - `auto-translation-hook/` – the **machine translation** that fills the rows this helper
 *   manages, by sending the source text to DeepL.
 */

import { PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, DeepCopyHelper, isSameBaseLanguage, isSameLanguageCode, LanguageCodes, LanguageCodesType } from 'repo-depkit-common';

import { MyDatabaseHelper } from './MyDatabaseHelper';

const FIELD_TRANSLATION_LANGUAGE_CODE = 'languages_code';
const FIELD_LANGUAGE_ID = 'code';

export type ExistingTranslation = {
  be_source_for_translations?: boolean | null;
  id: PrimaryKey;
  languages_code?: string | DatabaseTypes.Languages | null;
  let_be_translated?: boolean | null;
  [key: string]: any;
};
type NewTranslationForCreation = Omit<ExistingTranslation, 'id'>;

export type TranslationBaseFields = {
  be_source_for_translations?: boolean | null;
  let_be_translated?: boolean | null;
};
export type TranslationDynamicFields = {
  [key: string]: string | boolean | null;
};
export type TranslationFields = TranslationBaseFields & TranslationDynamicFields;

export type TranslationsFromParsingType = {
  [key in LanguageCodesType]?: TranslationFields;
};

export type ItemWithExistingTranslations = {
  id: PrimaryKey;
  translations: ExistingTranslation[];
};

export const NonRelationFieldsArrayFieldId = 'id';
const NonRelationFieldsArray = [NonRelationFieldsArrayFieldId, 'be_source_for_translations', 'let_be_translated', 'languages_code', 'translation_settings'] as const;

type NonRelationFields = (typeof NonRelationFieldsArray)[number];

export type TranslationRelationField<E> = Exclude<keyof E, NonRelationFields> & string;

export type TranslationUpdateConfig<E extends ExistingTranslation> = {
  translationsFromParsing: TranslationsFromParsingType;
  items_primary_field_in_translation_table: TranslationRelationField<E>;
  itemsTablename: CollectionNames;
  myDatabaseHelper: MyDatabaseHelper;
};

export class ContentTranslationHelper {
  static readonly LANGUAGE_CODE_DE: LanguageCodesType = LanguageCodes.DE;
  static readonly LANGUAGE_CODE_EN: LanguageCodesType = LanguageCodes.EN;

  static readonly DefaultLanguage = ContentTranslationHelper.LANGUAGE_CODE_DE;
  static readonly FallBackLanguage = ContentTranslationHelper.LANGUAGE_CODE_EN;

  /**
   * The value of `fieldName` in the user's language, falling back to German and then English.
   *
   * Matching is case- and region-insensitive: `languages.code` is maintained by hand per customer
   * and a profile may hold the app's short code (`"de"`) while the translation rows use the full
   * one (`"de-DE"`). A strict string comparison silently dropped those users to the fallback
   * language. The exact code still wins over a mere same-language match, so a `"de-DE"` row is
   * preferred over a `"de-AT"` one.
   */
  static getTranslation(translationsList: ExistingTranslation[], profileLanguage: string, fieldName: string) {
    translationsList = translationsList || [];
    let translation = ContentTranslationHelper.findTranslationForLanguage(translationsList, profileLanguage);
    let translationDefault = ContentTranslationHelper.findTranslationForLanguage(translationsList, ContentTranslationHelper.DefaultLanguage);
    let translationFallBack = ContentTranslationHelper.findTranslationForLanguage(translationsList, ContentTranslationHelper.FallBackLanguage);
    return translation?.[fieldName] || translationDefault?.[fieldName] || translationFallBack?.[fieldName];
  }

  /** The translation row for a language code – the exact code if there is one, else same language. */
  static findTranslationForLanguage(translationsList: ExistingTranslation[], languageCode: string | null | undefined): ExistingTranslation | undefined {
    if (!languageCode) {
      return undefined;
    }
    const readCode = (translation: ExistingTranslation): string | undefined => {
      const code = translation?.[FIELD_TRANSLATION_LANGUAGE_CODE];
      return typeof code === 'string' ? code : (code as DatabaseTypes.Languages | undefined)?.code;
    };
    return translationsList.find(t => isSameLanguageCode(readCode(t), languageCode)) ?? translationsList.find(t => isSameBaseLanguage(readCode(t), languageCode));
  }

  static hasSignificantTranslationChange<E extends Record<string, any>>(existingTranslation: E, translationFromParsing: Partial<E>): boolean {
    for (const key in existingTranslation) {
      if (!existingTranslation.hasOwnProperty(key)) continue;

      // Skip keys that are in NonRelationFields
      if (NonRelationFieldsArray.includes(key as NonRelationFields)) {
        continue;
      }

      // Check if the key is present in translationFromParsing and if the values differ
      if (key in translationFromParsing && existingTranslation[key] !== translationFromParsing[key]) {
        return true;
      }
    }
    return false;
  }

  static async updateItemTranslationsForItemWithTranslationsFetched<
    T extends ItemWithExistingTranslations, // T must have an id and translations field
    E extends ExistingTranslation, // the collection of the related translations
  >(
    itemWithTranslations: T, // the item we want to update the translations for
    config: TranslationUpdateConfig<E>
  ) {
    const { translationsFromParsing, items_primary_field_in_translation_table, itemsTablename, myDatabaseHelper } = config;
    const specificItemServiceReader = myDatabaseHelper.getItemsServiceHelper<T>(itemsTablename);
    if (itemWithTranslations) {
      const { updateObject, updateNeeded } = await ContentTranslationHelper._getUpdateInformationForTranslations({
        itemWithTranslations,
        item: itemWithTranslations,
        translationsFromParsing,
        items_primary_field_in_translation_table,
      });

      if (updateNeeded) {
        //const createTranslations = updateObject.translations.create;
        //const updateTranslations = updateObject.translations.update;
        //const deleteTranslations = updateObject.translations.delete;
        // @ts-ignore
        //console.log("Update Translations for item with id: " + item?.id+ " - alias: "+item?.alias);
        //console.log("Update Translations: create (" + createTranslations.length + "), update (" + updateTranslations.length + "), delete (" + deleteTranslations.length + ")");
        //console.log("createTranslations: "+JSON.stringify(createTranslations, null, 2));
        //console.log("updateTranslations: "+JSON.stringify(updateTranslations, null, 2));
        //console.log("deleteTranslations: "+JSON.stringify(deleteTranslations, null, 2));
        //console.log(JSON.stringify(updateObject, null, 2));

        await specificItemServiceReader.updateOne(itemWithTranslations?.id, {
          id: itemWithTranslations?.id,
          ...updateObject,
        });
      }
    }
  }

  static readonly FIELD_FOR_TRANSLATION_FETCHING = 'translations.*';
  static readonly QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING = {
    fields: ['*', ContentTranslationHelper.FIELD_FOR_TRANSLATION_FETCHING],
  };

  /**
   * Updates the translations for a specific item.
   *
   * **Warning:** This function is resource-intensive and includes a bottleneck
   * during the item fetching phase. It takes approximately 1 second on average.
   * Consider using alternative methods if possible for better performance.
   * Prefer using `updateItemTranslationsForItemWithTranslationsFetched`
   * if you already have the item's data with translations fetched, as it avoids the
   * performance bottleneck.
   *
   * @deprecated This function has a known bottleneck and is slow. Avoid using it unless necessary.
   */
  static async updateItemTranslations<
    T extends ItemWithExistingTranslations, // T must have an id and translations field
    E extends ExistingTranslation, // the collection of the related translations
  >(
    item: T, // the item we want to update the translations for
    config: TranslationUpdateConfig<E>
  ) {
    const { itemsTablename, myDatabaseHelper } = config;
    const specificItemServiceReader = myDatabaseHelper.getItemsServiceHelper<T>(itemsTablename);
    let itemWithTranslations = await specificItemServiceReader.readOne(item?.id, {
      ...ContentTranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING,
    }); // Bottleneck HERE. Takes on average 1.0s
    return ContentTranslationHelper.updateItemTranslationsForItemWithTranslationsFetched(itemWithTranslations, config);
  }

  static async _getUpdateInformationForTranslations<
    T extends ItemWithExistingTranslations, // T must have an id and translations field
    E extends ExistingTranslation, // the collection of the related translations
  >(options: {
    itemWithTranslations: T; // the item we want to update the translations for
    item: T; // the item we want to update the translations for
    translationsFromParsing: TranslationsFromParsingType; // the translations we got from the parser
    items_primary_field_in_translation_table: TranslationRelationField<E>; // the primary field (to our item) in the translation table, e.g. "food_id" when translating foods
  }) {
    const { itemWithTranslations, item, translationsFromParsing, items_primary_field_in_translation_table } = options;
    /** translationsFromParsing is an object with the following structure:
         {
         [LanguageCodes.DE]: {
         name: "...",
         description: "...",
         ... (other fields)
         ... (be_source_for_translations, let_be_translated)
         }
         }
         */
    let remaining_translationsFromParsing = DeepCopyHelper.deepCopy(translationsFromParsing); //make a work copy
    /** remaining_translationsFromParsing is an object with the following structure:
         {
         [ContentTranslationHelper.]: {name ....},
         [ContentTranslationHelper.]: {....}
         }
         */
    let createTranslations: NewTranslationForCreation[] = [];
    let updateTranslations: ExistingTranslation[] = [];
    let deleteTranslations: ExistingTranslation[] = [];

    let existingTranslations = itemWithTranslations?.translations || [];

    // find the existing language which is source for translations
    let defaultLanguageCodeForSourceTranslation: LanguageCodesType = ContentTranslationHelper.LANGUAGE_CODE_DE;
    let usedLanguageCodeForSourceTranslation: LanguageCodesType = ContentTranslationHelper._resolveSourceLanguageCodeForTranslations(existingTranslations, defaultLanguageCodeForSourceTranslation);

    const { existingTranslationsDifferentFromParsing } = ContentTranslationHelper._collectUpdateTranslationsFromExisting(
      existingTranslations,
      translationsFromParsing,
      usedLanguageCodeForSourceTranslation,
      remaining_translationsFromParsing,
      updateTranslations
    );

    //check remaining translationsFromParsing, then put into createTranslations
    const newTranslationsFromParsing = ContentTranslationHelper._collectCreateTranslationsFromRemaining({
      remaining_translationsFromParsing,
      translationsFromParsing,
      items_primary_field_in_translation_table,
      item,
      createTranslations,
    });

    let updateObject = {
      translations: {
        create: createTranslations,
        update: updateTranslations,
        delete: deleteTranslations,
      },
    };

    let updateNeeded = existingTranslationsDifferentFromParsing || newTranslationsFromParsing;

    return {
      updateObject: updateObject,
      updateNeeded: updateNeeded,
    };
  }

  /**
   * Finds the language code of the existing translation that is marked as
   * `be_source_for_translations`. Falls back to the given default language code
   * when none is found or the found language code is not a string.
   */
  static _resolveSourceLanguageCodeForTranslations(existingTranslations: ExistingTranslation[], defaultLanguageCodeForSourceTranslation: LanguageCodesType): LanguageCodesType {
    let usedLanguageCodeForSourceTranslation: LanguageCodesType = defaultLanguageCodeForSourceTranslation;
    for (let existingTranslation of existingTranslations) {
      if (existingTranslation?.be_source_for_translations) {
        if (!existingTranslation?.languages_code || typeof existingTranslation?.languages_code !== 'string') {
          // if the language code is not a string, we use the default language code
        } else {
          usedLanguageCodeForSourceTranslation = existingTranslation?.languages_code as LanguageCodesType;
        }
      }
    }
    return usedLanguageCodeForSourceTranslation;
  }

  /**
   * Iterates over the existing translations and, for every one that also has a
   * translation from parsing, either pushes an update (when there is a significant
   * change) into `updateTranslations`, or does nothing (when the translation is
   * unchanged). For every existing translation whose language code was handled here
   * (whether updated or not, or not provided by the parser), the matching key is
   * removed from `remaining_translationsFromParsing` so it will not be treated as a
   * new translation later.
   *
   * Mutates `remaining_translationsFromParsing` and `updateTranslations` in place,
   * mirroring the original inline loop's behavior.
   */
  static _collectUpdateTranslationsFromExisting<E extends ExistingTranslation>(
    existingTranslations: ExistingTranslation[],
    translationsFromParsing: TranslationsFromParsingType,
    usedLanguageCodeForSourceTranslation: LanguageCodesType,
    remaining_translationsFromParsing: any, // kept as `any` since this function deletes keys from it in place
    updateTranslations: ExistingTranslation[]
  ): { existingTranslationsDifferentFromParsing: boolean } {
    let existingTranslationsDifferentFromParsing = false;

    for (let existingTranslation of existingTranslations) {
      //check all existing translations
      let existingLanguageCode = existingTranslation?.[FIELD_TRANSLATION_LANGUAGE_CODE];
      if (!existingLanguageCode || typeof existingLanguageCode !== 'string') {
        continue;
      }
      const existingLanguageCodeAsString = existingLanguageCode as LanguageCodesType;

      const translationFromParsing = translationsFromParsing[existingLanguageCodeAsString];
      if (translationFromParsing) {
        //we also got a translation from the parse
        /* Update translation */
        const translationFromParsingCopy = DeepCopyHelper.deepCopy(translationFromParsing); //make a copy
        delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language

        if (ContentTranslationHelper.hasSignificantTranslationChange(existingTranslation, translationFromParsingCopy)) {
          existingTranslationsDifferentFromParsing = true;
          //console.log("existingTranslation is different from parsing")
          //console.log("existingTranslation: "+JSON.stringify(existingTranslation, null, 2))
          //console.log("translationFromParsing: "+JSON.stringify(translationFromParsingCopy, null, 2))

          // be_source_for_translations if language Code is German
          let be_source_for_translations: boolean = false;
          if (existingLanguageCode === usedLanguageCodeForSourceTranslation) {
            be_source_for_translations = true;
          }

          updateTranslations.push({
            id: existingTranslation?.id,
            let_be_translated: false, // if we have a translation from the parser, we do not need to translate it
            be_source_for_translations: be_source_for_translations,
            ...translationFromParsingCopy,
            [FIELD_TRANSLATION_LANGUAGE_CODE]: {
              [FIELD_LANGUAGE_ID]: existingLanguageCode,
            },
          });
        } else {
          //translation is the same, do nothing
          //console.log("translation is the same, do nothing")
        }
      } else {
        //the parser dont provide a translation, we should delete it?
        delete remaining_translationsFromParsing[existingLanguageCode]; // dont create a new translation for this language
      }
    }

    return { existingTranslationsDifferentFromParsing };
  }

  /**
   * Builds the list of translation objects for a nested create on a brand-new item
   * (e.g. creating a foodoffer together with its translations in one request).
   * The relation field to the parent item is omitted, as Directus sets it automatically
   * for nested creates.
   */
  static getTranslationsCreateListForNewItem(translationsFromParsing: TranslationsFromParsingType): NewTranslationForCreation[] {
    const createTranslations: NewTranslationForCreation[] = [];
    const languageKeys = Object.keys(translationsFromParsing) as LanguageCodesType[];
    for (const languageKey of languageKeys) {
      const translationFromParsing = translationsFromParsing[languageKey];
      if (!translationFromParsing) {
        continue;
      }
      createTranslations.push({
        be_source_for_translations: languageKey === ContentTranslationHelper.LANGUAGE_CODE_DE,
        let_be_translated: false, // if we have a translation from the parser, we dont need to translate it
        ...translationFromParsing,
        [FIELD_TRANSLATION_LANGUAGE_CODE]: {
          [FIELD_LANGUAGE_ID]: languageKey,
        },
      });
    }
    return createTranslations;
  }

  /**
   * Builds the nested-create translation list for a new item, additionally reusing
   * already existing translations when the source translation text matches. The
   * candidates are tried in order (e.g. first the food's translations, then the
   * translations of an already existing foodoffer with the same name) and the first
   * candidate whose source translation matches is used.
   *
   * Reused translations are created with `let_be_translated: false`, so the
   * auto-translation hook does not machine-translate the same text again for every
   * new item (keeps translation costs down). When no candidate matches, only the
   * parsed translations are returned and the remaining languages are left to the
   * auto-translation hook as usual.
   *
   * Only the given `fieldsToReuse` (e.g. ['name']) are copied from the existing
   * translations, since the source collection may have more fields than the target
   * translation collection.
   */
  static getTranslationsCreateListForNewItemReusingExistingTranslations(
    translationsFromParsing: TranslationsFromParsingType,
    existingTranslationsCandidates: (ExistingTranslation[] | null | undefined)[],
    fieldsToReuse: string[]
  ): NewTranslationForCreation[] {
    const parsedCreateList = ContentTranslationHelper.getTranslationsCreateListForNewItem(translationsFromParsing);

    // The source entry of the new item (be_source_for_translations, e.g. German)
    const parsedSourceEntry = parsedCreateList.find(entry => entry.be_source_for_translations);
    const parsedSourceName = parsedSourceEntry?.name;
    if (!parsedSourceName) {
      return parsedCreateList;
    }

    for (const existingTranslationsCandidate of existingTranslationsCandidates) {
      const existingTranslations = existingTranslationsCandidate || [];
      if (!ContentTranslationHelper._candidateMatchesSourceName(existingTranslations, parsedSourceName)) {
        // Empty candidate, or a different source text -> this candidate does not fit
        continue;
      }
      return ContentTranslationHelper._mergeReusableTranslations(parsedCreateList, existingTranslations, fieldsToReuse);
    }

    return parsedCreateList;
  }

  /**
   * Whether the candidate's own source translation (e.g. German) has exactly the
   * source name the parser produced - only then may its translations be reused.
   */
  static _candidateMatchesSourceName(existingTranslations: ExistingTranslation[], parsedSourceName: string): boolean {
    if (existingTranslations.length === 0) {
      return false;
    }
    const existingSourceLanguageCode = ContentTranslationHelper._resolveSourceLanguageCodeForTranslations(existingTranslations, ContentTranslationHelper.DefaultLanguage);
    const existingSourceTranslation = existingTranslations.find(translation => translation.languages_code === existingSourceLanguageCode);
    return !!existingSourceTranslation && existingSourceTranslation.name === parsedSourceName;
  }

  /** The language codes the parsed create list already covers. */
  static _getCoveredLanguageCodes(parsedCreateList: NewTranslationForCreation[]): Set<string> {
    const coveredLanguageCodes = new Set<string>();
    for (const parsedEntry of parsedCreateList) {
      const languagesCodeObject = parsedEntry[FIELD_TRANSLATION_LANGUAGE_CODE] as Record<string, string> | undefined;
      const languageCode = languagesCodeObject?.[FIELD_LANGUAGE_ID];
      if (languageCode) {
        coveredLanguageCodes.add(languageCode);
      }
    }
    return coveredLanguageCodes;
  }

  /**
   * The parsed create list plus every language of the matching candidate the
   * parser did not provide, copied with `let_be_translated: false` so the
   * auto-translation hook does not machine-translate the same text again.
   */
  static _mergeReusableTranslations(
    parsedCreateList: NewTranslationForCreation[],
    existingTranslations: ExistingTranslation[],
    fieldsToReuse: string[]
  ): NewTranslationForCreation[] {
    const coveredLanguageCodes = ContentTranslationHelper._getCoveredLanguageCodes(parsedCreateList);
    const createList: NewTranslationForCreation[] = [...parsedCreateList];
    for (const existingTranslation of existingTranslations) {
      const languageCode = existingTranslation.languages_code;
      if (!languageCode || typeof languageCode !== 'string' || coveredLanguageCodes.has(languageCode)) {
        continue;
      }
      const reusedFields: Record<string, any> = {};
      for (const fieldToReuse of fieldsToReuse) {
        reusedFields[fieldToReuse] = existingTranslation[fieldToReuse] ?? null;
      }
      createList.push({
        ...reusedFields,
        be_source_for_translations: false,
        let_be_translated: false, // reused translation, do not machine-translate again
        [FIELD_TRANSLATION_LANGUAGE_CODE]: {
          [FIELD_LANGUAGE_ID]: languageCode,
        },
      });
      coveredLanguageCodes.add(languageCode);
    }
    return createList;
  }

  /**
   * Iterates over the language keys still remaining in `remaining_translationsFromParsing`
   * (i.e. languages from parsing that were not matched to an existing translation) and
   * pushes a create-object for each one into `createTranslations`. Returns whether any
   * new translation was found.
   *
   * Mutates `createTranslations` in place, mirroring the original inline loop's behavior.
   */
  static _collectCreateTranslationsFromRemaining<T extends ItemWithExistingTranslations, E extends ExistingTranslation>(options: {
    remaining_translationsFromParsing: TranslationsFromParsingType;
    translationsFromParsing: TranslationsFromParsingType;
    items_primary_field_in_translation_table: TranslationRelationField<E>;
    item: T;
    createTranslations: NewTranslationForCreation[];
  }): boolean {
    const { remaining_translationsFromParsing, translationsFromParsing, items_primary_field_in_translation_table, item, createTranslations } = options;
    let newTranslationsFromParsing = false;

    let remaining_languageKeys = Object.keys(remaining_translationsFromParsing);
    for (let i = 0; i < remaining_languageKeys?.length; i++) {
      let remaining_languageKey = remaining_languageKeys[i] as LanguageCodesType | undefined;
      if (remaining_languageKey) {
        let translationFromParsing = translationsFromParsing[remaining_languageKey];
        if (translationFromParsing) {
          newTranslationsFromParsing = true;

          // be_source_for_translations if language Code is German
          let be_source_for_translations: boolean = false;
          if (remaining_languageKey === ContentTranslationHelper.LANGUAGE_CODE_DE) {
            be_source_for_translations = true;
          }

          createTranslations.push({
            [items_primary_field_in_translation_table]: item?.id,
            be_source_for_translations: be_source_for_translations,
            let_be_translated: false, // if we have a translation from the parser, we dont need to translate it
            ...translationFromParsing,
            [FIELD_TRANSLATION_LANGUAGE_CODE]: {
              [FIELD_LANGUAGE_ID]: remaining_languageKey,
            },
          });
        }
      }
    }

    return newTranslationsFromParsing;
  }
}
