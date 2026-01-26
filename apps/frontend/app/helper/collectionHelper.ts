import { aggregate, createItem, deleteItem, deleteItems, DirectusClient, readItem, readItems, readSingleton, RestClient, updateItem, updateItems } from '@directus/sdk';
import { DatabaseTypes } from 'repo-depkit-common';
import { ServerAPI } from '@/redux/actions/Auth/Auth';

// Define types for queries and filters
export type FilterOperator = 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte' | 'in' | 'nin' | 'null' | 'nnull' | 'contains' | 'ncontains' | 'icontains' | 'between' | 'nbetween' | 'empty' | 'nempty' | 'intersects' | 'nintersects' | 'intersects_bbox' | 'nintersects_bbox';

export type Query<CollectionScheme> = {
	fields?: (keyof CollectionScheme | string)[] | null;
	sort?: (keyof CollectionScheme | string)[] | null;
	filter?: any | null;
	deep?: Record<string, Query<CollectionScheme>> | null;
	limit?: number | null;
	offset?: number | null;
	page?: number | null;
};

export type AggregateQuery<CollectionScheme> = {
	aggregate?: {
		avg?: string[] | string;
		count?: string[] | string;
		sum?: string[] | string;
		min?: string[] | string;
		max?: string[] | string;
	};
	query?: Query<CollectionScheme>;
};

export class CollectionHelper<CollectionScheme> {
private collection: string;
	private _client?: DirectusClient<DatabaseTypes.CustomDirectusTypes> & RestClient<DatabaseTypes.CustomDirectusTypes>;

	constructor(collection: string, client?: DirectusClient<DatabaseTypes.CustomDirectusTypes> & RestClient<DatabaseTypes.CustomDirectusTypes>) {
		this.collection = collection;
		this._client = client;
	}

	private get client(): DirectusClient<DatabaseTypes.CustomDirectusTypes> & RestClient<DatabaseTypes.CustomDirectusTypes> {
		return this._client ?? (ServerAPI.getClient() as any);
	}

	/**
	 * Centralized API call handler for reducing redundancy
	 */
	private async handleRequest<T>(method: (...args: any[]) => any, ...args: any[]): Promise<T> {
		try {
			return await this.client.request<T>(method(this.collection, ...args));
		} catch (error) {
			console.error(`Error in ${method.name}:`, error);
			throw error;
		}
	}

	// CRUD Operations
	async readSingletonItem(query?: Query<CollectionScheme>): Promise<CollectionScheme> {
		return this.handleRequest<CollectionScheme>(readSingleton, query);
	}

	async readItems(query?: Query<CollectionScheme>): Promise<CollectionScheme[]> {
		return this.handleRequest<CollectionScheme[]>(readItems, query);
	}

	async readItem(id: number | string, query?: Query<CollectionScheme>): Promise<CollectionScheme> {
		return this.handleRequest<CollectionScheme>(readItem, id, query);
	}

	async createItem(data: Partial<CollectionScheme>): Promise<CollectionScheme> {
		return this.handleRequest<CollectionScheme>(createItem, data);
	}

	async updateItem(id: number | string, data: Partial<CollectionScheme>): Promise<CollectionScheme> {
		return this.handleRequest<CollectionScheme>(updateItem, id, data);
	}

	async updateItems(query: Query<CollectionScheme>, data: Partial<CollectionScheme>): Promise<CollectionScheme[]> {
		return this.handleRequest<CollectionScheme[]>(updateItems, query, data);
	}

	async deleteItem(id: number | string) {
		return this.handleRequest(deleteItem, id);
	}

	async deleteItems(query?: Query<CollectionScheme>) {
		return this.handleRequest(deleteItems, query);
	}

	async aggregateItems(query?: AggregateQuery<CollectionScheme>) {
		return this.handleRequest(aggregate, query);
	}

	// Utility Methods
	static getQueryWithRelatedFields(fields: string[]) {
		return { fields };
	}

	static convertDictToList<CollectionScheme>(dict: Record<string, CollectionScheme | undefined | null> | null | undefined): CollectionScheme[] {
		return dict ? (Object.values(dict).filter(Boolean) as CollectionScheme[]) : [];
	}

	static convertListToDict<CollectionScheme>(list: CollectionScheme[], key: keyof CollectionScheme): Record<string, CollectionScheme> {
		return list.reduce(
			(dict, item) => {
				const id = item[key];
				if (id) {
					dict[id as unknown as string] = item;
				}
				return dict;
			},
			{} as Record<string, CollectionScheme>
		);
	}

	static convertListToDictWithListAsValue<CollectionScheme>(list: CollectionScheme[], key: keyof CollectionScheme | ((item: CollectionScheme) => string)): Record<string, CollectionScheme[]> {
		return list.reduce(
			(dict, item) => {
				const id = typeof key === 'function' ? key(item) : item[key];
				if (!dict[id as string]) {
					dict[id as string] = [];
				}
				dict[id as string].push(item);
				return dict;
			},
			{} as Record<string, CollectionScheme[]>
		);
	}
}
