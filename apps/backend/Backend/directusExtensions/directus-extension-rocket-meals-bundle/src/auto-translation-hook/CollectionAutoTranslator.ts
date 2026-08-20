/**
 * CollectionAutoTranslator.ts – runs the machine translation over one Directus collection.
 *
 * Takes the source translation of an item, asks the {@link AutoTranslator} for every language the
 * `languages` collection lists, and turns the result into the create/update actions for the
 * item's `*_translations` rows.
 */

import { AutoTranslator } from './AutoTranslator';
import { AutoTranslatorSettings } from './AutoTranslatorSettings';
import { CollectionNames, DatabaseTypes, DeepCopyHelper } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { SchemaOverview } from '@directus/types';
import {SchemaHelper} from "../helpers/SchemaHelper";

export type TranslationSchemaContext = {
  schema: SchemaOverview;
  collectionName: string;
  translation_field: string;
};

export type TranslationEntryOptions = {
  isSourceTranslation: boolean;
  sourceTranslation: any;
  language_code: string;
  autoTranslator: AutoTranslator;
  autoTranslatorSettings: AutoTranslatorSettings;
  fieldsToTranslate: string[];
  FIELD_LANGUAGES_ID_OR_CODE: string;
  context: TranslationSchemaContext;
};

export class CollectionAutoTranslator {
  static readonly FIELD_BE_SOURCE_FOR_TRANSLATION = 'be_source_for_translations';
  static readonly FIELD_LET_BE_TRANSLATED = 'let_be_translated';

  static readonly FIELD_LANGUAGES_ID_OR_CODE_NEW = 'languages_id';
  static readonly FIELD_LANGUAGES_CODE_OLD = 'languages_code';

  static readonly COLLECTION_LANGUAGES = CollectionNames.LANGUAGES;

  /**
   * We only need to translate if there are translations to translate
   * Therefore check if there are new translations to create
   * or if there are translations to update
   */
  static areTranslationsToTranslate(payload: any, translation_field: string) {
    if (payload?.[translation_field]) {
      let newTranslationsActions = payload?.[translation_field] || {};
      let newTranslationsCreateActions = newTranslationsActions?.create || [];
      let newTranslationsUpdateActions = newTranslationsActions?.update || [];
      return newTranslationsCreateActions.length > 0 || newTranslationsUpdateActions.length > 0;
    }
    return false;
  }

  static getSourceTranslationFromTranslations(translations: any, context: TranslationSchemaContext) {
    if (translations && translations.length > 0) {
      for (const translation of translations) {
        const let_be_source_for_translation = CollectionAutoTranslator.getValueFromPayloadOrDefaultValue(translation, CollectionAutoTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION, context);
        if (let_be_source_for_translation) {
          return translation;
        }
      }
    }
  }

  static getSourceTranslationFromListsOfTranslations(listsOfTranslations: any, context: TranslationSchemaContext) {
    if (listsOfTranslations && listsOfTranslations.length > 0) {
      for (const translations of listsOfTranslations) {
        const sourceTranslation = CollectionAutoTranslator.getSourceTranslationFromTranslations(translations, context);
        if (sourceTranslation) {
          return sourceTranslation;
        }
      }
    }
    return null;
  }

  /**
   * This is due to a change from languages_code to languages_ids newer than directus 9.20.1 (or mayer much newer like 10)
   * therefore we identify which field is used and set it accordingly
   * @param translation
   */
  static detectLanguagesIdOrCodeField(translation: any): string | undefined {
    const translationFieldOld = translation?.[CollectionAutoTranslator.FIELD_LANGUAGES_CODE_OLD];
    if (translationFieldOld) {
      return CollectionAutoTranslator.FIELD_LANGUAGES_CODE_OLD;
    }
    const translationFieldNew = translation?.[CollectionAutoTranslator.FIELD_LANGUAGES_ID_OR_CODE_NEW];
    if (translationFieldNew) {
      return CollectionAutoTranslator.FIELD_LANGUAGES_ID_OR_CODE_NEW;
    }
    return undefined;
  }

