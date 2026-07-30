import { defineHook } from '@directus/extensions-sdk';
import { RegisterFunctions } from '@directus/extensions';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun, WorkflowEnum } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { CronHelper, DatabaseTypes } from 'repo-depkit-common';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';

/**
 * Cleanup workflow (like file-cleanup) that deletes orphaned component foodoffers:
 * foodoffers without a canteen that are not referenced by any foodoffers_components
 * junction row. Such rows are unreachable in the app (all queries filter by canteen)
 * and are historical leftovers from deleting parent foodoffers, where the junction
 * rows were removed by the database via ON DELETE CASCADE without the components
 * hook being able to delete the children.
 */
export class FoodoffersComponentsCleanupWorkflow extends SingleWorkflowRun {
  private static readonly DELETE_BATCH_SIZE = 250;

  private readonly statistics = {
    foodoffersWithoutCanteenAmount: 0,
    referencedComponentsAmount: 0,
    orphanedComponentsAmount: 0,
    deletedAmount: 0,
    deletedErrorAmount: 0,
  };

  getWorkflowId(): string {
    return WorkflowEnum.foodoffersComponentsCleanup;
  }

  private async findOrphanedComponentFoodoffers(context: WorkflowRunContext): Promise<DatabaseTypes.Foodoffers[]> {
    const foodoffersHelper = context.myDatabaseHelper.getFoodoffersHelper();
    const componentsHelper = context.myDatabaseHelper.getFoodofferComponentsHelper();

    const foodoffersWithoutCanteen = await foodoffersHelper.readByQuery({
      filter: {
        canteen: {
          _null: true,
        },
      },
      fields: ['id'],
      limit: -1,
    });
    this.statistics.foodoffersWithoutCanteenAmount = foodoffersWithoutCanteen.length;
    await context.logger.appendLog(`Found ${foodoffersWithoutCanteen.length} foodoffers without canteen (component candidates).`);
    if (foodoffersWithoutCanteen.length === 0) {
      return [];
    }

    const junctionRows = await componentsHelper.readByQuery({
      fields: ['component_foodoffers_id'],
      limit: -1,
    });
    const referencedComponentIds = new Set(
      junctionRows
        .map(row => (typeof row.component_foodoffers_id === 'string' ? row.component_foodoffers_id : null))
        .filter((id): id is string => !!id)
    );
    this.statistics.referencedComponentsAmount = referencedComponentIds.size;
    await context.logger.appendLog(`Found ${referencedComponentIds.size} component foodoffers referenced by foodoffers_components rows.`);

    return foodoffersWithoutCanteen.filter(foodoffer => !referencedComponentIds.has(foodoffer.id));
  }

  private async deleteOrphanedFoodoffers(context: WorkflowRunContext, orphanedFoodoffers: DatabaseTypes.Foodoffers[]): Promise<void> {
    const foodoffersHelper = context.myDatabaseHelper.getFoodoffersHelper();
    const idsToDelete = orphanedFoodoffers.map(foodoffer => foodoffer.id);

    for (let i = 0; i < idsToDelete.length; i += FoodoffersComponentsCleanupWorkflow.DELETE_BATCH_SIZE) {
      const batch = idsToDelete.slice(i, i + FoodoffersComponentsCleanupWorkflow.DELETE_BATCH_SIZE);
      try {
        await foodoffersHelper.deleteMany(batch);
        this.statistics.deletedAmount += batch.length;
        await context.logger.appendLog(`Deleted batch of ${batch.length} orphaned component foodoffers (${i + batch.length}/${idsToDelete.length}).`);
      } catch (error) {
        this.statistics.deletedErrorAmount += batch.length;
        await context.logger.appendLog(`Error deleting batch: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async logSummary(context: WorkflowRunContext): Promise<void> {
    await context.logger.appendLog('Summary:');
    await context.logger.appendLog(`- Foodoffers without canteen: ${this.statistics.foodoffersWithoutCanteenAmount}`);
    await context.logger.appendLog(`- Referenced components: ${this.statistics.referencedComponentsAmount}`);
    await context.logger.appendLog(`- Orphaned components found: ${this.statistics.orphanedComponentsAmount}`);
    await context.logger.appendLog(`- Deleted: ${this.statistics.deletedAmount}`);
    await context.logger.appendLog(`- Delete errors: ${this.statistics.deletedErrorAmount}`);
    await context.logger.appendLog('- Finished foodoffers components cleanup job.');
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    await context.logger.appendLog('Starting foodoffers components cleanup job.');

    try {
      const orphanedFoodoffers = await this.findOrphanedComponentFoodoffers(context);
      this.statistics.orphanedComponentsAmount = orphanedFoodoffers.length;
      await context.logger.appendLog(`Found ${orphanedFoodoffers.length} orphaned component foodoffers (canteen=null, not referenced by any foodoffers_components row).`);

      if (orphanedFoodoffers.length > 0) {
        await this.deleteOrphanedFoodoffers(context, orphanedFoodoffers);
      }

      await this.logSummary(context);

      return context.logger.getFinalLogWithStateAndParams({
        state: this.statistics.deletedErrorAmount > 0 ? WORKFLOW_RUN_STATE.FAILED : WORKFLOW_RUN_STATE.SUCCESS,
      });
    } catch (error) {
      await context.logger.appendLog('Error: ' + (error instanceof Error ? error.message : String(error)));
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
  }
}

export default defineHook(async (registerFunctions: RegisterFunctions, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FoodoffersComponentsCleanupWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: registerFunctions.schedule,
    cronOject: CronHelper.EVERY_DAY_AT_3AM,
  });
});
