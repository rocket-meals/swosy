import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

export class AppFeedback extends CollectionHelper<DatabaseTypes.AppFeedbacks> {
	constructor(client?: any) {
		// Pass the collection name and API client
		super('app_feedbacks', client);
	}

	// Fetch all app settings with optional query overrides
	async fetchAppFeedback(queryOverride?: Query<DatabaseTypes.AppFeedbacks>) {
		const defaultQuery = {
			fields: ['*'],
			sort: ['sort', '-date_created'],
			filter: {},
			limit: 100,
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}

	async fetchAppFeedbackById(id: string, queryOverride?: Query<DatabaseTypes.AppFeedbacks>) {
		const defaultQuery = {
			fields: ['*'],
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItem(id, query);
	}

	async updateAppFeedback(id: string, updatedData: Partial<DatabaseTypes.AppFeedbacks>) {
		return await this.updateItem(id, updatedData);
	}

	async createAppFeedback(data: Partial<DatabaseTypes.AppFeedbacks>) {
		return await this.createItem(data);
	}
}
