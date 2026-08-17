import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';

/**
 * Write-only access to the `app_usage_events` collection.
 *
 * The collection only grants the `create` action (also for anonymous users),
 * so the app may report events but never read them back.
 */
export class AppUsageEvents extends CollectionHelper<DatabaseTypes.AppUsageEvents> {
	constructor(client?: any) {
		// Pass the collection name and API client
		super('app_usage_events', client);
	}

	async createAppUsageEvent(data: Partial<DatabaseTypes.AppUsageEvents>) {
		return await this.createItem(data);
	}
}
