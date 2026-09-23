import { Accountability, PrimaryKey } from '@directus/types';
import { DatabaseTypes } from 'repo-depkit-common';
import {ItemsServiceHelper, OptsCustomType} from "./ItemsServiceHelper";

const HELPER_NAME = 'UserHelper';

export class UserHelper extends ItemsServiceHelper<DatabaseTypes.DirectusUsers> {
  /**
   * Legt einen Nutzer an, ohne den Status zu überschreiben.
   *
   * `ItemsServiceHelper.createOne` setzt für Inhalte `status = 'published'`. Bei `directus_users`
   * wäre das kein gültiger Status: Directus lässt nur Nutzer mit `status = 'active'` einloggen und
   * antwortet sonst mit „Invalid user credentials“.
   */
  override async createOne(create: Partial<DatabaseTypes.DirectusUsers>, optsCustom?: OptsCustomType): Promise<PrimaryKey> {
    const itemsService = await this.getItemsService();
    return await itemsService.createOne(create, this.getOptsCustom(optsCustom));
  }

  /**
   * Deletes a user through Directus' `UsersService` instead of the plain `ItemsService`: it also
   * detaches comments, notifications and versions of the user, clears its sessions and refuses to
   * delete the last admin. The `users.delete` hooks run either way.
   */
  async deleteOneWithUsersService(userId: PrimaryKey): Promise<void> {
    const { UsersService } = this.apiContext.services;
    const schema = this.eventContext?.schema || (await this.apiContext.getSchema());
    const usersService = new UsersService({
      accountability: null, // this makes us admin
      knex: this.eventContext?.database || this.apiContext.database,
      schema: schema,
    });
    await usersService.deleteOne(userId);
  }

  isAdminAccountability(accountability?: Accountability | null): boolean {
    if (!accountability) {
      return false;
    }

    if (accountability.admin === true) {
      return true;
    }

    return (accountability as { adminAccess?: boolean }).adminAccess === true;
  }

  async isAdminUser(userId: string): Promise<boolean> {
    try {
      const user = await this.readOne(userId, {
        fields: ['id', 'policies.policy.admin_access', 'policies.directus_policies_id.admin_access', 'role.policies.policy.admin_access'],
      });

      // Admin access comes from a policy on the user itself or on its role (e.g. "Administrator")
      const role = user?.role as DatabaseTypes.DirectusRoles | string | null | undefined;
      const rolePolicies = typeof role === 'object' && role !== null ? role.policies || [] : [];
      const policies = [...(user?.policies || []), ...rolePolicies] as unknown[];

      return policies.some(policyEntry => {
        if (typeof policyEntry !== 'object' || policyEntry === null) {
          return false;
        }

        const access = policyEntry as {
          policy?: DatabaseTypes.DirectusPolicies | { admin_access?: boolean };
          directus_policies_id?: DatabaseTypes.DirectusPolicies | { admin_access?: boolean };
        };

        const policy = access.policy || access.directus_policies_id;
        return policy?.admin_access === true;
      });
    } catch (error) {
      console.error(`${HELPER_NAME}: Failed to resolve admin access for user ${userId}`, error);
      return false;
    }
  }
}
