import { DatabaseTypes } from 'repo-depkit-common';
import { SingleWorkflowRun } from '../workflows-runs-hook/WorkflowRunJobInterface';
import { WorkflowRunContext } from '../helpers/WorkflowRunContext';
import { WORKFLOW_RUN_STATE } from '../helpers/itemServiceHelpers/WorkflowsRunEnum';
import {
  INACTIVE_USERS_CLEANUP_EXPECTED_INPUT,
  INACTIVE_USERS_CLEANUP_USER_FIELDS,
  INACTIVE_USERS_CLEANUP_WORKFLOW_ID,
  InactiveUserCandidate,
  InactiveUsersCleanupHelper,
  InactiveUsersCleanupInput,
  InactiveUsersCleanupInputKeys,
} from './InactiveUsersCleanupHelper';

type InactiveUsersCleanupStatistics = {
  days_inactive: number;
  inactive_since_before: string;
  delete_users: boolean;
  users_inactive_total: number;
  users_inactive_admins_skipped: number;
  users_inactive_to_delete: number;
  users_never_accessed: number;
  users_deleted: number;
  users_delete_errors: number;
  profiles_deleted: number;
  profiles_kept_still_in_use: number;
  profiles_delete_errors: number;
};

/**
 * Finds users whose last access is older than `days_inactive` days and - only when the run's input
 * says `delete_users: true` - deletes them. Admins are never touched. The user's profile is deleted
 * with it unless another user still points to that profile.
 *
 * Runs are started by hand with an input; a run without valid input fails before reading any user.
 */
export class InactiveUsersCleanupWorkflow extends SingleWorkflowRun {
  getWorkflowId(): string {
    return INACTIVE_USERS_CLEANUP_WORKFLOW_ID;
  }

  async runJob(context: WorkflowRunContext): Promise<Partial<DatabaseTypes.WorkflowsRuns>> {
    const parseResult = InactiveUsersCleanupHelper.parseInput(context.workflowRun.input);
    if (!parseResult.input) {
      await context.logger.appendLog('Invalid input: ' + parseResult.error);
      await context.logger.appendLog('Expected input: ' + INACTIVE_USERS_CLEANUP_EXPECTED_INPUT);
      return context.logger.getFinalLogWithStateAndParams({
        state: WORKFLOW_RUN_STATE.FAILED,
      });
    }
    const input = parseResult.input;
    await context.logger.appendLog('Input: ' + JSON.stringify(input));

    const cutoffDate = InactiveUsersCleanupHelper.getCutoffDate(new Date(), input[InactiveUsersCleanupInputKeys.days_inactive]);
    const statistics = await this.collectStatistics(context, input, cutoffDate);
    const inactiveUsers = await this.readInactiveUsers(context, cutoffDate);

    const usersToDelete = inactiveUsers.filter(user => !InactiveUsersCleanupHelper.isAdmin(user));
    statistics.users_inactive_total = inactiveUsers.length;
    statistics.users_inactive_admins_skipped = inactiveUsers.length - usersToDelete.length;
    statistics.users_inactive_to_delete = usersToDelete.length;

    await context.logger.appendLog('Users inactive since before ' + statistics.inactive_since_before + ': ' + statistics.users_inactive_total);
    await context.logger.appendLog('- of which admins (never deleted): ' + statistics.users_inactive_admins_skipped);
    await context.logger.appendLog('- outdated users that may be deleted: ' + statistics.users_inactive_to_delete);
    await context.logger.appendLog('Users without any recorded access (not counted as outdated): ' + statistics.users_never_accessed);

    if (!input[InactiveUsersCleanupInputKeys.delete_users]) {
      await context.logger.appendLog('"' + InactiveUsersCleanupInputKeys.delete_users + '" is false - no users deleted.');
      return this.finish(context, statistics);
    }

    for (const user of usersToDelete) {
      await this.deleteUserAndUnusedProfile(context, user, statistics);
    }

    await context.logger.appendLog('Users deleted: ' + statistics.users_deleted + ' (errors: ' + statistics.users_delete_errors + ')');
    await context.logger.appendLog('Profiles deleted: ' + statistics.profiles_deleted + ', kept because still in use: ' + statistics.profiles_kept_still_in_use + ' (errors: ' + statistics.profiles_delete_errors + ')');
    return this.finish(context, statistics);
  }

  private async collectStatistics(context: WorkflowRunContext, input: InactiveUsersCleanupInput, cutoffDate: Date): Promise<InactiveUsersCleanupStatistics> {
    const usersNeverAccessed = await context.myDatabaseHelper.getUsersHelper().countItems({
      filter: { last_access: { _null: true } },
    });
    return {
      days_inactive: input[InactiveUsersCleanupInputKeys.days_inactive],
      inactive_since_before: cutoffDate.toISOString(),
      delete_users: input[InactiveUsersCleanupInputKeys.delete_users],
      users_inactive_total: 0,
      users_inactive_admins_skipped: 0,
      users_inactive_to_delete: 0,
      users_never_accessed: usersNeverAccessed,
      users_deleted: 0,
      users_delete_errors: 0,
      profiles_deleted: 0,
      profiles_kept_still_in_use: 0,
      profiles_delete_errors: 0,
    };
  }

  private async readInactiveUsers(context: WorkflowRunContext, cutoffDate: Date): Promise<InactiveUserCandidate[]> {
    const users = await context.myDatabaseHelper.getUsersHelper().readByQuery({
      filter: { last_access: { _lt: cutoffDate.toISOString() } },
      fields: INACTIVE_USERS_CLEANUP_USER_FIELDS,
      limit: -1,
    });
    return users as unknown as InactiveUserCandidate[];
  }

  private async deleteUserAndUnusedProfile(context: WorkflowRunContext, user: InactiveUserCandidate, statistics: InactiveUsersCleanupStatistics): Promise<void> {
    const profileId = InactiveUsersCleanupHelper.getProfileId(user);
    try {
      await context.myDatabaseHelper.getUsersHelper().deleteOneWithUsersService(user.id);
      statistics.users_deleted++;
    } catch (e) {
      statistics.users_delete_errors++;
      await context.logger.appendLog('Error deleting user ' + user.id + ': ' + (e instanceof Error ? e.message : String(e)));
      return;
    }

    if (!profileId) {
      return;
    }

    try {
      const otherUsersWithProfile = await context.myDatabaseHelper.getUsersHelper().countItems({
        filter: { profile: { _eq: profileId } },
      });
      if (otherUsersWithProfile > 0) {
        statistics.profiles_kept_still_in_use++;
        return;
      }
      await context.myDatabaseHelper.getProfilesHelper().deleteOne(profileId);
      statistics.profiles_deleted++;
    } catch (e) {
      statistics.profiles_delete_errors++;
      await context.logger.appendLog('Error deleting profile ' + profileId + ' of user ' + user.id + ': ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  private finish(context: WorkflowRunContext, statistics: InactiveUsersCleanupStatistics): Partial<DatabaseTypes.WorkflowsRuns> {
    const hadErrors = statistics.users_delete_errors > 0 || statistics.profiles_delete_errors > 0;
    return context.logger.getFinalLogWithStateAndParams({
      state: hadErrors ? WORKFLOW_RUN_STATE.FAILED : WORKFLOW_RUN_STATE.SUCCESS,
      output: JSON.stringify(statistics, null, 2),
    });
  }
}
