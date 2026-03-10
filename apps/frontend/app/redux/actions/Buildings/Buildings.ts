import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper';

export class BuildingsOrganizationsHelper extends CollectionHelper<DatabaseTypes.BuildingsOrganizations> {
	constructor(client?: any) {
		super('buildings_organizations', client);
	}

	async fetchBuildingsOrganizations(queryOverride?: Query<DatabaseTypes.BuildingsOrganizations>) {
		const defaultQuery = {
			fields: ['*'],
			limit: -1,
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}
}

export class BuildingsHelper extends CollectionHelper<DatabaseTypes.Buildings> {
	constructor(client?: any) {
		// Pass the collection name and API client
		super('buildings', client);
	}

	// Fetch all buildings with optional query overrides
	async fetchBuildings(queryOverride?: Query<DatabaseTypes.Buildings>) {
		const defaultQuery = {
			fields: ['*', 'translations.*'],
			limit: -1, // Fetch all
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItems(query);
	}

	/**
	 * Converts the buildings_organizations join table into a dict keyed by building ID.
	 * Each value is the list of full Organizations objects linked to that building.
	 *
	 * @param buildingsOrganizations - rows from the buildings_organizations join table
	 * @param organizationsDict - organizations keyed by their ID
	 * @returns Record mapping each building ID to the array of Organizations linked to it
	 */
	static getBuildingIdToOrganizationsDict(
		buildingsOrganizations: DatabaseTypes.BuildingsOrganizations[],
		organizationsDict: Record<string, DatabaseTypes.Organizations>
	): Record<string, DatabaseTypes.Organizations[]> {
		const result: Record<string, DatabaseTypes.Organizations[]> = {};
		for (const entry of buildingsOrganizations) {
			const buildingId =
				typeof entry.buildings_id === 'string' ? entry.buildings_id : (entry.buildings_id as DatabaseTypes.Buildings | null)?.id;
			const orgId =
				typeof entry.organizations_id === 'string' ? entry.organizations_id : (entry.organizations_id as DatabaseTypes.Organizations | null)?.id;
			if (buildingId && orgId) {
				const org = organizationsDict[orgId];
				if (org) {
					if (!result[buildingId]) {
						result[buildingId] = [];
					}
					result[buildingId].push(org);
				}
			}
		}
		return result;
	}

	// Fetch a specific building by ID
	async fetchBuildingById(id: string, queryOverride?: Query<DatabaseTypes.Buildings>) {
		const defaultQuery = {
			fields: ['*', 'translations.*, businesshours.*'],
		};

		const query = { ...defaultQuery, ...(queryOverride || {}) };
		return await this.readItem(id, query);
	}

	// Create a new building
	async createBuilding(buildingData: Partial<DatabaseTypes.Buildings>) {
		return await this.createItem(buildingData);
	}

	// Update an existing building
	async updateBuilding(id: string, updatedData: Partial<DatabaseTypes.Buildings>) {
		return await this.updateItem(id, updatedData);
	}

	// Delete a building
	async deleteBuilding(id: string) {
		return await this.deleteItem(id);
	}
}
