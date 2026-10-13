import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';
import { CollectionKeys } from '@/constants/collectionKeys';

export class UserHelper extends CollectionHelper<DatabaseTypes.DirectusUsers> {
	constructor(client?: any) {
		super(CollectionKeys.DIRECTUS_USERS, client);
	}

	public static isAnonymousUser(user: Record<string, any> | DatabaseTypes.DirectusUsers | null): boolean {
		return !user?.id;
	}

	public static isRegisteredUser(user: Record<string, any> | DatabaseTypes.DirectusUsers | null): boolean {
		return !!user?.id;
	}

	// Total number of users. Resolves to null when the server returns no usable count;
	// request errors are thrown.
	async fetchUserCount(): Promise<number | null> {
		const result = (await this.aggregateItems({
			aggregate: { count: '*' },
		})) as { count: string | number }[];
		const rawCount = result?.[0]?.count;
		const count = typeof rawCount === 'number' ? rawCount : Number.parseInt(rawCount as string, 10);
		return Number.isFinite(count) && count > 0 ? count : null;
	}
}
