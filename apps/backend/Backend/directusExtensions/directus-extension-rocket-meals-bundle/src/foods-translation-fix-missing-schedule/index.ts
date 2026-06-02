import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {WorkflowScheduleHelper} from '../workflows-runs-hook';
import {SingleWorkflowRun} from '../workflows-runs-hook/WorkflowRunJobInterface';
import {CollectionNames, CronHelper, DatabaseTypes} from 'repo-depkit-common';
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

      for (const food of foodsWithMissingTranslations) {
        try {
          const fixedCount = await this.fixTranslationsForFood(food, translator, translatorSettings, context);
          totalFixed += fixedCount;
        } catch (err: any) {
          await context.logger.appendLog('Error processing food ' + food.id + ': ' + err.toString());
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
      return 0;
    }

    const schema = await context.myDatabaseHelper.getSchema();
    const translationField = 'translations';
    const schemaContext = {schema, collectionName: CollectionNames.FOODS, translation_field: translationField};

    // Find the source translation (the one marked as be_source_for_translations)
    const sourceTranslation = DirectusCollectionTranslator.getSourceTranslationFromTranslations(translations, schemaContext);
    if (!sourceTranslation) {
      return 0;
    }

    // Check if source translation has a name - if not, we can't translate
    if (!sourceTranslation.name) {
      return 0;
    }

    const FIELD_LANGUAGES_ID_OR_CODE = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(sourceTranslation);
    if (!FIELD_LANGUAGES_ID_OR_CODE) {
      return 0;
    }

    const fieldsToTranslate = DirectusCollectionTranslator.getFieldsToTranslate(schemaContext);
    let fixedCount = 0;

    for (const translation of translations) {
      // Skip the source translation
      if (translation.be_source_for_translations) {
        continue;
      }

      // Skip if let_be_translated is explicitly false
      if (translation.let_be_translated === false) {
        continue;
      }

      // Check if name is missing
      if (!translation.name) {
        const languageField = DirectusCollectionTranslator.detectLanguagesIdOrCodeField(translation);
        if (!languageField) {
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
          continue;
        }

        // Translate missing fields for this translation
        const translatedItem = await DirectusCollectionTranslator.translateTranslationItem({
          isSourceTranslation: false,
          sourceTranslation,
          language_code: languageCode,
          translator,
          translatorSettings,
          fieldsToTranslate: fieldsToTranslate.filter(field => {
            // Only translate fields that are missing in this translation
            const value = (translation as any)[field];
            return !value;
          }),
          FIELD_LANGUAGES_ID_OR_CODE,
          context: schemaContext,
        });

        if (translatedItem && translatedItem.name) {
          // Update the translation directly
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
        }
      }
    }

    return fixedCount;
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({schedule}, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FoodsTranslationFixMissingWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_4AM,
  });
});
