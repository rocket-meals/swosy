/**
 * workflows-schedules-endpoint – which workflows this server runs and when they fire next.
 *
 * `GET /rocket-meals-workflows/schedules` answers with one entry per registered workflow:
 * `{ workflow_id, cron, next_runs, input_template }` (`WorkflowScheduleInfo`). The page "Workflows"
 * of the Rocket Meals module needs it, because the schedules live in the code of the hooks
 * (`WorkflowScheduleHelper.registerScheduleToRunWorkflowRuns`), not in the database.
 *
 * The next runs are computed here and not in the browser: Directus fires the schedules in the time
 * zone of the server (`TZ` of the container), which need not be the one of the person looking.
 *
 * Only for logged-in users; reveals nothing but workflow ids and their schedules.
 */

import { defineEndpoint } from '@directus/extensions-sdk';
import { Accountability } from '@directus/types';
import { WorkflowScheduler } from '../workflows-runs-hook';
import { CronScheduleHelper } from '../helpers/CronScheduleHelper';
import { WorkflowScheduleInfo, WorkflowsPageHelper, WorkflowsSchedulesResponse } from '../helpers/rocket-meals-module/WorkflowsPageHelper';

const ENDPOINT_ID = 'rocket-meals-workflows';

function getNextRuns(cron: string | undefined, now: Date): string[] {
  if (!cron) {
    return [];
  }
  try {
    return CronScheduleHelper.getNextRuns(cron, now, WorkflowsPageHelper.UPCOMING_RUNS).map(date => date.toISOString());
  } catch (error) {
    console.error(ENDPOINT_ID + ': cannot read cron string ' + cron, error);
    return [];
  }
}

export default defineEndpoint({
  id: ENDPOINT_ID,
  handler: router => {
    router.get('/schedules', (req: any, res: any) => {
      const accountability = req?.accountability as Accountability | undefined;
      if (!accountability?.user) {
        return res.status(401).json({ error: 'Authentication required.' });
      }

      const now = new Date();
      const data: WorkflowScheduleInfo[] = WorkflowScheduler.getRegisteredWorkflowsIds().map(workflowId => {
        const cron = WorkflowScheduler.getRegisteredSchedule(workflowId);
        return {
          workflow_id: workflowId,
          cron: cron ?? null,
          next_runs: getNextRuns(cron, now),
          input_template: WorkflowScheduler.getRegisteredWorkflow(workflowId)?.getInputTemplate?.() ?? null,
        };
      });
      const response: WorkflowsSchedulesResponse = { data };
      res.set('Cache-Control', 'no-store');
      return res.json(response);
    });
  },
});
