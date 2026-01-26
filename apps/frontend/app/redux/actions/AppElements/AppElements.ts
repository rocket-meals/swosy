import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class AppElementsHelper extends CollectionHelper<DatabaseTypes.AppElements> {
	constructor(client?: any) {
		super('app_elements', client);
	}

	async fetchAllAppElements(queryOverride?: Query<DatabaseTypes.AppElements>) {
		const defaultQuery = {
			fields: ['* , translations.*'],
			limit: -1,
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}

	async fetchAppElementsById(id: string, queryOverride?: Query<DatabaseTypes.AppElements>) {
		const defaultQuery = {
			fields: ['*, translations.*'],
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItem(id, query);
	}
}
