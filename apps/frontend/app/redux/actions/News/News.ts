import { DatabaseTypes, NewsDisplayLocations } from 'repo-depkit-common';
import { itemStatus } from '@/constants/Constants';
import { CollectionHelper, Query } from '@/helper/collectionHelper';

export class NewsHelper extends CollectionHelper<DatabaseTypes.News> {
	constructor(client?: any) {
		// Pass the collection name and API client
		super('news', client);
	}

	// Fetch all news with optional query overrides. Which ones the list shows (display_locations,
	// date_end) is checked in the app, so this also works against a backend without those fields.
	async fetchNews(queryOverride?: Query<DatabaseTypes.News>) {
		const defaultQuery = {
			fields: ['* , translations.*'],
			sort: ['sort', '-date'],
			limit: 100, // Fetch all
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}

	/**
	 * News shown as popup or as card in the food offers (`display_locations`, a csv field, so `_contains`
	 * works on it). Time, platform and user are checked in the app (`filterNewsShownOutsideNewsList`).
	 */
	async fetchNewsShownOutsideNewsList(queryOverride?: Query<DatabaseTypes.News>) {
		const defaultQuery = {
			fields: ['*', 'translations.*', 'canteens.*'],
			limit: -1,
			sort: ['sort', '-date'],
			filter: {
				_and: [
					{ status: { _eq: itemStatus } },
					{
						_or: [
							{ display_locations: { _contains: NewsDisplayLocations.popup } },
							{ display_locations: { _contains: NewsDisplayLocations.foodoffers_top } },
							{ display_locations: { _contains: NewsDisplayLocations.foodoffers_bottom } },
						],
					},
				],
			},
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItems(query);
	}

	// Fetch a specific news by ID
	async fetchNewsById(id: string, queryOverride?: Query<DatabaseTypes.News>) {
		const defaultQuery = {
			fields: ['*'],
		};

		const query = { ...defaultQuery, ...queryOverride };
		return await this.readItem(id, query);
	}
}
