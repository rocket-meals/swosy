import {ItemsServiceCreator, QueryOptions} from "./ItemsServiceCreator";
import type {Filter} from "@directus/types/dist/filter";
import {ApiContext} from "./ApiContext";
import {PrimaryKey, Query} from "@directus/types";
import {MySyncSharedKeyValueStorage} from "./MySyncSharedKeyValueStorage";

export class ItemsServiceHelper<T>{

    private apiContext: ApiContext;
    private tablename: string;

    private static FIELD_STATUS = 'status';
    private static FIELD_STATUS_PUBLISHED = 'published';

    constructor(apiContext: ApiContext, tablename: string) {
        this.apiContext = apiContext;
        this.tablename = tablename;
    }

    async updateOne(primary_key: PrimaryKey, update: Partial<T>): Promise<PrimaryKey>{
        return await ItemsServiceHelper.updateItemWithApiContext<T>(this.apiContext, this.tablename, primary_key, update);
    }

    static async updateItemWithApiContext<T>(apiContext: ApiContext, tablename: string, primary_key: PrimaryKey, update: Partial<T>): Promise<PrimaryKey>{
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        // DO not update status. It should be only set on creation
        return await itemsService.updateOne(primary_key, update);
    }

    async findOrCreateItem(search: Partial<T>, create: Partial<T>): Promise<T | undefined>{
        return await ItemsServiceHelper.findOrCreateItemWithApiContext<T>(this.apiContext, this.tablename, search, create);
    }

    static async findOrCreateItemWithApiContext<T>(
        apiContext: ApiContext,
        tablename: string,
        search: Partial<T>,
        create: Partial<T>
    ): Promise<T | undefined> {
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        const itemsService = await itemsServiceCreator.getItemsService<T>(tablename);

        let andFilter: any[] = [];
        let fieldsOfItem = Object.keys(search);
        for(let field of fieldsOfItem){
            let fieldFilter: any = {};
            // @ts-ignore
            let fieldValue = search[field];
            fieldFilter[field] = {_eq: fieldValue};
            andFilter.push(fieldFilter);
        }

        let queryFilter: Filter = {_and: andFilter};
        const query = {filter: queryFilter};

        // Initialize key-value storage for synchronization (assuming Redis or in-memory
        const lockTimeoutInSeconds = 2;
        const lockTimeoutInMs = lockTimeoutInSeconds*1000
        const retryDelayInMs = 100
        const maxRetries = lockTimeoutInMs / retryDelayInMs
        const syncStorage = new MySyncSharedKeyValueStorage(process.env, lockTimeoutInMs, "itemsServiceHelper_", retryDelayInMs, maxRetries);

        // Generate a unique lock key based on the search parameters (ensure it's unique to the combination of search fields)
        const lockKey = `${tablename}:${JSON.stringify(search)}`;

        // Try to acquire the lock
        let lockAcquired = await syncStorage.set(lockKey, 'locked');
        if (!lockAcquired) {
            throw new Error(`Failed to acquire lock for ${lockKey}`);
        }

        try {
            let queriedItems = await itemsService.readByQuery(query);
            let foundItem = queriedItems[0]

            let copiedCreateItem = JSON.parse(JSON.stringify(create));
            if (!foundItem) {
                copiedCreateItem = ItemsServiceHelper.setStatusPublished(copiedCreateItem);
                await itemsService.createOne(copiedCreateItem)

            }
            queriedItems = await itemsService.readByQuery(query);
            foundItem = queriedItems[0]
            return foundItem;
        } finally {
            // Release the lock after the operation is done
            await syncStorage.del(lockKey);
        }
    }

    async createOne(create: Partial<T>): Promise<PrimaryKey>{
        return await ItemsServiceHelper.createItemWithApiContext<T>(this.apiContext, this.tablename, create);
    }

    static async createItemWithApiContext<T>(apiContext: ApiContext, tablename: string, create: Partial<T>){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        create = ItemsServiceHelper.setStatusPublished(create);
        return itemsService.createOne(create);
    }

    async createManyItems(create: Partial<T>[]): Promise<PrimaryKey[]>{
        return await ItemsServiceHelper.createManyItemsWithApiContext<T>(this.apiContext, this.tablename, create);
    }

    static async createManyItemsWithApiContext<T>(apiContext: ApiContext, tablename: string, create: Partial<T>[]){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        create = create.map(ItemsServiceHelper.setStatusPublished);
        return itemsService.createMany(create);
    }

    async readOne(primary_key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<T>{
        return await ItemsServiceHelper.readOneItemWithApiContext<T>(this.apiContext, this.tablename, primary_key, query, opts);
    }

    static async readOneItemWithApiContext<T>(apiContext: ApiContext, tablename: string, primary_key: PrimaryKey, query?: Query, opts?: QueryOptions){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.readOne(primary_key, query, opts);
    }

    async readAllItems(): Promise<T[]>{
        return await ItemsServiceHelper.readAllItemsWithApiContext<T>(this.apiContext, this.tablename);
    }

    static async readAllItemsWithApiContext<T>(apiContext: ApiContext, tablename: string){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.readByQuery({
            limit: -1
        });
    }

    async deleteOne(primary_key: PrimaryKey): Promise<PrimaryKey>{
        return await ItemsServiceHelper.deleteOneItemWithApiContext<T>(this.apiContext, this.tablename, primary_key);
    }

    static async deleteOneItemWithApiContext<T>(apiContext: ApiContext, tablename: string, primary_key: PrimaryKey){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.deleteOne(primary_key);
    }

    async deleteMany(primary_keys: PrimaryKey[]): Promise<PrimaryKey[]>{
        return await ItemsServiceHelper.deleteMany<T>(this.apiContext, this.tablename, primary_keys);
    }

    static async deleteMany<T>(apiContext: ApiContext, tablename: string, primary_keys: PrimaryKey[]){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.deleteMany(primary_keys);
    }

    static setStatusPublished(json: any) {
        json[ItemsServiceHelper.FIELD_STATUS] = ItemsServiceHelper.FIELD_STATUS_PUBLISHED;
        return json;
    }

    static isStatusPublished(json: any) {
        return json[ItemsServiceHelper.FIELD_STATUS] === ItemsServiceHelper.FIELD_STATUS_PUBLISHED;
    }

    async readByQuery(query: Query, opts?: QueryOptions): Promise<T[]>{
        return await ItemsServiceHelper.readByQuery<T>(this.apiContext, this.tablename, query, opts);
    }

    static async readByQuery<T>(apiContext: ApiContext, tablename: string, query: Query, opts?: QueryOptions){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.readByQuery(query, opts);
    }
}