import { CollectionNames } from 'repo-depkit-common';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { AppReviewsPullHelper } from './AppReviewsPullHelper';
import { AppStoreReviewsResponseHelper } from './AppStoreReviewsResponseHelper';

const SCHEDULE_NAME = 'app_reviews_pull';

export default MyDefineHook.defineHookWithAllTablesExisting(SCHEDULE_NAME, async ({ schedule, action }, apiContext) => {
  const cronFrequency = '0 20 * * *'; // every day at 20:00

  schedule(cronFrequency, async () => {
    apiContext.logger.info(SCHEDULE_NAME + ': start schedule run: ' + new Date().toISOString());

    try {
      const myDatabaseHelper = new MyDatabaseHelper(apiContext);
      const appSettings = await myDatabaseHelper.getAppSettingsHelper().getAppSettings();

      if (!appSettings) {
        apiContext.logger.info(SCHEDULE_NAME + ': No app settings found, skipping');
        return;
      }

      const logger = {
        info: (msg: string) => apiContext.logger.info(msg),
        error: (msg: string) => apiContext.logger.error(msg),
      };

      const pullHelper = new AppReviewsPullHelper(myDatabaseHelper, logger);

      await pullHelper.pullAppleReviews(appSettings);
      await pullHelper.pullGoogleReviews(appSettings);
    } catch (e) {
      apiContext.logger.error(SCHEDULE_NAME + ': error during reviews pull: ' + (e instanceof Error ? e.message : String(e)));
      apiContext.logger.error(e);
    }
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
