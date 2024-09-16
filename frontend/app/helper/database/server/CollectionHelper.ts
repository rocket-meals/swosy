import {
	DirectusClient,
	RestClient,
	createItem,
	deleteItem,
	deleteItems,
	readItem,
	readItems,
	readSingleton,
	updateItem,
	updateItems, aggregate,
} from '@directus/sdk';
import {CustomDirectusTypes} from '@/helper/database/databaseTypes/types';
import {ServerAPI} from '@/helper/database/server/ServerAPI';

export type FilterOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'nin' | 'null' | 'nnull' | 'contains' | 'ncontains' | 'icontains' | 'between' | 'nbetween' | 'empty' | 'nempty' | 'intersects' | 'nintersects' | 'intersects_bbox' | 'nintersects_bbox';

export type Aggregate = {
	avg?: string[] | string;
	avgDistinct?: string[] | string;
	count?: string[] | string
	countDistinct?: string[] | string;
	sum?: string[] | string;
	sumDistinct?: string[] | string;
	min?: string[] | string;
	max?: string[] | string;
};

export type ClientFilterOperator = FilterOperator | 'starts_with' | 'nstarts_with' | 'istarts_with' | 'nistarts_with' | 'ends_with' | 'nends_with' | 'iends_with' | 'niends_with' | 'regex';

export type LogicalFilterOR<CollectionScheme> = {
	_or: Filter<CollectionScheme>[];
};

export type LogicalFilterAND<CollectionScheme> = {
	_and: Filter<CollectionScheme>[];
};

export type LogicalFilter<CollectionScheme> = LogicalFilterOR<CollectionScheme> | LogicalFilterAND<CollectionScheme>;

export type FieldFilter<CollectionScheme> = {
	[K in keyof CollectionScheme]?: FieldFilterOperator | FieldValidationOperator | FieldFilter<CollectionScheme[K]>;
};

export type DeepQuery = {
	_fields?: string[] | null;
	_sort?: string[] | null;
	_filter?: FieldFilter<any> | null;
	_limit?: number | null;
	_offset?: number | null;
	_page?: number | null;
	_search?: string | null;
	_group?: string[] | null;
};
export type NestedDeepQuery = {
	[field: string]: DeepQuery | NestedDeepQuery;
};

export type FieldFilterOperator = {
	_eq?: string | number | boolean;
	_neq?: string | number | boolean;
	_lt?: string | number;
	_lte?: string | number;
	_gt?: string | number;
	_gte?: string | number;
	_in?: (string | number)[];
	_nin?: (string | number)[];
	_null?: boolean;
	_nnull?: boolean;
	_contains?: string;
	_ncontains?: string;
	_icontains?: string;
	_starts_with?: string;
	_nstarts_with?: string;
	_istarts_with?: string;
	_nistarts_with?: string;
	_ends_with?: string;
	_nends_with?: string;
	_iends_with?: string;
	_niends_with?: string;
	_between?: (string | number)[];
	_nbetween?: (string | number)[];
	_empty?: boolean;
	_nempty?: boolean;
	_intersects?: string;
	_nintersects?: string;
	_intersects_bbox?: string;
	_nintersects_bbox?: string;
};

export type FieldValidationOperator = {
	_submitted?: boolean;
	_regex?: string;
};

export type Filter<CollectionScheme> = LogicalFilter<CollectionScheme> | FieldFilter<CollectionScheme>;

export type Query<CollectionScheme> = {
	fields?: (keyof CollectionScheme)[] | null | string[];
	sort?: (keyof CollectionScheme)[] | null;
	filter?: Filter<CollectionScheme> | null;
	deep?: Record<string, Query<CollectionScheme>> | null | NestedDeepQuery;
	limit?: number | null;
	offset?: number | null;
	page?: number | null;
};

export type AggregateQuery<CollectionScheme> = {
	aggregate?: Aggregate | null;
	query?: Query<CollectionScheme> | null;
}


export class CollectionHelper<CollectionScheme> {
	private collection: string;
	private client: DirectusClient<CustomDirectusTypes> & RestClient<any>;

	constructor(collection: string, client?: DirectusClient<CustomDirectusTypes> & RestClient<any>) {
		this.collection = collection;
		if (!client) {
			this.client = ServerAPI.getClient()
		} else {
			this.client = client;
		}
	}

	static getQueryWithRelatedFields(fields: string[]) {
		return {
			fields: fields,
		};
	}

	async readSingletonItem(query?: Query<CollectionScheme>) {
		return await this.client.request<CollectionScheme>(readSingleton(this.collection, query));
	}

	async readItems(query?: Query<CollectionScheme>) {
		return await this.client.request<CollectionScheme[]>(readItems(this.collection, query));
	}

	async aggregateItems(query?: AggregateQuery<CollectionScheme>) {
		return await this.client.request<any>(aggregate(this.collection, query));
	}

	async readItem(id: number | string, query?: Query<CollectionScheme>) {
		return await this.client.request<CollectionScheme>(readItem(this.collection, id, query));
	}

	async updateItem(id: number | string, data: any) {
		return await this.client.request(updateItem(this.collection, id, data));
	}

	async updateItems(query?: Query<CollectionScheme>, data: Partial<CollectionScheme>) {
		return await this.client.request(updateItems(this.collection, query, data));
	}

	async deleteItem(id: number | string) {
		return await this.client.request(deleteItem(this.collection, id));
	}

	async deleteItems(query?: Query<CollectionScheme>) {
		return await this.client.request(deleteItems(this.collection, query));
	}

	async createItem<CollectionScheme>(data: Partial<CollectionScheme>) {
		return await this.client.request(createItem(this.collection, data));
	}

	convertListToDict(list: CollectionScheme[], key: string) {
		return CollectionHelper.convertListToDict(list, key);
	}

	static convertListToDict<CollectionScheme>(list: CollectionScheme[], key: string) {
		const dict: Record<any, CollectionScheme | undefined | null> = {};
		//console.log("convertListToDict", list)
		for (const item of list) {
			// @ts-ignore
			const id = item[key];
			// @ts-ignore
			dict[item[key]] = item;
		}
		return dict;
	}

	static convertListToDictWithListAsValue<CollectionScheme>(list: CollectionScheme[], key: string) {
		const dict: Record<any, CollectionScheme[] | undefined | null> = {};
		for (const item of list) {
			// @ts-ignore
			const id = item[key];
			// @ts-ignore
			if (!dict[id]) {
				dict[id] = [];
			}
			// @ts-ignore
			dict[id].push(item);
		}
		return dict;
	}
}