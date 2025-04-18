import { CollectionHelper } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class PopupEventsHelper extends CollectionHelper<any> {
  constructor(client?: any) {
    super('popup_events', client || ServerAPI.getClient());
  }

  async fetchAllPopupEvents(queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['* , translations.*, canteens.*'],
      limit: -1,
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItems(query);
  }

  async fetchPopupEventsById(id: string, queryOverride: any = {}) {
    const defaultQuery = {
      fields: ['*, translations.*'],
    };

    const query = { ...defaultQuery, ...queryOverride };
    return await this.readItem(id, query);
  }
}