  static parseTranslationListToLanguagesCodeDict(translations: any) {
    let languagesCodeDict: any = {};
    for (let translation of translations) {
      const FIELD_LANGUAGES_ID_OR_CODE = CollectionAutoTranslator.detectLanguagesIdOrCodeField(translation);
      if (FIELD_LANGUAGES_ID_OR_CODE) {
        const languageCode = CollectionAutoTranslator.extractLanguageCode(translation?.[FIELD_LANGUAGES_ID_OR_CODE]);
        if (languageCode) {
          languagesCodeDict[languageCode] = translation;
        }
      }
    }
    return languagesCodeDict;
  }

  static async modifyPayloadForTranslation(currentItem: any, payload: any, autoTranslator: AutoTranslator, autoTranslatorSettings: AutoTranslatorSettings, myDatabaseHelper: MyDatabaseHelper, collectionName: string, translation_field: string) {
    if (!CollectionAutoTranslator.areTranslationsToTranslate(payload, translation_field)) {
      return payload;
    }

    const workPayload = DeepCopyHelper.deepCopy(payload);
    const schema = await myDatabaseHelper.getSchema();
    const context: TranslationSchemaContext = { schema, collectionName, translation_field };

    const currentTranslations = currentItem?.[translation_field] || [];
    const existingTranslations = CollectionAutoTranslator.buildExistingTranslationsMap(currentTranslations);

    const newTranslationsActions = workPayload?.[translation_field] || {};
    const newTranslationsCreateActions = newTranslationsActions?.create || [];
    const newTranslationsUpdateActions = newTranslationsActions?.update || [];

    const newTranslationsCreateLanguageDict = CollectionAutoTranslator.parseTranslationListToLanguagesCodeDict(newTranslationsCreateActions);
    const newTranslationsUpdateLanguageDict = CollectionAutoTranslator.parseTranslationListToLanguagesCodeDict(newTranslationsUpdateActions);

    const sourceTranslationInPayload = CollectionAutoTranslator.getSourceTranslationFromListsOfTranslations([newTranslationsCreateActions, newTranslationsUpdateActions], context);
    const sourceTranslationInExistingItem = CollectionAutoTranslator.getSourceTranslationFromListsOfTranslations([currentTranslations], context);
    const sourceTranslation = sourceTranslationInPayload || sourceTranslationInExistingItem;

    if (!sourceTranslation) {
      return payload;
    }

    const FIELD_LANGUAGES_ID_OR_CODE = CollectionAutoTranslator.detectLanguagesIdOrCodeField(sourceTranslation);
    if (!FIELD_LANGUAGES_ID_OR_CODE) {
      return payload;
    }

    const sourceTranslationLanguageCode = CollectionAutoTranslator.extractLanguageCode(sourceTranslation?.[FIELD_LANGUAGES_ID_OR_CODE]);

    const languagesService = myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Languages>(CollectionAutoTranslator.COLLECTION_LANGUAGES);
    const languages = await languagesService.readByQuery({});
    if (languages.length === 0) {
      return payload;
    }

    const fieldsToTranslate = CollectionAutoTranslator.getFieldsToTranslate(context);
    const translationsToCreate = [];
    const translationsToUpdate = [];
    const translationsToDelete: any[] = [];

    for (const language of languages) {
      const language_code = language?.code;
      const existingTranslation = existingTranslations[language_code];
      const isSourceTranslation = language_code === sourceTranslationLanguageCode;

      const entryOptions: TranslationEntryOptions = {
        isSourceTranslation,
        sourceTranslation,
        language_code,
        autoTranslator,
        autoTranslatorSettings,
        fieldsToTranslate,
        FIELD_LANGUAGES_ID_OR_CODE,
        context,
      };

      if (existingTranslation) {
        const updateEntry = await CollectionAutoTranslator.buildUpdateEntry(
          entryOptions, existingTranslation, newTranslationsUpdateLanguageDict
        );
        if (updateEntry) {
          translationsToUpdate.push(updateEntry);
        }
      } else {
        const createEntry = await CollectionAutoTranslator.buildCreateEntry(
          entryOptions, newTranslationsCreateLanguageDict
        );
        if (createEntry) {
          translationsToCreate.push(createEntry);
        }
      }
    }

    payload[translation_field] = {
      create: translationsToCreate,
      update: translationsToUpdate,
      delete: translationsToDelete,
    };
    return payload;
  }

  private static buildExistingTranslationsMap(currentTranslations: any[]): Record<string, any> {
    const existingTranslations: Record<string, any> = {};
    for (const translation of currentTranslations) {
      const field = CollectionAutoTranslator.detectLanguagesIdOrCodeField(translation);
      if (field) {
        const languageCode = CollectionAutoTranslator.extractLanguageCode(translation?.[field]);
        if (languageCode) {
          existingTranslations[languageCode] = translation;
        }
      }
    }
    return existingTranslations;
  }

