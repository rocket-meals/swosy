import { DatabaseTypes } from 'repo-depkit-common';
import { CollectionHelper } from '@/helper/collectionHelper';

export class FriendshipsHelper extends CollectionHelper<DatabaseTypes.Friendships> {
	constructor(client?: any) {
		super('friendships', client);
	}

	async fetchFriendshipsByProfileId(profileId: string, queryOverride: any = {}) {
		const defaultQuery = {
			fields: ['*'],
			filter: {
				_or: [
					{ receiver_profiles_id: { _eq: profileId } },
					{ requester_profiles_id: { _eq: profileId } },
				],
			},
			limit: -1,
		};
		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}

	async createFriendshipForQR(receiverProfileId: string) {
		return await this.createItem({
			receiver_profiles_id: receiverProfileId,
			requester_profiles_id: null,
			friendship_status: 'pending',
		} as Partial<DatabaseTypes.Friendships>);
	}

	async updateFriendshipRequester(friendshipId: string, requesterProfileId: string) {
		return await this.updateItem(friendshipId, {
			requester_profiles_id: requesterProfileId,
		} as Partial<DatabaseTypes.Friendships>);
	}
}
