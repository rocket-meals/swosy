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
					{
						_and: [
							{ friendship_status: { _eq: 'accepted' } },
							{
								_or: [
									{ receiver_profiles_id: { _eq: profileId } },
									{ requester_profiles_id: { _eq: profileId } },
								],
							},
						],
					},
					{ requester_profiles_id: { _eq: profileId } },
				],
			},
			limit: -1,
		};
		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}

	async createFriendshipForQR(requesterProfileId: string) {
		return await this.createItem({
			requester_profiles_id: requesterProfileId,
			receiver_profiles_id: null,
			friendship_status: 'pending',
		} as Partial<DatabaseTypes.Friendships>);
	}

	async updateFriendshipReceiver(friendshipId: string, receiverProfileId: string) {
		return await this.updateItem(friendshipId, {
			receiver_profiles_id: receiverProfileId,
		} as Partial<DatabaseTypes.Friendships>);
	}
}
