import {AbstractService, ItemsServiceCreator, QueryOptions} from "./ItemsServiceCreator";
import type {Filter} from "@directus/types/dist/filter";
import {ApiContext} from "./ApiContext";
import {PrimaryKey, Query} from "@directus/types";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";
import {TranslationHelper} from "./TranslationHelper";

export type OptsCustomType = {
    disableEventEmit: boolean
}

type TypeWithId<T> = T & {id: PrimaryKey};

export class ItemsServiceHelper<T>{

    private apiContext: ApiContext;
    private eventContext: EventContext | undefined;
    private tablename: string;

    public static FIELD_STATUS = 'status';
    public static FIELD_STATUS_PUBLISHED = 'published';

    constructor(apiContext: ApiContext, tablename: string, eventContext?: EventContext) {
        this.apiContext = apiContext;
        this.tablename = tablename;
        this.eventContext = eventContext;
    }

    async upsertOne(upsert: Partial<T & {id: PrimaryKey}>, optsCustom?: OptsCustomType): Promise<PrimaryKey>{
        // https://github.com/directus/directus/blob/main/api/src/services/items.ts#L935
        // Can only use upsertOne with a primary key, otherwise it will always create a new item...

        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        let opts = this.getOptsCustom(optsCustom);
        return await itemsService.upsertOne(upsert, opts);
    }