  private static async buildUpdateEntry(
    options: TranslationEntryOptions,
    existingTranslation: any,
    newTranslationsUpdateLanguageDict: Record<string, any>
  ): Promise<any> {
    const { isSourceTranslation, sourceTranslation, language_code, context } = options;
    if (isSourceTranslation) {
      return { ...sourceTranslation };
    }

    const translationInPayload = newTranslationsUpdateLanguageDict[language_code];
    const letBeTranslatedInExisting = existingTranslation?.[CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED];
    let createTranslation = letBeTranslatedInExisting;
    const letBeTranslatedInPayload = CollectionAutoTranslator.getValueFromPayloadOrDefaultValue(translationInPayload, CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED, context);
    if (CollectionAutoTranslator.isValueDefined(letBeTranslatedInPayload)) {
      createTranslation = letBeTranslatedInPayload;
    }

    if (createTranslation) {
      const translatedItem = await CollectionAutoTranslator.translateTranslationItem(options);
      return { ...existingTranslation, ...translatedItem };
    } else if (translationInPayload) {
      return {
        ...translationInPayload,
        [CollectionAutoTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION]: false,
      };
    }

    return null;
  }

  private static async buildCreateEntry(
    options: TranslationEntryOptions,
    newTranslationsCreateLanguageDict: Record<string, any>
  ): Promise<any> {
    const { isSourceTranslation, sourceTranslation, language_code, context } = options;
    if (isSourceTranslation) {
      return {
        ...sourceTranslation,
        [CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED]: CollectionAutoTranslator.getValueFromPayloadOrDefaultValue(sourceTranslation, CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED, context),
        [CollectionAutoTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION]: true,
      };
    }

    const translationInPayload = newTranslationsCreateLanguageDict[language_code];
    const letBeTranslatedInPayload = CollectionAutoTranslator.getValueFromPayloadOrDefaultValue(translationInPayload, CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED, context);
    let letBeTranslated = true; //only if the user explicitly set it to false, we don't create the translation
    if (CollectionAutoTranslator.isValueDefined(letBeTranslatedInPayload)) {
      letBeTranslated = letBeTranslatedInPayload;
    }

    if (letBeTranslated) {
      const translatedItem = await CollectionAutoTranslator.translateTranslationItem(options);
      return { ...translatedItem };
    } else if (translationInPayload) {
      return {
        ...translationInPayload,
        [CollectionAutoTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION]: false,
      };
    }

    return null;
  }

  static isValueDefined(value: any) {
    return value !== undefined && value !== null;
  }

  static getValueFromPayloadOrDefaultValue(payloadItem: any, fieldName: string, context: TranslationSchemaContext) {
    let translationCollectionSchema = CollectionAutoTranslator.getTranslationCollectionSchema(context);

    let valueInPayload = payloadItem?.[fieldName];
    if (CollectionAutoTranslator.isValueDefined(valueInPayload)) {
      //if payload has false or true, overwrite existing value
      return valueInPayload;
    } else {
      //nothing found? use the default value
      let defaultValue = translationCollectionSchema?.fields?.[fieldName]?.defaultValue;
      return defaultValue;
    }
  }

  /**
   * Extracts the language code string from a language field value,
   * which can be either a string (e.g., "de-DE") or an object (e.g., {code: "de-DE"}).
   */
  static extractLanguageCode(languageFieldValue: any): string | undefined {
    if (typeof languageFieldValue === 'string') {
      return languageFieldValue;
    } else if (languageFieldValue && typeof languageFieldValue === 'object' && 'code' in languageFieldValue) {
      return languageFieldValue.code;
    }
    return undefined;
  }

