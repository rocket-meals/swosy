/**
 * feature-wishes-daily-workflow – every evening at 20:00 (runs are logged in `workflows_runs`, the
 * workflow can be switched off in `workflows`).
 *
 * 1. AI review: wishes in `draft` go to the OpenAI-compatible provider of the Directus settings
 *    (Settings → AI) together with the published wishes. Its answer only ever becomes a suggestion
 *    (`ai_suggests_publish`, `ai_suggests_decline`, `ai_suggests_merge` with `related_to`), a human
 *    decides. Without a configured provider this step is skipped.
 * 2. Mail to support with everything that waits for a decision and the likes that changed since the
 *    last report. No mail when there is nothing to tell.
 * 3. `likes_amount_last_checked` is set to the current `likes_amount`, so the next mail only shows
 *    what changed since this one.
 */
import { CollectionNames, CronHelper, DatabaseTypes, FeatureWishHelper, FeatureWishStatus, MailAdresses } from 'repo-depkit-common';
import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { ItemsServiceHelper } from '../helpers/ItemsServiceHelper';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { WorkflowScheduleHelper } from '../workflows-runs-hook';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { DirectusOpenAiCompatibleClient } from '../helpers/ai/DirectusOpenAiCompatibleClient';
import { FeatureWishModeration } from './FeatureWishModeration';
import { FeatureWishDailyReport } from './FeatureWishDailyReport';

const HOOK_NAME = 'feature-wishes-daily-workflow';
const WORKFLOW_ID = 'feature-wishes-daily';

const REPORT_FIELDS = ['id', 'title', 'description', 'status', 'likes_amount', 'likes_amount_last_checked', 'moderation_note_intern'];

type FeatureWish = DatabaseTypes.FeatureWhishes;

class FeatureWishesDailyWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    const myDatabaseHelper = context.myDatabaseHelper;
    const helper = myDatabaseHelper.getItemsServiceHelper<FeatureWish>(CollectionNames.FEATURE_WHISHES);
    const runNotes: string[] = [];
    let failed = false;

    try {
      runNotes.push(await this.reviewWithAi(context, helper));
    } catch (error) {
      failed = true;
      const message = 'KI-Prüfung fehlgeschlagen: ' + (error instanceof Error ? error.message : String(error));
      runNotes.push(message);
      await context.logger.appendLog(message);
    }

    try {
      const inReview = await helper.readByQuery({
        filter: { status: { _in: FeatureWishHelper.IN_REVIEW_STATUSES } } as any,
        fields: REPORT_FIELDS,
        sort: ['date_created'],
        limit: -1,
      });
      const published = await helper.readByQuery({
        filter: { status: { _eq: FeatureWishStatus.PUBLISHED } } as any,
        fields: REPORT_FIELDS,
        limit: -1,
      });
      const likeChanges = published.filter(wish => FeatureWishDailyReport.getDelta(wish) !== 0);

      const serverInfo = await myDatabaseHelper.getServerInfo();
      const report = FeatureWishDailyReport.build({
        projectName: serverInfo?.project?.project_name || 'Rocket Meals',
        itemBaseUrl: `${myDatabaseHelper.getServerUrl()}/admin/content/${CollectionNames.FEATURE_WHISHES}/`,
        inReview,
        likeChanges,
        runNotes,
      });
      if (report) {
        await myDatabaseHelper.sendMail({ recipient: MailAdresses.SupportMail, subject: report.subject, markdown_content: report.markdown });
        await context.logger.appendLog(`Mail sent: ${inReview.length} waiting, ${likeChanges.length} with changed likes`);
      } else {
        await context.logger.appendLog('Nothing to report, no mail sent');
      }

      for (const wish of likeChanges) {
        await helper.updateOneWithoutHookTrigger({ primary_key: wish.id, update: { likes_amount_last_checked: wish.likes_amount ?? 0 } });
      }
    } catch (error) {
      failed = true;
      await context.logger.appendLog('Report failed: ' + (error instanceof Error ? error.message : String(error)));
    }

    return context.logger.getFinalLogWithStateAndParams({ state: failed ? WORKFLOW_RUN_STATE.FAILED : WORKFLOW_RUN_STATE.SUCCESS });
  }

  /** Lets the AI suggest a decision for the wishes in `draft`. Returns a line for the mail. */
  private async reviewWithAi(context: WorkflowRunContext, helper: ItemsServiceHelper<FeatureWish>): Promise<string> {
    const client = await DirectusOpenAiCompatibleClient.fromDirectusSettings(context.myDatabaseHelper.apiContext);
    if (!client) {
      await context.logger.appendLog('No OpenAI-compatible provider in the Directus settings (Settings → AI), AI review skipped');
      return 'KI-Prüfung übersprungen: kein OpenAI-kompatibler Anbieter in den Directus-Einstellungen.';
    }

    const candidates = (await helper.readByQuery({
      filter: { _and: [{ status: { _eq: FeatureWishStatus.DRAFT } }, { title: { _nnull: true } }] } as any,
      fields: ['id', 'title', 'description'],
      sort: ['date_created'],
      limit: FeatureWishModeration.MAX_CANDIDATES_PER_RUN,
    })) as FeatureWish[];
    if (candidates.length === 0) {
      await context.logger.appendLog('No wishes in draft, AI review not needed');
      return 'KI-Prüfung: keine neuen Wünsche.';
    }

    const published = (await helper.readByQuery({
      filter: { status: { _eq: FeatureWishStatus.PUBLISHED } } as any,
      fields: ['id', 'title'],
      sort: ['-likes_amount'],
      limit: FeatureWishModeration.MAX_PUBLISHED_FOR_DUPLICATES,
    })) as FeatureWish[];

    const prompt = FeatureWishModeration.buildPrompt(
      candidates.map(wish => ({ id: wish.id, title: wish.title ?? '', description: wish.description ?? null })),
      published.map(wish => ({ id: wish.id, title: wish.title ?? '' }))
    );
    await context.logger.appendLog(`Asking the AI about ${candidates.length} wishes (${published.length} published for duplicates)`);
    const answer = await client.chatJson(prompt);

    const result = FeatureWishModeration.parseDecisions(answer, new Set(candidates.map(wish => wish.id)), new Set(published.map(wish => wish.id)));
    for (const update of result.updates) {
      await helper.updateOne(update.id, { status: update.status, related_to: update.related_to, moderation_note_intern: update.moderation_note_intern });
    }
    for (const reason of result.ignored) {
      await context.logger.appendLog('Ignored part of the AI answer: ' + reason);
    }
    await context.logger.appendLog(`AI suggestions saved: ${result.updates.length}, ignored: ${result.ignored.length}`);
    const unanswered = candidates.length - result.updates.length;
    return `KI-Prüfung: ${result.updates.length} Vorschläge gespeichert` + (unanswered > 0 ? `, ${unanswered} bleiben ungeprüft für den nächsten Lauf.` : '.');
  }
}

export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async ({ schedule }, apiContext) => {
  await WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns({
    workflowRunInterface: new FeatureWishesDailyWorkflow(),
    myDatabaseHelper: new MyDatabaseHelper(apiContext),
    schedule: schedule,
    cronOject: CronHelper.EVERY_DAY_AT_20,
  });
});
