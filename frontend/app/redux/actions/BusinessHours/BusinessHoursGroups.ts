import { BusinesshoursGroups } from '@/constants/types';
import { CollectionHelper } from '@/helper/collectionHelper'; // Reusing the CollectionHelper
import { ServerAPI } from '@/redux/actions/Auth/Auth'; // API client

export class BusinessHoursGroupsHelper extends CollectionHelper<BusinesshoursGroups> {
  constructor(client?: any) {
    super('businesshours_groups', client || ServerAPI.getClient());
  }

  async fetchBusinessHoursGroups(queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['*, translations.*'],
      filter: { status: { _eq: 'published' } },
      sort: ['sort'],
      limit: -1,
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItems(query);
  }

  async fetchBusinessHoursGroupById(id: string, queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['*, translations.*'],
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItem(id, query);
  }
}
