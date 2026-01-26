import { CollectionHelper, Query } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class DynamicCollectionHelper<T extends Record<string, unknown>> extends CollectionHelper<T> {
	constructor(collection: string, client?: any) {
		super(collection, client);
	}

	async fectAllCollection(queryOverride?: Query<T>) {
		const defaultQuery = {
			fields: ['*', 'translations.*'],
			limit: -1, // Fetch all
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}
}
