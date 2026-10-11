import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper, Query } from '@/helper/collectionHelper'; // Reusing the CollectionHelper
 // API client

export class AppSettingsHelper extends CollectionHelper<DatabaseTypes.AppSettings> {
	constructor(client?: any) {
		// Pass the collection name and API client
		super('app_settings', client);
	}

	// Fetch all app settings with optional query overrides
	async fetchAppSettings(queryOverride?: Query<DatabaseTypes.AppSettings>) {
		const defaultQuery = {
			fields: ['*', 'translations.*', 'housing_translations.*', 'balance_translations.*', 'login_screen_translations.*'],
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readSingletonItem(query);
	}

	/**
	 * Only the maintenance fields, for refreshing them while the app runs
	 * (MaintenanceBanner, MaintenanceModal). Merged into the cached app settings
	 * by the caller, so the other settings stay as they are.
	 */
	async fetchMaintenanceWindow(): Promise<MaintenanceWindowFields> {
		const result = (await this.fetchAppSettings({ fields: [...MAINTENANCE_WINDOW_FIELDS] })) as Partial<DatabaseTypes.AppSettings> | null;
		return {
			maintenance_start: result?.maintenance_start ?? null,
			maintenance_end: result?.maintenance_end ?? null,
			maintenance_message: result?.maintenance_message ?? null,
		};
	}
}

export const MAINTENANCE_WINDOW_FIELDS = ['maintenance_start', 'maintenance_end', 'maintenance_message'] as const;

export type MaintenanceWindowFields = Pick<DatabaseTypes.AppSettings, (typeof MAINTENANCE_WINDOW_FIELDS)[number]>;
