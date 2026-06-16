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
const MAX_FOODS = 1000;

class FoodsTranslationFixMissingWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting foods translation fix for missing names');

    try {
      const translatorSettings = new TranslatorSettings(context.myDatabaseHelper);
      const translator = new Translator(translatorSettings, context.myDatabaseHelper);
      await translator.init();

      if (!translator.isReady()) {
        await context.logger.appendLog('Translator is not ready. Please check that the AUTO_TRANSLATE_API_KEY environment variable is set and valid. Aborting.');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.FAILED,
        });
      }

      const autoTranslateEnabled = await translatorSettings.isAutoTranslationEnabled();
      if (!autoTranslateEnabled) {
        await context.logger.appendLog('Auto-translation is not enabled. Aborting.');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.SUCCESS,
        });
      }

      const foodsHelper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Foods>(CollectionNames.FOODS);

      // Query foods that have translations with empty name
      const filter: Filter = {
        _and: [
          {
            translations: {
              name: {
                _null: true,
              },
            },
          },
        ],
      };

      // Fetch up to MAX_FOODS in a single query - no while loop needed
      const foodsWithMissingTranslations = await foodsHelper.readByQuery({
        filter,
        fields: ['id', 'translations.*'],
        limit: MAX_FOODS,
      });

      if (foodsWithMissingTranslations.length === 0) {
        await context.logger.appendLog('No foods with missing translation names found.');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.SUCCESS,
        });
      }

      await context.logger.appendLog(
        'Found ' + foodsWithMissingTranslations.length + ' foods with missing translation names. Processing...'
      );

      let totalFixed = 0;
      let processedCount = 0;

      for (const food of foodsWithMissingTranslations) {
        if (processedCount >= MAX_FOODS) {
          await context.logger.appendLog('Reached maximum limit of ' + MAX_FOODS + ' foods. Stopping.');
          break;
        }
        try {
          await context.logger.appendLog('Processing food ' + (processedCount + 1) + '/' + foodsWithMissingTranslations.length + ' (id=' + food.id + ')...');
          const fixedCount = await this.fixTranslationsForFood(food, translator, translatorSettings, context);
          totalFixed += fixedCount;
          processedCount++;
        } catch (err: any) {
          await context.logger.appendLog('Error processing food ' + food.id + ': ' + err.toString());
          processedCount++;
        }
      }

      await context.logger.appendLog(
        'Completed. Processed ' + foodsWithMissingTranslations.length + ' foods, fixed ' + totalFixed + ' translations.'
      );

      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      await context.logger.appendLog('Error: ' + err.toString());
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }

  private async fixTranslationsForFood(
    food: DatabaseTypes.Foods,
    translator: Translator,
    translatorSettings: TranslatorSettings,
    context: WorkflowRunContext
  ): Promise<number> {
    const translations = food.translations as DatabaseTypes.FoodsTranslations[];
    if (!translations || translations.length === 0) {
      await context.logger.appendLog('Food ' + food.id + ': Skipped - no translations found.');
      return 0;
    }

    await context.logger.appendLog('Food ' + food.id + ': Found ' + translations.length + ' translation(s).');

    const schema = await context.myDatabaseHelper.getSchema();
    const translationField = 'translations';
    const schemaContext = {schema, collectionName: CollectionNames.FOODS, translation_field: translationField};

    // Find the source translation (the one marked as be_source_for_translations)
    const sourceTranslation = DirectusCollectionTranslator.getSourceTranslationFromTranslations(translations, schemaContext);
    if (!sourceTranslation) {
      await context.logger.appendLog('Food ' + food.id + ': Skipped - no source translation found (none marked as be_source_for_translations). Translation ids: [' + translations.map(t => t.id).join(', ') + ']');
      return 0;
    }

    // Check if source translation has a name - if not, we can't translate
    if (!sourceTranslation.name) {
      await context.logger.appendLog('Food ' + food.id + ': Skipped - source translation (id=' + sourceTranslation.id + ') has no name to translate from.');
      return 0;
    }

    const FIELD_LANGUAGES_ID_OR_CODE = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(sourceTranslation);
    if (!FIELD_LANGUAGES_ID_OR_CODE) {
      await context.logger.appendLog('Food ' + food.id + ': Skipped - could not detect language ID or code field on source translation (id=' + sourceTranslation.id + '). Keys: [' + Object.keys(sourceTranslation).join(', ') + ']');
      return 0;
    }

    const sourceLanguageCode = DirectusCollectionTranslator.extractLanguageCode((sourceTranslation as any)[FIELD_LANGUAGES_ID_OR_CODE]);
    const fieldsToTranslate = DirectusCollectionTranslator.getFieldsToTranslate(schemaContext);

    await context.logger.appendLog(
      'Food ' + food.id + ': Source translation id=' + sourceTranslation.id +
      ', sourceLanguageCode="' + sourceLanguageCode + '"' +
      ', languageField="' + FIELD_LANGUAGES_ID_OR_CODE + '"' +
      ', name="' + sourceTranslation.name + '"' +
      ', fieldsToTranslate=[' + fieldsToTranslate.join(', ') + ']'
    );

    // Log source field values so we can see what will actually be sent to the translator
    for (const field of fieldsToTranslate) {
      const value = (sourceTranslation as any)[field];
      await context.logger.appendLog('Food ' + food.id + ': Source field "' + field + '" = ' + (value ? '"' + String(value).substring(0, 80) + '"' : 'null/empty'));
    }

    let fixedCount = 0;

    for (const translation of translations) {
      // Skip the source translation
      if (translation.be_source_for_translations) {
        await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ': Skipped - is source translation.');
        continue;
      }

      // Skip if let_be_translated is explicitly false
      if (translation.let_be_translated === false) {
        await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ': Skipped - let_be_translated is false.');
        continue;
      }

      // Check if name is missing
      if (!translation.name) {
        const languageField = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(translation);
        if (!languageField) {
          await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ': Skipped - could not detect language field. Keys: [' + Object.keys(translation).join(', ') + ']');
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
          await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ': Skipped - could not resolve language code. Raw value: ' + JSON.stringify(languageCodeValue));
          continue;
        }

        const missingFields = fieldsToTranslate.filter(field => {
          const value = (translation as any)[field];
          return !value;
        });

        if (missingFields.length === 0) {
          await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Skipped - no missing fields (all fields already have values).');
          continue;
        }

        await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Attempting translation for missing fields: [' + missingFields.join(', ') + ']');

        // Translate each missing field inline so we can log each result
        const translatedItem: any = {};
        for (const field of missingFields) {
          const sourceValue = (sourceTranslation as any)[field];
          if (!sourceValue) {
            await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Field "' + field + '" skipped - source has no value for this field.');
            continue;
          }
          try {
            await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Translating field "' + field + '" from "' + sourceLanguageCode + '" to "' + languageCode + '", source value="' + String(sourceValue).substring(0, 80) + '"');
            const translatedValue = await translator.translate({
              text: sourceValue,
              source_language: sourceLanguageCode,
              destination_language: languageCode,
            });
            await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Field "' + field + '" translator returned: ' + (translatedValue !== null && translatedValue !== undefined ? '"' + String(translatedValue).substring(0, 80) + '"' : 'null/undefined'));
            if (translatedValue) {
              translatedItem[field] = translatedValue;
            }
          } catch (err: any) {
            await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Error translating field "' + field + '": ' + err.toString());
          }
        }

        translatedItem[FIELD_LANGUAGES_ID_OR_CODE] = {code: languageCode};
        translatedItem[DirectusCollectionTranslator.FIELD_LET_BE_TRANSLATED] = true;
        translatedItem[DirectusCollectionTranslator.FIELD_BE_SOURCE_FOR_TRANSLATION] = false;

        await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): translatedItem=' + JSON.stringify(translatedItem));

        if (translatedItem.name) {
          const foodsUpdateHelper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.Foods>(CollectionNames.FOODS);
          await foodsUpdateHelper.updateOne(food.id, {
            translations: {
              create: [],
              update: [{
                ...translation,
                ...translatedItem,
                id: translation.id,
              }],
              delete: [],
            },
          } as any);
          fixedCount++;
          await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Successfully saved translated name="' + translatedItem.name + '".');
        } else {
          await context.logger.appendLog('Food ' + food.id + ', translation ' + translation.id + ' (lang=' + languageCode + '): Skipped saving - no name in translatedItem.');
        }
      }
    }

    await context.logger.appendLog('Food ' + food.id + ': Done. Fixed ' + fixedCount + ' translations.');
    return fixedCount;
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async (registerFunctions, apiContext) => {
  WorkflowScheduler.registerWorkflow(new FoodsTranslationFixMissingWorkflow());
});