  /**
   * Translates each field in fieldsToTranslate from sourceTranslation using the given autoTranslator,
   * for the given destination language_code. Logs and skips fields that fail to translate.
   */
  private static async translateFields(options: {
    autoTranslator: AutoTranslator;
    fieldsToTranslate: string[];
    sourceTranslation: any;
    sourceLanguageCode: string | undefined;
    language_code: string;
  }): Promise<any> {
    const { autoTranslator, fieldsToTranslate, sourceTranslation, sourceLanguageCode, language_code } = options;
    const translatedItem: any = {};
    for (const field of fieldsToTranslate) {
      const fieldValue = sourceTranslation[field];
      if (fieldValue) {
        try {
          const translatedValue = await autoTranslator.translate({ text: fieldValue, source_language: sourceLanguageCode, destination_language: language_code });
          if (translatedValue) {
            translatedItem[field] = translatedValue;
          }
        } catch (err) {
          console.error('Translation error for field "' + field + '" to language "' + language_code + '":', err);
        }
      }
    }
    return translatedItem;
  }

  static async translateTranslationItem(options: TranslationEntryOptions) {
    const { sourceTranslation, language_code, autoTranslator, fieldsToTranslate, FIELD_LANGUAGES_ID_OR_CODE } = options;
    let translatedItem: any = {};
    if (fieldsToTranslate && fieldsToTranslate.length > 0) {
      const sourceLanguageCode = CollectionAutoTranslator.extractLanguageCode(sourceTranslation?.[FIELD_LANGUAGES_ID_OR_CODE]);
      if (!autoTranslator.isReady()) {
        console.warn('AutoTranslator is not ready - skipping translation for language: ' + language_code);
        // Skip translation attempts since autoTranslator cannot translate
      } else {
        translatedItem = await CollectionAutoTranslator.translateFields({autoTranslator, fieldsToTranslate, sourceTranslation, sourceLanguageCode, language_code});
      }
    }

    translatedItem[FIELD_LANGUAGES_ID_OR_CODE] = {
      code: language_code,
    };
    translatedItem[CollectionAutoTranslator.FIELD_LET_BE_TRANSLATED] = true; //if we create a translation, we want it in the future also
    translatedItem[CollectionAutoTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION] = false; //if translated it wont be the source translation anymore
    return translatedItem;
  }

  static getTranslationCollectionName(context: TranslationSchemaContext): string | null {
    const { schema, collectionName, translation_field } = context;

    const relations = schema?.relations || [];

    for (const relation of relations) {
      if (relation?.related_collection === collectionName) {
        const meta = relation?.meta;
        const metaOneCollection = meta?.one_collection;
        const metaOneField = meta?.one_field;
        const collectionOfTranslation = relation?.collection;
        if (metaOneCollection === collectionName && metaOneField === translation_field) {
          return collectionOfTranslation;
        }
      }
    }

    return null;
  }

  static getSchemaForCollection(schema: SchemaOverview, collectionName: string) {
    return SchemaHelper.getSchemaForCollection(schema, collectionName);
  }

  static getTranslationCollectionSchema(context: TranslationSchemaContext) {
    const { schema } = context;
    let translationCollectionName = CollectionAutoTranslator.getTranslationCollectionName(context);
    if (!translationCollectionName) {
      return null;
    }
    let collectionInformations = CollectionAutoTranslator.getSchemaForCollection(schema, translationCollectionName);
    return collectionInformations;
  }

  /**
   * Gets a list of all fields that are translatable
   * Only watches for text and string
   * Ignores the primary key field
   * Ignores fields that are relations
   */
  static getFieldsToTranslate(context: TranslationSchemaContext) {
    const { schema } = context;
    const translationCollectionInformations = CollectionAutoTranslator.getTranslationCollectionSchema(context);
    const collectionFieldsInformationsDict = translationCollectionInformations?.fields || {};

    const collectionFields = Object.keys(collectionFieldsInformationsDict);

    const primaryFieldKey = translationCollectionInformations?.primary || 'id'; //we need to know the primary field key

    const translationCollectionName = CollectionAutoTranslator.getTranslationCollectionName(context);

    const fieldsToTranslateDict: any = {};
    for (const field of collectionFields) {
      if (field !== primaryFieldKey) {
        const fieldsInformation = collectionFieldsInformationsDict[field];
        // we only translate fields of type string and text
        if (fieldsInformation?.type === 'text' || fieldsInformation?.type === 'string') {
          fieldsToTranslateDict[field] = true;
        }
      }
    }

    // remove relation fields that belong to the translation collection from translation candidates
    const relations = schema?.relations || [];
    for (const relation of relations) {
      if (relation?.collection === translationCollectionName) {
        delete fieldsToTranslateDict[relation?.field];
      }
    }

    return Object.keys(fieldsToTranslateDict);
  }
}
