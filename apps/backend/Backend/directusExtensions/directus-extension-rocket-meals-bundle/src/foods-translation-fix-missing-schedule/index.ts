import {WorkflowScheduler} from '../workflows-runs-hook';
import {SingleWorkflowRun} from '../workflows-runs-hook/WorkflowRunJobInterface';
import {CollectionNames, DatabaseTypes} from 'repo-depkit-common';
import {WORKFLOW_RUN_STATE} from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {WorkflowRunContext} from '../helpers/WorkflowRunContext';
import {MyDefineHook} from '../helpers/MyDefineHook';
import {Translator} from '../auto-translation-hook/Translator';
import {TranslatorSettings} from '../auto-translation-hook/TranslatorSettings';
import {DirectusCollectionTranslator} from '../auto-translation-hook/DirectusCollectionTranslator';
import type {Filter} from '@directus/types';

const SCHEDULE_NAME = 'foods-translation-fix-missing-schedule';
const WORKFLOW_ID = 'foods-translation-fix-missing';

/** Maximum number of individual (translation × field) operations to attempt in one run. */
const MAX_TRANSLATIONS = 1000;

/** Limit for each DB query fetching candidate foods. */
const FETCH_LIMIT = 5000;

const TEST_SOURCE_TEXT = 'Dies ist ein Test';
const TEST_SOURCE_LANGUAGE = 'de-DE';

/**
 * Language prefixes (first segment before "-") that DeepL supports as target languages.
 * Used to provide a helpful explanation when translate() returns null/undefined.
 */
const DEEPL_SUPPORTED_TARGET_PREFIXES = new Set([
  'bg', 'cs', 'da', 'de', 'el', 'en', 'es', 'et', 'fi', 'fr',
  'hu', 'id', 'it', 'ja', 'lt', 'lv', 'nl', 'pl', 'pt', 'ro',
  'ru', 'sk', 'sl', 'sv', 'tr', 'zh',
]);

function getTranslationNullReason(languageCode: string): string {
  const prefix = (languageCode.split('-')[0] ?? languageCode).toLowerCase();
  if (!DEEPL_SUPPORTED_TARGET_PREFIXES.has(prefix)) {
    return (
      'DeepL does not support the language prefix "' + prefix + '" (from "' + languageCode + '"). ' +
      'Supported prefixes: ' + [...DEEPL_SUPPORTED_TARGET_PREFIXES].sort().join(', ') + '.'
    );
  }
  return (
    'Unknown reason - check server console logs for DeepL API errors. ' +
    'Possible causes: API character quota exceeded, network error, or unsupported language variant "' + languageCode + '".'
  );
}

class FoodsTranslationFixMissingWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting foods translation fix for missing translations');

    try {
      const translatorSettings = new TranslatorSettings(context.myDatabaseHelper);
      const translator = new Translator(translatorSettings, context.myDatabaseHelper);
      await translator.init();

      if (!translator.isReady()) {
        await context.logger.appendLog(
          'Translator is not ready. Please check that the AUTO_TRANSLATE_API_KEY environment variable is set and valid. Aborting.'
        );
        return context.logger.getFinalLogWithStateAndParams({state: WORKFLOW_RUN_STATE.FAILED});
      }

      const autoTranslateEnabled = await translatorSettings.isAutoTranslationEnabled();
      if (!autoTranslateEnabled) {
        await context.logger.appendLog('Auto-translation is not enabled. Aborting.');
        return context.logger.getFinalLogWithStateAndParams({state: WORKFLOW_RUN_STATE.SUCCESS});
      }

      // Run a test translation of a known German phrase into every backend language so we can
      // verify connectivity and detect unsupported languages before doing real work.
      await this.runTranslationTest(translator, context);

      const foodsHelper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Foods>(CollectionNames.FOODS);

      // Phase 1 – foods that have at least one translation with a missing name.
      // Phase 2 – foods that have at least one translation with a missing description
      //           but are NOT already in phase 1 (to avoid double-processing).
      const filterMissingName: Filter = {translations: {name: {_null: true}}};
      const filterMissingDescription: Filter = {translations: {description: {_null: true}}};

      const [foodsWithMissingName, foodsWithMissingDescription] = await Promise.all([
        foodsHelper.readByQuery({filter: filterMissingName, fields: ['id', 'translations.*'], limit: FETCH_LIMIT}),
        foodsHelper.readByQuery({filter: filterMissingDescription, fields: ['id', 'translations.*'], limit: FETCH_LIMIT}),
      ]);

      const phase1Ids = new Set(foodsWithMissingName.map(f => f.id));
      const foodsWithMissingDescOnly = foodsWithMissingDescription.filter(f => !phase1Ids.has(f.id));

      await context.logger.appendLog(
        'Phase 1 (missing name): ' + foodsWithMissingName.length + ' food(s). ' +
        'Phase 2 (missing description only): ' + foodsWithMissingDescOnly.length + ' food(s).'
      );

      // Process name-missing foods first, then description-missing ones.
      const allFoodsOrdered = [...foodsWithMissingName, ...foodsWithMissingDescOnly];

      if (allFoodsOrdered.length === 0) {
        await context.logger.appendLog('No foods with missing translations found.');
        return context.logger.getFinalLogWithStateAndParams({state: WORKFLOW_RUN_STATE.SUCCESS});
      }

      const schema = await context.myDatabaseHelper.getSchema();
      const schemaContext = {
        schema,
        collectionName: CollectionNames.FOODS,
        translation_field: 'translations',
      };

      let totalAttempted = 0;
      let totalFixed = 0;
      let processedFoods = 0;

      for (const food of allFoodsOrdered) {
        if (totalAttempted >= MAX_TRANSLATIONS) {
          await context.logger.appendLog(
            'Reached the maximum of ' + MAX_TRANSLATIONS + ' translation operation(s). Stopping.'
          );
          break;
        }

        try {
          await context.logger.appendLog(
            'Processing food ' + (processedFoods + 1) + '/' + allFoodsOrdered.length + ' (id=' + food.id + ')…'
          );
          const result = await this.fixTranslationsForFood(
            food, translator, schemaContext, context, MAX_TRANSLATIONS - totalAttempted
          );
          totalFixed += result.fixed;
          totalAttempted += result.attempted;
          processedFoods++;
        } catch (err: any) {
          await context.logger.appendLog('Error processing food ' + food.id + ': ' + err.toString());
          processedFoods++;
        }
      }

      await context.logger.appendLog(
        'Completed. Processed ' + processedFoods + ' food(s), ' +
        'attempted ' + totalAttempted + ' translation operation(s), ' +
        'fixed ' + totalFixed + ' translation(s).'
      );

      return context.logger.getFinalLogWithStateAndParams({state: WORKFLOW_RUN_STATE.SUCCESS});
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({state: WORKFLOW_RUN_STATE.FAILED});
    }
  }

  /**
   * Translates the hard-coded test phrase into every language defined in the backend.
   * This runs before the real work so the log clearly shows which languages work and which don't.
   */
  private async runTranslationTest(translator: Translator, context: WorkflowRunContext): Promise<void> {
    const languagesHelper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Languages>(
      CollectionNames.LANGUAGES
    );
    const languages = await languagesHelper.readByQuery({});

    await context.logger.appendLog(
      '=== Translation test: "' + TEST_SOURCE_TEXT + '" (' + TEST_SOURCE_LANGUAGE + ') → ' +
      languages.length + ' language(s) ==='
    );

    for (const language of languages) {
      const languageCode = language.code;
      if (!languageCode) {
        await context.logger.appendLog('Test: skipped language without code.');
        continue;
      }
      if (languageCode === TEST_SOURCE_LANGUAGE) {
        await context.logger.appendLog('Test [' + languageCode + ']: skipped (source language).');
        continue;
      }
      try {
        const result = await translator.translate({
          text: TEST_SOURCE_TEXT,
          source_language: TEST_SOURCE_LANGUAGE,
          destination_language: languageCode,
        });
        if (result) {
          await context.logger.appendLog('Test [' + languageCode + ']: "' + result + '"');
        } else {
          await context.logger.appendLog(
            'Test [' + languageCode + ']: null/undefined – ' + getTranslationNullReason(languageCode)
          );
        }
      } catch (err: any) {
        await context.logger.appendLog('Test [' + languageCode + ']: ERROR – ' + err.toString());
      }
    }

    await context.logger.appendLog('=== Translation test complete ===');
  }

  /**
   * Attempts to fill in all missing translatable fields for every translation entry of a single food
   * that has `let_be_translated !== false` and is not the source translation.
   *
   * @param remainingCapacity - How many (translation × field) operations are still allowed.
   * @returns `{ fixed, attempted }` – number of DB rows updated and number of API calls made.
   */
  private async fixTranslationsForFood(
    food: DatabaseTypes.Foods,
    translator: Translator,
    schemaContext: {schema: any; collectionName: string; translation_field: string},
    context: WorkflowRunContext,
    remainingCapacity: number,
  ): Promise<{fixed: number; attempted: number}> {
    const translations = food.translations as DatabaseTypes.FoodsTranslations[];
    if (!translations || translations.length === 0) {
      await context.logger.appendLog('Food ' + food.id + ': Skipped – no translations found.');
      return {fixed: 0, attempted: 0};
    }

    await context.logger.appendLog('Food ' + food.id + ': Found ' + translations.length + ' translation(s).');

    // Find the source translation.
    const sourceTranslation = DirectusCollectionTranslator.getSourceTranslationFromTranslations(
      translations, schemaContext
    );
    if (!sourceTranslation) {
      await context.logger.appendLog(
        'Food ' + food.id + ': Skipped – no source translation found ' +
        '(none marked as be_source_for_translations). ' +
        'Translation ids: [' + translations.map(t => t.id).join(', ') + ']'
      );
      return {fixed: 0, attempted: 0};
    }

    const FIELD_LANGUAGES_ID_OR_CODE = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(sourceTranslation);
    if (!FIELD_LANGUAGES_ID_OR_CODE) {
      await context.logger.appendLog(
        'Food ' + food.id + ': Skipped – could not detect language field on source translation ' +
        '(id=' + sourceTranslation.id + '). Keys: [' + Object.keys(sourceTranslation).join(', ') + ']'
      );
      return {fixed: 0, attempted: 0};
    }

    const sourceLanguageCode = DirectusCollectionTranslator.extractLanguageCode(
      (sourceTranslation as any)[FIELD_LANGUAGES_ID_OR_CODE]
    );
    const fieldsToTranslate = DirectusCollectionTranslator.getFieldsToTranslate(schemaContext);

    // Log source field values once per food.
    await context.logger.appendLog(
      'Food ' + food.id + ': source id=' + sourceTranslation.id +
      ', lang="' + sourceLanguageCode + '"' +
      ', languageField="' + FIELD_LANGUAGES_ID_OR_CODE + '"' +
      ', fieldsToTranslate=[' + fieldsToTranslate.join(', ') + ']'
    );
    for (const field of fieldsToTranslate) {
      const value = (sourceTranslation as any)[field];
      await context.logger.appendLog(
        'Food ' + food.id + ': source field "' + field + '" = ' +
        (value ? '"' + String(value).substring(0, 80) + '"' : 'null/empty')
      );
    }

    let fixed = 0;
    let attempted = 0;

    for (const translation of translations) {
      if (attempted >= remainingCapacity) {
        await context.logger.appendLog(
          'Food ' + food.id + ': Stopping – reached remaining capacity of ' + remainingCapacity + '.'
        );
        break;
      }

      // Skip source translation.
      if (translation.be_source_for_translations) {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id + ': Skipped – is source translation.'
        );
        continue;
      }

      // Only process translations explicitly allowed to be translated (or where the flag is unset).
      if (translation.let_be_translated === false) {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id + ': Skipped – let_be_translated is false.'
        );
        continue;
      }

      // Resolve the language code for this translation entry.
      const languageField = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(translation);
      if (!languageField) {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id +
          ': Skipped – could not detect language field. Keys: [' + Object.keys(translation).join(', ') + ']'
        );
        continue;
      }
      const languageCodeValue = translation[languageField as keyof DatabaseTypes.FoodsTranslations];
      let languageCode: string | undefined;
      if (typeof languageCodeValue === 'string') {
        languageCode = languageCodeValue;
      } else if (languageCodeValue && typeof languageCodeValue === 'object' && 'code' in (languageCodeValue as any)) {
        languageCode = (languageCodeValue as any).code;
      }
      if (!languageCode) {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id +
          ': Skipped – could not resolve language code. Raw value: ' + JSON.stringify(languageCodeValue)
        );
        continue;
      }

      // Determine which fields are missing in this translation AND have a non-empty source value.
      // Only these qualify for translation (and count toward the MAX_TRANSLATIONS limit).
      const fieldsToAttempt = fieldsToTranslate.filter(field => {
        const translationValue = (translation as any)[field];
        const sourceValue = (sourceTranslation as any)[field];
        return !translationValue && !!sourceValue;
      });

      if (fieldsToAttempt.length === 0) {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
          'Skipped – no fields to translate (either already populated or source is empty for all fields).'
        );
        continue;
      }

      await context.logger.appendLog(
        'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
        'Attempting translation for field(s): [' + fieldsToAttempt.join(', ') + ']'
      );

      const translatedItem: any = {};

      for (const field of fieldsToAttempt) {
        if (attempted >= remainingCapacity) {
          await context.logger.appendLog(
            'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
            'Stopping mid-translation – reached remaining capacity of ' + remainingCapacity + '.'
          );
          break;
        }

        const sourceValue = (sourceTranslation as any)[field];
        attempted++;

        try {
          await context.logger.appendLog(
            'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
            'Translating field "' + field + '" from "' + sourceLanguageCode + '" to "' + languageCode + '", ' +
            'source value="' + String(sourceValue).substring(0, 80) + '"'
          );

          const translatedValue = await translator.translate({
            text: sourceValue,
            source_language: sourceLanguageCode,
            destination_language: languageCode,
          });

          if (translatedValue) {
            translatedItem[field] = translatedValue;
            await context.logger.appendLog(
              'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
              'Field "' + field + '" → "' + String(translatedValue).substring(0, 80) + '"'
            );
          } else {
            await context.logger.appendLog(
              'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
              'Field "' + field + '" translator returned null/undefined – ' + getTranslationNullReason(languageCode)
            );
          }
        } catch (err: any) {
          await context.logger.appendLog(
            'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
            'Error translating field "' + field + '": ' + err.toString()
          );
        }
      }

      translatedItem[FIELD_LANGUAGES_ID_OR_CODE] = {code: languageCode};
      translatedItem[DirectusCollectionTranslator.FIELD_LET_BE_TRANSLATED] = true;
      translatedItem[DirectusCollectionTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION] = false;

      if (translatedItem.name || translatedItem.description) {
        const foodsUpdateHelper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Foods>(
          CollectionNames.FOODS
        );
        await foodsUpdateHelper.updateOne(food.id, {
          translations: {
            create: [],
            update: [{...translation, ...translatedItem, id: translation.id}],
            delete: [],
          },
        } as any);
        fixed++;
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
          'Saved. translatedItem=' + JSON.stringify(translatedItem)
        );
      } else {
        await context.logger.appendLog(
          'Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): ' +
          'Nothing to save – translator returned no usable values. translatedItem=' + JSON.stringify(translatedItem)
        );
      }
    }

    await context.logger.appendLog(
      'Food ' + food.id + ': Done. Fixed ' + fixed + ' translation(s), ' +
      'attempted ' + attempted + ' operation(s).'
    );
    return {fixed, attempted};
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async (registerFunctions, apiContext) => {
  WorkflowScheduler.registerWorkflow(new FoodsTranslationFixMissingWorkflow());
});
