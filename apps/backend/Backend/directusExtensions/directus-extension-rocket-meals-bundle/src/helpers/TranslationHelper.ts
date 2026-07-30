import { PrimaryKey } from '@directus/types';
import { CollectionNames, DatabaseTypes, DeepCopyHelper, LanguageCodes, LanguageCodesType } from 'repo-depkit-common';

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

export class TranslationHelper {
  static readonly LANGUAGE_CODE_DE: LanguageCodesType = LanguageCodes.DE;
  static readonly LANGUAGE_CODE_EN: LanguageCodesType = LanguageCodes.EN;

  static readonly DefaultLanguage = TranslationHelper.LANGUAGE_CODE_DE;
  static readonly FallBackLanguage = TranslationHelper.LANGUAGE_CODE_EN;

  static getTranslation(translationsList: ExistingTranslation[], profileLanguage: string, fieldName: string) {
    translationsList = translationsList || [];
    let translation = translationsList.find(t => t.languages_code === profileLanguage);
    let translationDefault = translationsList.find(t => t.languages_code === TranslationHelper.DefaultLanguage);
    let translationFallBack = translationsList.find(t => t.languages_code === TranslationHelper.FallBackLanguage);
    return translation?.[fieldName] || translationDefault?.[fieldName] || translationFallBack?.[fieldName];
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
      const { updateObject, updateNeeded } = await TranslationHelper._getUpdateInformationForTranslations({
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
    fields: ['*', TranslationHelper.FIELD_FOR_TRANSLATION_FETCHING],
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
      ...TranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING,
    }); // Bottleneck HERE. Takes on average 1.0s
    return TranslationHelper.updateItemTranslationsForItemWithTranslationsFetched(itemWithTranslations, config);
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
         [TranslationHelper.]: {name ....},
         [TranslationHelper.]: {....}
         }
         */
    let createTranslations: NewTranslationForCreation[] = [];
    let updateTranslations: ExistingTranslation[] = [];
    let deleteTranslations: ExistingTranslation[] = [];

    let existingTranslations = itemWithTranslations?.translations || [];

    // find the existing language which is source for translations
    let defaultLanguageCodeForSourceTranslation: LanguageCodesType = TranslationHelper.LANGUAGE_CODE_DE;
    let usedLanguageCodeForSourceTranslation: LanguageCodesType = TranslationHelper._resolveSourceLanguageCodeForTranslations(existingTranslations, defaultLanguageCodeForSourceTranslation);

    const { existingTranslationsDifferentFromParsing } = TranslationHelper._collectUpdateTranslationsFromExisting(
      existingTranslations,
      translationsFromParsing,
      usedLanguageCodeForSourceTranslation,
      remaining_translationsFromParsing,
      updateTranslations
    );

    //check remaining translationsFromParsing, then put into createTranslations
    const newTranslationsFromParsing = TranslationHelper._collectCreateTranslationsFromRemaining({
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

        if (TranslationHelper.hasSignificantTranslationChange(existingTranslation, translationFromParsingCopy)) {
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
        be_source_for_translations: languageKey === TranslationHelper.LANGUAGE_CODE_DE,
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
    const parsedCreateList = TranslationHelper.getTranslationsCreateListForNewItem(translationsFromParsing);

    // The source entry of the new item (be_source_for_translations, e.g. German)
    const parsedSourceEntry = parsedCreateList.find(entry => entry.be_source_for_translations);
    const parsedSourceName = parsedSourceEntry?.name;
    if (!parsedSourceName) {
      return parsedCreateList;
    }

    for (const existingTranslationsCandidate of existingTranslationsCandidates) {
      const existingTranslations = existingTranslationsCandidate || [];
      if (existingTranslations.length === 0) {
        continue;
      }

      // The source translation of the candidate
      const existingSourceLanguageCode = TranslationHelper._resolveSourceLanguageCodeForTranslations(existingTranslations, TranslationHelper.DefaultLanguage);
      const existingSourceTranslation = existingTranslations.find(translation => translation.languages_code === existingSourceLanguageCode);
      if (!existingSourceTranslation || existingSourceTranslation.name !== parsedSourceName) {
        // Different source text -> this candidate does not fit
        continue;
      }

      const coveredLanguageCodes = new Set<string>();
      for (const parsedEntry of parsedCreateList) {
        const languagesCodeObject = parsedEntry[FIELD_TRANSLATION_LANGUAGE_CODE] as Record<string, string> | undefined;
        const languageCode = languagesCodeObject?.[FIELD_LANGUAGE_ID];
        if (languageCode) {
          coveredLanguageCodes.add(languageCode);
        }
      }

      // Copy all languages of the candidate which the parser did not provide
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

    return parsedCreateList;
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
          if (remaining_languageKey === TranslationHelper.LANGUAGE_CODE_DE) {
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
