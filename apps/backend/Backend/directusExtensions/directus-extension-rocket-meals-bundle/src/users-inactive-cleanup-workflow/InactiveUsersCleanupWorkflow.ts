import { DatabaseTypes } from 'repo-depkit-common';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import { INACTIVE_USERS_CLEANUP_EXPECTED_INPUT, INACTIVE_USERS_CLEANUP_WORKFLOW_ID, InactiveUsersCleanupHelper, InactiveUsersCleanupInput } from './InactiveUsersCleanupHelper';

/**
 * Counts users whose last access is older than `days_inactive` days and - only with `delete_users: true` -
 * deletes them. Admins are never deleted. A deleted user's profile goes too, unless another user still
 * points to it. A run without valid input fails before reading any user.
 */
export class InactiveUsersCleanupWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return INACTIVE_USERS_CLEANUP_WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    let input: InactiveUsersCleanupInput;
    try {
      input = InactiveUsersCleanupHelper.parseInput(context.workflowRun.input);
    } catch (e) {
      await context.logger.appendLog('Invalid input: ' + (e instanceof Error ? e.message : String(e)));
      await context.logger.appendLog('Expected input: ' + INACTIVE_USERS_CLEANUP_EXPECTED_INPUT);
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.FAILED });
    }
    await context.logger.appendLog('Input: ' + JSON.stringify(input));

    const usersHelper = context.myDatabaseHelper.getUsersHelper();
    const cutoffDate = new Date(Date.now() - input.days_inactive * 24 * 60 * 60 * 1000).toISOString();
    const inactiveUsers = await usersHelper.readByQuery({
      filter: { last_access: { _lt: cutoffDate } },
      fields: ['id', 'last_access', 'profile'],
      limit: -1,
    });

    const usersToDelete: DatabaseTypes.DirectusUsers[] = [];
    for (const user of inactiveUsers) {
      if (!(await usersHelper.isAdminUser(user.id))) {
        usersToDelete.push(user);
      }
    }
    await context.logger.appendLog('Users inactive since before ' + cutoffDate + ': ' + inactiveUsers.length);
    await context.logger.appendLog('- admins (never deleted): ' + (inactiveUsers.length - usersToDelete.length));
    await context.logger.appendLog('- outdated users: ' + usersToDelete.length);

    if (!input.delete_users) {
      await context.logger.appendLog('"delete_users" is false - no users deleted.');
      return context.logger.getFinalLogWithStateAndParams({ state: WORKFLOW_RUN_STATE.SUCCESS });
    }

    let errors = 0;
    for (const user of usersToDelete) {
      try {
        await usersHelper.deleteOneWithUsersService(user.id);
        const profileId = typeof user.profile === 'object' ? user.profile?.id : user.profile;
        if (profileId && (await usersHelper.countItems({ filter: { profile: { _eq: profileId } } })) === 0) {
          await context.myDatabaseHelper.getProfilesHelper().deleteOne(profileId);
        }
      } catch (e) {
        errors++;
        await context.logger.appendLog('Error deleting user ' + user.id + ': ' + (e instanceof Error ? e.message : String(e)));
      }
    }
    await context.logger.appendLog('Users deleted: ' + (usersToDelete.length - errors) + ', errors: ' + errors);

    return context.logger.getFinalLogWithStateAndParams({
      state: errors > 0 ? WORKFLOW_RUN_STATE.FAILED : WORKFLOW_RUN_STATE.SUCCESS,
    });
  }
}
