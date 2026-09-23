import { describe, expect, it } from '@jest/globals';
import { INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE, InactiveUsersCleanupHelper } from '../InactiveUsersCleanupHelper';
import { InactiveUsersCleanupWorkflow } from '../InactiveUsersCleanupWorkflow';
import { WorkflowRunContext } from '../../helpers/WorkflowRunContext';
import { WorkflowRunLogger } from '../../workflows-runs-hook/WorkflowRunJobInterface';
import { WORKFLOW_RUN_STATE } from '../../helpers/itemServiceHelpers/WorkflowsRunEnum';

describe('InactiveUsersCleanupHelper.parseInput', () => {
  it('fails without input', () => {
    expect(InactiveUsersCleanupHelper.parseInput(undefined).error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput(null).error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('').error).toBeDefined();
  });

  it('fails on invalid JSON or non-objects', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{delete_users: true').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('[]').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('true').error).toBeDefined();
  });

  it('requires delete_users as boolean', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{}').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": "true"}').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": 1}').error).toBeDefined();
  });

  it('fails on unknown keys so a typo never goes unnoticed', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days": 30}').error).toContain('days');
  });

  it('accepts only a positive integer for days_inactive', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days_inactive": 0}').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days_inactive": -5}').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days_inactive": 1.5}').error).toBeDefined();
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false, "days_inactive": "30"}').error).toBeDefined();
  });

  it('uses the default days_inactive when not given', () => {
    expect(InactiveUsersCleanupHelper.parseInput('{"delete_users": false}').input).toEqual({
      delete_users: false,
      days_inactive: INACTIVE_USERS_CLEANUP_DEFAULT_DAYS_INACTIVE,
    });
  });

  it('accepts a parsed object as well as a JSON string', () => {
    expect(InactiveUsersCleanupHelper.parseInput({ delete_users: true, days_inactive: 30 }).input).toEqual({ delete_users: true, days_inactive: 30 });
  });
});

describe('InactiveUsersCleanupHelper.isAdmin', () => {
  const adminPolicy = { policy: { admin_access: true } };
  const appPolicy = { policy: { admin_access: false } };

  it('detects admin access on the user, its role and the role parent', () => {
    expect(InactiveUsersCleanupHelper.isAdmin({ id: 'u', policies: [appPolicy, adminPolicy] })).toBe(true);
    expect(InactiveUsersCleanupHelper.isAdmin({ id: 'u', role: { policies: [adminPolicy] } })).toBe(true);
    expect(InactiveUsersCleanupHelper.isAdmin({ id: 'u', role: { policies: [appPolicy], parent: { policies: [adminPolicy] } } })).toBe(true);
  });

  it('treats users without an admin policy as non-admins', () => {
    expect(InactiveUsersCleanupHelper.isAdmin({ id: 'u' })).toBe(false);
    expect(InactiveUsersCleanupHelper.isAdmin({ id: 'u', policies: [appPolicy], role: 'role-id' })).toBe(false);
  });
});

type FakeUser = { id: string; last_access: string | null; profile: string | null; policies?: unknown[] };

function createContext(input: string | null, users: FakeUser[]) {
  const deletedUsers: string[] = [];
  const deletedProfiles: string[] = [];
  let remainingUsers = [...users];
  const usersHelper = {
    countItems: async (query: any) => {
      if (query.filter.last_access) {
        return remainingUsers.filter(u => u.last_access === null).length;
      }
      return remainingUsers.filter(u => u.profile === query.filter.profile._eq).length;
    },
    readByQuery: async (query: any) => remainingUsers.filter(u => u.last_access !== null && u.last_access < query.filter.last_access._lt),
    deleteOneWithUsersService: async (id: string) => {
      deletedUsers.push(id);
      remainingUsers = remainingUsers.filter(u => u.id !== id);
    },
  };
  const profilesHelper = {
    deleteOne: async (id: string) => {
      deletedProfiles.push(id);
      return id;
    },
  };
  const myDatabaseHelper = {
    getUsersHelper: () => usersHelper,
    getProfilesHelper: () => profilesHelper,
    getWorkflowsRunsHelper: () => ({ updateOneWithoutHookTrigger: async () => undefined }),
  } as any;
  const workflowRun = { id: 'run', input } as any;
  const logger = new WorkflowRunLogger(workflowRun, myDatabaseHelper);
  const context = new WorkflowRunContext(workflowRun, myDatabaseHelper, logger);
  return { context, deletedUsers, deletedProfiles };
}

describe('InactiveUsersCleanupWorkflow', () => {
  const old = '2000-01-01T00:00:00.000Z';
  const recent = new Date().toISOString();
  const users: FakeUser[] = [
    { id: 'inactive-alone', last_access: old, profile: 'profile-alone' },
    { id: 'inactive-shared', last_access: old, profile: 'profile-shared' },
    { id: 'active-shared', last_access: recent, profile: 'profile-shared' },
    { id: 'inactive-admin', last_access: old, profile: 'profile-admin', policies: [{ policy: { admin_access: true } }] },
    { id: 'never-accessed', last_access: null, profile: null },
  ];

  it('fails and deletes nothing without valid input', async () => {
    const { context, deletedUsers } = createContext(null, users);
    const result = await new InactiveUsersCleanupWorkflow().runJob(context);
    expect(result.state).toBe(WORKFLOW_RUN_STATE.FAILED);
    expect(deletedUsers).toEqual([]);
  });

  it('only reports outdated users when delete_users is false', async () => {
    const { context, deletedUsers, deletedProfiles } = createContext('{"delete_users": false}', users);
    const result = await new InactiveUsersCleanupWorkflow().runJob(context);
    expect(result.state).toBe(WORKFLOW_RUN_STATE.SUCCESS);
    expect(deletedUsers).toEqual([]);
    expect(deletedProfiles).toEqual([]);
    const output = JSON.parse(result.output as string);
    expect(output.users_inactive_total).toBe(3);
    expect(output.users_inactive_admins_skipped).toBe(1);
    expect(output.users_inactive_to_delete).toBe(2);
    expect(output.users_never_accessed).toBe(1);
  });

  it('deletes outdated non-admins and only profiles no other user points to', async () => {
    const { context, deletedUsers, deletedProfiles } = createContext('{"delete_users": true, "days_inactive": 30}', users);
    const result = await new InactiveUsersCleanupWorkflow().runJob(context);
    expect(result.state).toBe(WORKFLOW_RUN_STATE.SUCCESS);
    expect(deletedUsers).toEqual(['inactive-alone', 'inactive-shared']);
    expect(deletedProfiles).toEqual(['profile-alone']);
    const output = JSON.parse(result.output as string);
    expect(output.profiles_kept_still_in_use).toBe(1);
  });
});
