import * as Crypto from 'expo-crypto';
import { customEndpoint } from '@directus/sdk';
import { DatabaseTypes, FeatureWishStatus } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { CollectionKeys } from '@/constants/collectionKeys';

export type FeatureWish = DatabaseTypes.FeatureWhishes;

/** What the status endpoint answers for a wish submitted without account. */
export type FeatureWishState = Pick<FeatureWish, 'id' | 'status' | 'progress' | 'related_to' | 'date_updated' | 'date_created' | 'moderation_note_public'>;

const PUBLIC_FIELDS = ['id', 'status', 'title', 'description', 'progress', 'likes_amount', 'related_to', 'date_created', 'date_updated', 'moderation_note_public'];

/**
 * Access to `feature_whishes`. The backend decides from `related_to` whether a new row is a like or
 * a wish and sets `status` and `profile` itself (see feature-wishes-hook).
 *
 * The app chooses the ids of new rows: without account the new row cannot be read back (only
 * published wishes are readable), so the id is the only way to find it again.
 */
export class FeatureWishesHelper extends CollectionHelper<FeatureWish> {
	constructor(client?: any) {
		super(CollectionKeys.FEATURE_WHISHES, client);
	}

	async fetchPopular(limit = 20): Promise<FeatureWish[]> {
		return await this.readItems({
			fields: PUBLIC_FIELDS,
			filter: { status: { _eq: FeatureWishStatus.PUBLISHED } },
			sort: ['-likes_amount', '-date_created'],
			limit,
		});
	}

	async fetchByIds(ids: string[]): Promise<FeatureWish[]> {
		if (ids.length === 0) {
			return [];
		}
		return await this.readItems({ fields: PUBLIC_FIELDS, filter: { id: { _in: ids } }, limit: ids.length });
	}

	/** Wishes and likes of the signed in profile (readable through the policy "own profile"). */
	async fetchOwn(profileId: string): Promise<FeatureWish[]> {
		return await this.readItems({
			fields: PUBLIC_FIELDS,
			filter: { profile: { _eq: profileId } },
			sort: ['-date_created'],
			limit: -1,
		});
	}

	/** The review state of wishes submitted without account, by their ids. */
	async fetchStatesByIds(ids: string[]): Promise<FeatureWishState[]> {
		if (ids.length === 0) {
			return [];
		}
		const client = ServerAPI.getClient() as any;
		const response = await client.request(customEndpoint<{ data: FeatureWishState[] }>({ path: '/feature-wishes/status', method: 'GET', params: { ids: ids.join(',') } }));
		return response?.data ?? [];
	}

	async createWish(title: string, description: string | null): Promise<string> {
		const id = Crypto.randomUUID();
		await this.createItem({ id, title, description, status: FeatureWishStatus.DRAFT });
		return id;
	}

	async createLike(wishId: string): Promise<string> {
		const id = Crypto.randomUUID();
		await this.createItem({ id, related_to: wishId, status: FeatureWishStatus.LIKE });
		return id;
	}

	async updateText(id: string, title: string, description: string | null): Promise<void> {
		await this.updateItem(id, { title, description, status: FeatureWishStatus.DRAFT });
	}
}
