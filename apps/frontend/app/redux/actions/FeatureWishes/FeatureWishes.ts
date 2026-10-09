import * as Crypto from 'expo-crypto';
import { customEndpoint, readField } from '@directus/sdk';
import { DatabaseTypes, FeatureWishStatus } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';
import { ServerAPI } from '@/redux/actions/Auth/Auth';
import { CollectionKeys } from '@/constants/collectionKeys';
import { DirectusFieldChoice, DirectusFieldChoiceHelper } from '@/helper/DirectusFieldChoiceHelper';
import { SET_DIRECTUS_FIELD_CHOICES } from '@/redux/Types/types';

export type FeatureWish = DatabaseTypes.FeatureWhishes;

/** What the status endpoint answers for a wish submitted without account. */
export type FeatureWishState = Pick<FeatureWish, 'id' | 'status' | 'progress' | 'likes_amount' | 'related_to' | 'date_updated' | 'date_created' | 'moderation_note_public'>;

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
		const response = await client.request(customEndpoint<FeatureWishState[] | { data: FeatureWishState[] }>({ path: '/feature-wishes/status', method: 'GET', params: { ids: ids.join(',') } }));
		// The SDK unwraps `{ data }` itself, older versions do not.
		if (Array.isArray(response)) {
			return response;
		}
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

/** Fields of `feature_whishes` whose colors and icons the app takes from the Directus data model. */
export const FEATURE_WISH_CHOICE_FIELDS = ['status', 'progress'] as const;

/**
 * Loads the choices (color, icon) of `feature_whishes.status` and `.progress` from Directus into the
 * settings. App users may read these field definitions because they may read the collection.
 */
export async function loadFeatureWishFieldChoices(dispatch: (action: { type: string; payload: Record<string, DirectusFieldChoice[]> }) => void): Promise<void> {
	const client = ServerAPI.getClient() as any;
	const payload: Record<string, DirectusFieldChoice[]> = {};
	for (const field of FEATURE_WISH_CHOICE_FIELDS) {
		try {
			const definition = await client.request(readField(CollectionKeys.FEATURE_WHISHES, field));
			payload[DirectusFieldChoiceHelper.getKey(CollectionKeys.FEATURE_WHISHES, field)] = DirectusFieldChoiceHelper.parseChoices(definition);
		} catch (error) {
			console.error('Could not load the choices of feature_whishes.' + field, error);
		}
	}
	if (Object.keys(payload).length > 0) {
		dispatch({ type: SET_DIRECTUS_FIELD_CHOICES, payload });
	}
}
