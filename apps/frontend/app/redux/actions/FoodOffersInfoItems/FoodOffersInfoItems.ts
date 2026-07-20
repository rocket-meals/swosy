import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';

export class FoodOffersInfoItemsHelper extends CollectionHelper<DatabaseTypes.FoodoffersInfoItems> {
	constructor(client?: any) {
		super('foodoffers_info_items', client);
	}

	async fetchFoodOffersInfoItems(queryOverride: any = {}) {
		const defaultQuery = {
			fields: ['*', 'image.*'],
			limit: -1,
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}
}
