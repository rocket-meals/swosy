import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper';

export class OrganizationsHelper extends CollectionHelper<DatabaseTypes.Organizations> {
	constructor(client?: any) {
		super('organizations', client);
	}

	async fetchOrganizations(queryOverride?: Query<DatabaseTypes.Organizations>) {
		const defaultQuery = {
			fields: ['*'],
			limit: -1,
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}
}