    async updateOne(primary_key: PrimaryKey, update: Partial<T>, optsCustom?: OptsCustomType): Promise<PrimaryKey>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        // DO not update status. It should be only set on creation
        let opts = this.getOptsCustom(optsCustom);
        return await itemsService.updateOne(primary_key, update, opts);
    }

    async updateOneItemWithoutHookTrigger(item: TypeWithId<T>, update: Partial<T>, optsCustom?: OptsCustomType): Promise<void>{
        let primary_key = item.id;
        return await this.updateOneWithoutHookTrigger(primary_key, update, optsCustom);
    }

    async updateOneWithoutHookTrigger(primary_key: PrimaryKey, update: Partial<T>, optsCustom?: OptsCustomType): Promise<void>{
        let database = this.apiContext.database;
        let table = database(this.tablename);
        await database(this.tablename).update(update).where('id', primary_key);
    }

    async updateMany(items: TypeWithId<T>[], update: Partial<T>, optsCustom?: OptsCustomType): Promise<PrimaryKey[]>{
        let primary_keys = items.map(item => item.id);
        return await this.updateManyByPrimaryKeys(primary_keys, update, optsCustom);
    }

    async updateManyByPrimaryKeys(primary_keys: PrimaryKey[], update: Partial<T>, optsCustom?: OptsCustomType): Promise<PrimaryKey[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        // DO not update status. It should be only set on creation
        let opts = this.getOptsCustom(optsCustom);
        return await itemsService.updateMany(primary_keys, update, opts);
    }

    private getOptsCustom(optsCustom?: OptsCustomType): QueryOptions {
        let opts: QueryOptions = {};
        if(optsCustom?.disableEventEmit){
            opts.emitEvents = false;
        }
        return opts;
    }



    // Function to calculate the average of a number field
    /**
     * Calculate the average of a number field in the table
     * @param fieldName
     * @returns {Promise<number>} The average of the field or NaN if no data is found
     */
    async calculateAverage(fieldName: string): Promise<number | undefined> {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        type AggregateAnswer = { avg: {[fieldName: string]: string} };
        let itemsService = await itemsServiceCreator.getItemsService<AggregateAnswer>(this.tablename);

        //console.log("Calculating average for field: " + fieldName);

        // Construct the query to calculate average on the field
        let aggregateQuery: Query = {
            aggregate: {
                avg: [fieldName as string]  // Pass the field name to the aggregate function
            },
            limit: -1
        };

        //console.log("Query: " + JSON.stringify(aggregateQuery, null, 2));

        // Define the response structure

        // Execute the query
        let answer = await itemsService.readByQuery(aggregateQuery);

        //console.log("Answer: " + JSON.stringify(answer, null, 2));

        // Parse and return the average result
        if (answer && answer[0] && answer[0].avg && answer[0].avg?.[fieldName]) {
            return parseFloat(answer[0].avg?.[fieldName]);  // Parse the average to a float
        } else {
            return undefined;  // Return 0 if no data is found
        }
    }

    async countItems(query?: Query): Promise<number>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        type AggregateAnswer = {count: string};
        let itemsService = await itemsServiceCreator.getItemsService<AggregateAnswer>(this.tablename);
        let aggregateFilter: Query = {
            aggregate: {
                count: ["*"]
            },
            limit: -1
        }
        let totalQuery: Query = {...query, ...aggregateFilter};
        let answer = await itemsService.readByQuery(totalQuery)
        // data = {"data":[{"count":"1869"}]}
        if(!!answer && !!answer[0]){
            return parseInt(answer[0].count);
        } else {
            return 0;
        }
    }

    async readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<T[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.readMany(keys, query, opts);
    }

    async findFirstItem(search: Partial<T>, customOptions?: {
        withTranslations?: boolean
    }): Promise<T | undefined>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);

        let queriedItems = await this.findItems(search, customOptions);
        return queriedItems[0];
    }

    async findItems(search: Partial<T>, customOptions?: {
        withTranslations?: boolean
    }): Promise<T[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);

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
        let query = {filter: queryFilter};
        if(customOptions?.withTranslations){
            query = {
                ...query,
                ...TranslationHelper.QUERY_FIELDS_FOR_ALL_FIELDS_AND_FOR_TRANSLATION_FETCHING
            }
        }

        let queriedItems = await itemsService.readByQuery(query);
        return queriedItems;
    }

    async findOrCreateItem(search: Partial<T>, create: Partial<T>, customOptions?: {
        withTranslations?: boolean
    }): Promise<T | undefined>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);

        let queriedItems = await this.findItems(search, customOptions);
        let foundItem = queriedItems[0]

        let copiedCreateItem = JSON.parse(JSON.stringify(create));
        if (!foundItem) {
            copiedCreateItem = ItemsServiceHelper.setStatusPublished(copiedCreateItem);
            await itemsService.createOne(copiedCreateItem)
        }
        queriedItems = await this.findItems(search, customOptions);
        foundItem = queriedItems[0]
        return foundItem;
    }

    async createOne(create: Partial<T>): Promise<PrimaryKey>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        create = ItemsServiceHelper.setStatusPublished(create);
        return await itemsService.createOne(create);
    }

    async createManyItems(create: Partial<T>[], optsCustom?: OptsCustomType): Promise<PrimaryKey[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        create = create.map(ItemsServiceHelper.setStatusPublished);
        let opts = this.getOptsCustom(optsCustom);
        return await itemsService.createMany(create, opts);
    }

    async existsItem(search : Partial<T>): Promise<boolean>{
        let items = await this.findItems(search);
        return items.length > 0;
    }

    async readOne(primary_key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<T>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.readOne(primary_key, query, opts);
    }

    async readAllItems(): Promise<T[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.readByQuery({
            limit: -1
        });
    }

    async deleteOne(primary_key: PrimaryKey): Promise<PrimaryKey>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.deleteOne(primary_key);
    }

    async deleteManyItems(items: TypeWithId<T>[]): Promise<PrimaryKey[]>{
        let primary_keys = items.map(item => item.id);
        return await this.deleteMany(primary_keys);
    }

    async deleteMany(primary_keys: PrimaryKey[]): Promise<PrimaryKey[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.deleteMany(primary_keys);
    }

    static setStatusPublished(json: any) {
        json[ItemsServiceHelper.FIELD_STATUS] = ItemsServiceHelper.FIELD_STATUS_PUBLISHED;
        return json;
    }

    static isStatusPublished(json: any) {
        return json[ItemsServiceHelper.FIELD_STATUS] === ItemsServiceHelper.FIELD_STATUS_PUBLISHED;
    }

    async readByQuery(query: Query, opts?: QueryOptions): Promise<T[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(this.tablename);
        return await itemsService.readByQuery(query, opts);
    }
}