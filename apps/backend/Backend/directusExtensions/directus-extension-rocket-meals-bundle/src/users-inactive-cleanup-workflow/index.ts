import { MyDefineHook } from '../helpers/MyDefineHook';
import { MyDatabaseHelper } from '../helpers/MyDatabaseHelper';
import { WorkflowScheduler, createWorkflowIfNotExisting } from '../workflows-runs-hook';
import { InactiveUsersCleanupWorkflow } from './InactiveUsersCleanupWorkflow';
import { INACTIVE_USERS_CLEANUP_WORKFLOW_ID } from './InactiveUsersCleanupHelper';

const HOOK_NAME = 'users-inactive-cleanup-workflow';

// No schedule on purpose: a run needs an input ({ "delete_users": <boolean> }) and fails without one,
// so runs are started by hand from the workflows_runs collection.
export default MyDefineHook.defineHookWithAllTablesExisting(HOOK_NAME, async (registerFunctions, apiContext) => {
  WorkflowScheduler.registerWorkflow(new InactiveUsersCleanupWorkflow());

  try {
    // make the workflow selectable for a new run before it ever ran
    await createWorkflowIfNotExisting(INACTIVE_USERS_CLEANUP_WORKFLOW_ID, new MyDatabaseHelper(apiContext));
  } catch (e) {
    apiContext.logger.error(HOOK_NAME + ': could not create workflow ' + INACTIVE_USERS_CLEANUP_WORKFLOW_ID + ': ' + (e instanceof Error ? e.message : String(e)));
  }
});
