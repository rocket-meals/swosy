import { News } from '@/constants/types';
import { CollectionHelper } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class NewsHelper extends CollectionHelper<News> {
  constructor(client?: any) {
    // Pass the collection name and API client
    super('news', client || ServerAPI.getClient());
  }

  // Fetch all news with optional query overrides
  async fetchNews(queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['* , translations.*'],
      limit: -1, // Fetch all
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItems(query);
  }

  // Fetch a specific news by ID
  async fetchNewsById(id: string, queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['*'],
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItem(id, query);
  }
}
