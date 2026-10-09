/**
 * feature-wishes-cleanup-workflow – tidies up `feature_whishes` once a day (runs are logged in
 * `workflows_runs`, the workflow can be switched off in `workflows`).
 *
 * 1. Deletes archived wishes whose last change is older than 30 days, together with their duplicates
 *    and likes. Editing an archived wish starts the 30 days again, it is never deleted too early.
 * 2. Repairs rows that lost their original: a like without `related_to` is deleted, a duplicate
 *    without `related_to` goes back to review (`draft`).
 * 3. Recounts `likes_amount` of all wishes, in case a deletion bypassed the hooks.
 */
import { CollectionNames, CronHelper, DatabaseTypes, FeatureWishHelper, FeatureWishStatus } from 'repo-depkit-common';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { FeatureWishService } from '../feature-wishes-hook/FeatureWishService';

const HOOK_NAME = 'feature-wishes-cleanup-workflow';
const WORKFLOW_ID = 'feature-wishes-cleanup';

class FeatureWishesCleanupWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    try {
      const helper = context.myDatabaseHelper.getItemsServiceHelper<DatabaseTypes.FeatureWhishes>(CollectionNames.FEATURE_WHISHES);
      const service = new FeatureWishService(context.myDatabaseHelper);

      const cutoff = FeatureWishHelper.getArchivedDeletionCutoff(new Date()).toISOString();
      const outdatedArchived = await helper.readByQuery({
        filter: {
          _and: [
            { status: { _eq: FeatureWishStatus.ARCHIVED } },
            { _or: [{ date_updated: { _lte: cutoff } }, { _and: [{ date_updated: { _null: true } }, { date_created: { _lte: cutoff } }] }] },
          ],
        } as any,
        fields: ['id'],
        limit: -1,
      });
      const deleted = await service.deleteWithDependents(outdatedArchived.map(wish => wish.id));
      await context.logger.appendLog(`Archived wishes older than ${cutoff}: ${outdatedArchived.length} (deleted rows incl. duplicates and likes: ${deleted})`);

      const orphanedLikes = await helper.readByQuery({
        filter: { _and: [{ status: { _eq: FeatureWishStatus.LIKE } }, { related_to: { _null: true } }] } as any,
        fields: ['id'],
        limit: -1,
      });
      if (orphanedLikes.length > 0) {
        await helper.deleteMany(orphanedLikes.map(like => like.id));
      }
      await context.logger.appendLog(`Likes without wish deleted: ${orphanedLikes.length}`);

      const orphanedDuplicates = await helper.readByQuery({
        filter: { _and: [{ status: { _eq: FeatureWishStatus.MERGED } }, { related_to: { _null: true } }] } as any,
        fields: ['id'],
        limit: -1,
      });
      for (const duplicate of orphanedDuplicates) {
        await helper.updateOne(duplicate.id, { status: FeatureWishStatus.DRAFT });
      }
      await context.logger.appendLog(`Duplicates without original sent back to review: ${orphanedDuplicates.length}`);

      const recounted = await service.recountAllLikes();
      await context.logger.appendLog(`Wishes with corrected likes_amount: ${recounted}`);

      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SUCCESS });
    } catch (error) {
      await context.logger.appendLog('Error: ' + (error instanceof Error ? error.message : String(error)));
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.FAILED });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ schedule }, apiContext) => {
  await WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FeatureWishesCleanupWorkflow(),
    myDatabaseHelper: new MyDatabaseHelper(apiContext),
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_3AM,
  });
});
