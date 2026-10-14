import {CollectionNames, CronHelper, DatabaseTypes} from 'repo-depkit-common';
import {MyDatabaseHelper} from '../helpers/MyDatabaseHelper';
import {MyDefineHook} from '../helpers/MyDefineHook';
import {DeletePermissionHelper} from '../helpers/DeletePermissionHelper';
import {WorkflowRunContext} from '../helpers/WorkflowRunContext';
import {WORKFLOW_RUN_STATE} from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {WorkflowScheduleHelper} from '../workflows-runs-hook';
import {SingleWorkflowRun} from '../workflows-runs-hook/WorkflowRunJobInterface';
import {FoodofferComponentsCleanupHelper} from './FoodofferComponentsCleanupHelper';

const SCHEDULE_NAME = 'foodoffers-components-hook';
const CLEANUP_WORKFLOW_ID = 'foodoffers-components-cleanup';

/**
 * Deletes component foodoffers that no parent uses anymore - orphaned before the delete filters below existed, or by
 * a delete that bypassed Directus. Runs are logged in `workflows_runs`, the workflow can be switched off in `workflows`.
 */
class FoodofferComponentsCleanupWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return CLEANUP_WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    try {
      const deleted = await FoodofferComponentsCleanupHelper.deleteOrphanedComponentFoodoffers(context.myDatabaseHelper, message => context.logger.appendLog(message));
      await context.logger.appendLog(`Orphaned component foodoffers deleted: ${deleted}`);
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SUCCESS });
    } catch (error) {
      await context.logger.appendLog('Error: ' + (error instanceof Error ? error.message : String(error)));
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.FAILED });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ filter, schedule }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  // Deleting a parent foodoffer removes its junction rows via the database ON DELETE CASCADE, which runs no Directus hook.
  // So the component foodoffers have to be deleted here, while the junction rows still exist.
  filter(CollectionNames.FOODOFFERS + '.items.delete', async (payloadModifiable, _meta, eventContext) => {
    const foodofferIds = payloadModifiable as (string | number)[];
    // Since Directus 11.13 this filter runs before the permission check - only delete the component foodoffers if the delete is allowed
    if (foodofferIds && Array.isArray(foodofferIds) && foodofferIds.length > 0 && (await DeletePermissionHelper.canDeleteAll(apiContext, eventContext, CollectionNames.FOODOFFERS, foodofferIds))) {
      try {
        const componentFoodofferIds = await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfParents(myDatabaseHelper, foodofferIds);
        if (componentFoodofferIds.length > 0) {
          await myDatabaseHelper.getFoodoffersHelper().deleteMany(componentFoodofferIds);
        }
      } catch (err) {
        console.error(SCHEDULE_NAME + ': Error deleting component foodoffers on foodoffer delete:', err);
      }
    }

    return payloadModifiable;
  });

  filter(CollectionNames.FOODOFFER_COMPONENTS + '.items.delete', async (payloadModifiable, _meta, eventContext) => {
    const junctionIds = payloadModifiable as number[];
    // Since Directus 11.13 this filter runs before the permission check - only delete the component foodoffers if the delete is allowed
    if (junctionIds && Array.isArray(junctionIds) && junctionIds.length > 0 && (await DeletePermissionHelper.canDeleteAll(apiContext, eventContext, CollectionNames.FOODOFFER_COMPONENTS, junctionIds))) {
      try {
        // Components still used by another parent stay, only the junction row goes
        const componentFoodofferIds = await FoodofferComponentsCleanupHelper.getComponentFoodofferIdsOfJunctionRows(myDatabaseHelper, junctionIds);
        if (componentFoodofferIds.length > 0) {
          const foodoffersHelper = myDatabaseHelper.getFoodoffersHelper();
          await foodoffersHelper.deleteMany(componentFoodofferIds);
        }
      } catch (err) {
        console.error(SCHEDULE_NAME + ': Error deleting component foodoffers on junction delete:', err);
      }
    }

    return payloadModifiable;
  });

  await WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FoodofferComponentsCleanupWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_HOUR,
  });
});
