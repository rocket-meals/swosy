import { defineHook } from '@directus/extensions-sdk';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';
import { ItemsServiceCreator } from '../helpers/ItemsServiceCreator';
import { ImageSafeGeneratorFood } from '../helpers/ai/image/ImageSafeGeneratorFood';
import { ModerationCheckChatGpt } from '../helpers/ai/moderation/ModerationCheckChatGpt';
import { ImageRawGeneratorChatGpt } from '../helpers/ai/image/ImageRawGeneratorChatGpt';
import { MyFileTypes } from '../helpers/FilesServiceHelper';
import {CronHelper, CronObject} from "repo-depkit-common";
import {MyDefineHook} from "../helpers/MyDefineHook";

const WORKFLOW_ID = 'food-image-ai-generation';
const HOOK_NAME = 'food-image-ai-generation-hook';

function getFileId(image: DatabaseTypes.Foods['image']): string | undefined {
  if (!image) {
    return undefined;
  }
  if (typeof image === 'string') {
    return image;
  }
  if (typeof image === 'object' && 'id' in image && typeof image.id === 'string') {
    return image.id;
  }
  return undefined;
}

class FoodImageAiGenerationWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting food image AI generation workflow');

    try {
      const appSettings = await context.myDatabaseHelper.getAppSettingsHelper().getAppSettings();
      if (!appSettings?.foods_image_ai_generation_enabled) {
        await context.logger.appendLog('AI image generation disabled in app settings');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.SKIPPED,
        });
      }

      const openAiToken = EnvVariableHelper.getOpenAiToken();
      if (!openAiToken) {
        await context.logger.appendLog('OPEN_AI_TOKEN environment variable is not configured');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.FAILED,
        });
      }

      const foodsImageFolderId = await context.myDatabaseHelper.getFoodsImageFolderId();
      if (foodsImageFolderId) {
        await context.logger.appendLog(`Using foods image folder: ${foodsImageFolderId}`);
      } else {
        await context.logger.appendLog('No specific foods image folder configured (directus_fields.options.folder). Files will be stored in root.');
      }

      const itemsServiceCreator = new ItemsServiceCreator(
        context.myDatabaseHelper.apiContext,
        context.myDatabaseHelper.eventContext
      );
      const foodsService = await itemsServiceCreator.getItemsService<DatabaseTypes.Foods>(CollectionNames.FOODS);
      const foodsHelper = context.myDatabaseHelper.getFoodsHelper();
      const missingImageFilter: any = {
        _and: [
          { image: { _null: true } },
          { image_remote_url: { _null: true } },
        ],
      };
      const totalFoodsToProcess = await foodsHelper.countItems({ filter: missingImageFilter });

      if (!totalFoodsToProcess) {
        await context.logger.appendLog('No foods without images found');
        return context.logger.getFinalLogWithStateAndParams({
          state: WORKFLOW_RUN_STATE.SUCCESS,
        });
      }

      await context.logger.appendLog(`Found ${totalFoodsToProcess} foods without images`);

      const moderationCheck = new ModerationCheckChatGpt({ apiKey: openAiToken });
      const imageGenerator = new ImageRawGeneratorChatGpt({ apiKey: openAiToken });
      const imageSafeGenerator = new ImageSafeGeneratorFood({
        moderationCheck: moderationCheck,
        imageGenerator: imageGenerator,
      });
      const filesHelper = context.myDatabaseHelper.getFilesHelper();
      let generatedImages = 0;
      let skippedFoods = 0;
      let processedCount = 0;
      const processedIds = new Set<string>();
      const batchSize = 100;
      let foodsWithoutImagesFound = true;

      while (foodsWithoutImagesFound) {
        const batchFilter = {
          _and: [...missingImageFilter._and],
        } as any;

        if (processedIds.size > 0) {
          batchFilter._and.push({ id: { _nin: Array.from(processedIds) } });
        }

        const foodsBatch = await foodsService.readByQuery({
          filter: batchFilter,
          fields: ['id'],
          limit: batchSize,
        });

        if (!foodsBatch || foodsBatch.length === 0) {
          // No more foods to process -> stop the while loop
          foodsWithoutImagesFound = false;
          break;
        }

        for (const batchFood of foodsBatch) {
          const foodId = batchFood.id;
          processedIds.add(foodId);
          processedCount += 1;

          try {
            const food = await foodsService.readOne(foodId, {
              fields: ['id', 'alias', 'image', 'image_remote_url'],
            });

            if (!food) {
              skippedFoods += 1;
              await context.logger.appendLog(
                `Skipping food ${foodId} because it no longer exists (${processedCount}/${totalFoodsToProcess})`
              );
              continue;
            }

            const alias = typeof food.alias === 'string' ? food.alias.trim() : '';
            const existingImageId = getFileId(food.image);
            const hasRemoteUrl = typeof food.image_remote_url === 'string' && food.image_remote_url.length > 0;

            if (existingImageId || hasRemoteUrl) {
              skippedFoods += 1;
              await context.logger.appendLog(
                `Skipping food ${foodId} because an image already exists (${processedCount}/${totalFoodsToProcess})`
              );
              continue;
            }

            if (!alias) {
              skippedFoods += 1;
              await context.logger.appendLog(
                `Skipping food ${foodId} because alias is missing (${processedCount}/${totalFoodsToProcess})`
              );
              continue;
            }

            const imageBuffer = await imageSafeGenerator.generateImage(alias);
            const filename = `Foods ${foodId}`;
            const fileId = await filesHelper.uploadOneFromBuffer(
              imageBuffer,
              filename,
              MyFileTypes.PNG,
              context.myDatabaseHelper,
              foodsImageFolderId
            );
            const fileIdString = String(fileId);

            await foodsHelper.updateOne(foodId, {
              image: fileIdString,
              image_generated: true,
            });

            generatedImages += 1;
            await context.logger.appendLog(
              `Generated image for food ${foodId} (${processedCount}/${totalFoodsToProcess})`
            );
          } catch (err: any) {
            const message = err?.message || String(err);
            skippedFoods += 1;
            await context.logger.appendLog(
              `Failed to process food ${foodId}: ${message} (${processedCount}/${totalFoodsToProcess})`
            );
          }
        }
      }

      await context.logger.appendLog(
        `Finished food image generation. Generated images: ${generatedImages}. Skipped foods: ${skippedFoods}. Processed foods: ${processedCount}.`
      );

      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (err: any) {
      const message = err?.message || String(err);
      await context.logger.appendLog('Error: ' + message);
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME,async (registerFunctions, apiContext) => {
  const { schedule } = registerFunctions;
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FoodImageAiGenerationWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_4AM,
  });
});
