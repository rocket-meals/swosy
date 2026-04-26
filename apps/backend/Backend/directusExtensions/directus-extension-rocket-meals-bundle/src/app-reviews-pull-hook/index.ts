import { CollectionNames, CronHelper, DatabaseTypes } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { AppReviewsPullHelper, PulledAppReview } from './AppReviewsPullHelper';
import { AppStoreReviewsResponseHelper } from './AppStoreReviewsResponseHelper';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { EnvVariableHelper } from '../helpers/EnvVariableHelper';

const SCHEDULE_NAME = 'app_reviews_pull';

class AppReviewsPullWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return 'app-reviews-pull';
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    const myDatabaseHelper = context.myDatabaseHelper;
    const logger = {
      info: async (msg: string) => { await context.logger.appendLog(msg); },
      error: async (msg: string) => { await context.logger.appendLog('ERROR: ' + msg); },
    };

    try {
      const pullHelper = new AppReviewsPullHelper(logger);

      const appleAppId = EnvVariableHelper.getAppleAppId();
      const googlePlayPackageName = EnvVariableHelper.getGooglePlayPackageName();

      if (!appleAppId && !googlePlayPackageName) {
        await context.logger.appendLog('app-reviews-pull-hook: No app store IDs configured for this customer, skipping');
        return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SKIPPED });
      }

      let appleReviews: PulledAppReview[] = [];
      if (appleAppId) {
        appleReviews = await pullHelper.pullAppleReviews(appleAppId);
      }

      let googleReviews: PulledAppReview[] = [];
      if (googlePlayPackageName) {
        googleReviews = await pullHelper.pullGoogleReviews(googlePlayPackageName);
      }
      const allReviews = [...appleReviews, ...googleReviews];
      const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();

      let created = 0;
      let skipped = 0;

      for (const review of allReviews) {
        const existing = await appFeedbacksHelper.readByQuery({
          filter: { external_identifier: { _eq: review.external_identifier } },
          limit: 1,
        });

        if (existing && existing.length > 0) {
          skipped++;
          continue;
        }

        await appFeedbacksHelper.createOne({
          ...review,
        });
        created++;
      }

      await context.logger.appendLog('Created ' + created + ' new reviews, skipped ' + skipped + ' duplicates');
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SUCCESS });
    } catch (e) {
      await context.logger.appendLog('error during reviews pull: ' + (e instanceof Error ? e.message : String(e)));
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.FAILED });
    }
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ action, schedule, filter }, apiContext) => {
  const myDatabaseHelper = new MyDatabaseHelper(apiContext);

  await WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new AppReviewsPullWorkflow(),
    myDatabaseHelper: myDatabaseHelper,
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_20,
  });

  filter(CollectionNames.APP_FEEDBACKS + '.items.update', async (payload, meta) => {
    const payloadTyped = payload as Partial<DatabaseTypes.AppFeedbacks>;

    if (!payloadTyped.response) {
      return payload;
    }

    const filterMyDatabaseHelper = new MyDatabaseHelper(apiContext);
    const appFeedbacksHelper = filterMyDatabaseHelper.getAppFeedbacksHelper();

    const metaKeysSingle = meta.keys ? [meta.keys as string] : [];
    const keysArray: string[] = Array.isArray(meta.keys)
      ? (meta.keys as string[]).filter((id): id is string => !!id)
      : metaKeysSingle;

    for (const feedbackId of keysArray) {
      const feedback = await appFeedbacksHelper.readOne(feedbackId);
      if (!feedback) {
        continue;
      }

      const isConfigured = AppStoreReviewsResponseHelper.isConfiguredForSource(feedback.source_identifier);
      if (!isConfigured) {
        throw new Error(
          `Cannot set response for ${feedback.source_identifier} review: store not configured`
        );
      }
    }

    return payload;
  });

  action(CollectionNames.APP_FEEDBACKS + '.items.update', async meta => {
    const updatedFields: string[] = meta.payload ? Object.keys(meta.payload) : [];
    if (!updatedFields.includes('response')) {
      return;
    }

    try {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const appFeedbacksHelper = myDatabaseHelper.getAppFeedbacksHelper();
      const feedbackId = meta.key as string;
      const feedback = await appFeedbacksHelper.readOne(feedbackId);

      if (!feedback) {
        return;
      }

      const logger = {
        info: (msg: string) => apiContext.logger.info(msg),
        error: (msg: string) => apiContext.logger.error(msg),
      };

      const responseHelper = new AppStoreReviewsResponseHelper(myDatabaseHelper, logger);
      await responseHelper.respondToReview(feedback);
    } catch (e) {
      apiContext.logger.error(SCHEDULE_NAME + ': error responding to store review: ' + (e instanceof Error ? e.message : String(e)));
      apiContext.logger.error(e);
    }
  });
});
