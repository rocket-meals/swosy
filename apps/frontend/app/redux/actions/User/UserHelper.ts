import { CollectionHelper } from '@/helper/collectionHelper';
import { CollectionKeys } from '@/constants/collectionKeys';
import { DatabaseTypes } from 'repo-depkit-common';

export class UserHelper extends CollectionHelper<DatabaseTypes.DirectusUsers> {
	constructor(client?: any) {
		super(CollectionKeys.DIRECTUS_USERS, client);
	}

	// Total number of users, e.g. for the onboarding counter ("Du und 12.345 andere").
	// Resolves to null when the server returns no usable count; request errors are thrown.
	async fetchUserCount(): Promise<number | null> {
		const result = (await this.aggregateItems({
			aggregate: { count: '*' },
		})) as { count: string | number }[];
		const rawCount = result?.[0]?.count;
		const count = typeof rawCount === 'number' ? rawCount : Number.parseInt(rawCount as string, 10);
		return Number.isFinite(count) && count > 0 ? count : null;
	}
}
