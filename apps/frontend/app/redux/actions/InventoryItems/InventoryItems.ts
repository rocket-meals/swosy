import { CollectionNames, DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper';

/**
 * Collection access for the experimental inventory feature.
 * Mirrors the pattern of `FormsHelper` (redux/actions/Forms/Forms.ts).
 */
export class InventoryItemsHelper extends CollectionHelper<DatabaseTypes.InventoryItems> {
	constructor(client?: any) {
		super(CollectionNames.INVENTORY_ITEMS, client);
	}

	async fetchInventoryItems(queryOverride?: Query<DatabaseTypes.InventoryItems>) {
		const defaultQuery: Query<DatabaseTypes.InventoryItems> = {
			fields: ['*'],
			limit: -1,
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}

	async fetchInventoryItemById(id: string, queryOverride?: Query<DatabaseTypes.InventoryItems>) {
		const defaultQuery: Query<DatabaseTypes.InventoryItems> = {
			fields: ['*'],
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItem(id, query);
	}

	async createInventoryItem(data: Partial<DatabaseTypes.InventoryItems>) {
		return await this.createItem(data);
	}
}
