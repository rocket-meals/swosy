import { describe, expect, it } from '@jest/globals';
import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { UserHelper } from '../UserHelper';
import { ItemsService } from '../ItemsServiceCreator';
import { MyDatabaseHelperInterface } from '../MyDatabaseHelperInterface';

class UserHelperWithFakeItemsService extends UserHelper {
  public created: Partial<DatabaseTypes.DirectusUsers>[] = [];

  protected override async getItemsService(): Promise<ItemsService<DatabaseTypes.DirectusUsers>> {
    return {
      createOne: async (data: Partial<DatabaseTypes.DirectusUsers>) => {
        this.created.push(data);
        return 'new-user-id';
      },
    } as unknown as ItemsService<DatabaseTypes.DirectusUsers>;
  }
}

describe('UserHelper', () => {
  it('keeps the given user status on create instead of setting "published"', async () => {
    const myDatabaseHelper = { apiContext: { database: {} }, eventContext: undefined } as unknown as MyDatabaseHelperInterface;
    const helper = new UserHelperWithFakeItemsService(myDatabaseHelper, CollectionNames.USERS);

    const id = await helper.createOne({ email: 'guest-a@guest.example.com', status: 'active' });

    expect(id).toBe('new-user-id');
    expect(helper.created).toHaveLength(1);
    expect(helper.created[0]?.status).toBe('active');
  });
});
