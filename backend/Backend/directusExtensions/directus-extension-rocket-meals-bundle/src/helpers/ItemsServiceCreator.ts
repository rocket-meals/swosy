import type {Accountability, PrimaryKey, Query, SchemaOverview, Item as DirectusItem, PermissionsAction} from '@directus/types';
import type {Knex} from 'knex';
import {ApiContext} from "./ApiContext";

export type AbstractServiceOptions = {
    knex?: Knex | undefined;
    accountability?: Accountability | null | undefined;
    schema: SchemaOverview;
};

// Copy / Import from https://github.com/directus/directus/blob/main/api/src/types/services.ts
export interface AbstractService<Item> {
    knex: Knex;
    accountability: Accountability | null | undefined;

    createOne(data: Partial<Item>): Promise<PrimaryKey>;
    createMany(data: Partial<Item>[]): Promise<PrimaryKey[]>;

    readOne(key: PrimaryKey, query?: Query): Promise<Item>;
    readMany(keys: PrimaryKey[], query?: Query): Promise<Item[]>;
    readByQuery(query: Query): Promise<Item[]>;

    updateOne(key: PrimaryKey, data: Partial<Item>): Promise<PrimaryKey>;
    updateMany(keys: PrimaryKey[], data: Partial<Item>): Promise<PrimaryKey[]>;

    deleteOne(key: PrimaryKey): Promise<PrimaryKey>;
    deleteMany(keys: PrimaryKey[]): Promise<PrimaryKey[]>;
}


// https://github.com/directus/directus/blob/main/api/src/types/items.ts
export type MutationOptions = any // TODO: check if we ever need this

// https://github.com/directus/directus/blob/main/api/src/services/items.ts#L35
export type QueryOptions = {
    stripNonRequested?: boolean;
    permissionsAction?: PermissionsAction;
    emitEvents?: boolean;
};


// https://github.com/directus/directus/blob/main/api/src/services/items.ts#L46
export interface ItemsService<Item> extends AbstractService<Item> {
    getKeysByQuery(query: Query): Promise<PrimaryKey[]>

    createOne(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>
    createMany(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>

    readByQuery(query: Query, opts?: QueryOptions): Promise<Item[]>
    readOne(key: PrimaryKey, query?: Query, opts?: QueryOptions): Promise<Item>
    readMany(keys: PrimaryKey[], query?: Query, opts?: QueryOptions): Promise<Item[]>

    updateByQuery(query: Query, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>
    updateOne(key: PrimaryKey, data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>
    updateBatch(data: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>
    updateMany(keys: PrimaryKey[], data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey[]>

    upsertOne(payload: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>
    upsertMany(payloads: Partial<Item>[], opts?: MutationOptions): Promise<PrimaryKey[]>

    deleteByQuery(query: Query, opts?: MutationOptions): Promise<PrimaryKey[]>
    deleteOne(key: PrimaryKey, opts?: MutationOptions): Promise<PrimaryKey>
    deleteMany(keys: PrimaryKey[], opts?: MutationOptions): Promise<PrimaryKey[]>

    readSingleton(query: Query, opts?: QueryOptions): Promise<Partial<Item>>
    upsertSingleton(data: Partial<Item>, opts?: MutationOptions): Promise<PrimaryKey>
}

class GetItemsService {
    public apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
    }

}

// https://github.com/directus/directus/blob/main/api/src/services/items.ts
export class ItemsServiceCreator extends GetItemsService{

    async getItemsService<Item>(tablename: string): Promise<ItemsService<Item>> {
        const {ItemsService} = this.apiContext.services;
        let schema = await this.apiContext.getSchema();
        let database = this.apiContext.database;
        return new ItemsService(tablename, {
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });
    }

}

export class CollectionsServiceCreator extends GetItemsService{

    async getCollectionsService() {
        const {CollectionsService} = this.apiContext.services;
        let schema = await this.apiContext.getSchema();
        let database = this.apiContext.database;
        return new CollectionsService({
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });
    }
}

export class FileServiceCreator extends GetItemsService{

    //https://github.com/directus/directus/blob/main/api/src/services/files.ts
        async getFileService() {
            const {FilesService} = this.apiContext.services;
            const schema = await this.apiContext.getSchema();
            const database = this.apiContext.database;
            return new FilesService({
                accountability: null, //this makes us admin
                knex: database, //TODO: i think this is not neccessary
                schema: schema,
            });
        }

        async importByUrl(url: string, body: Partial<File>){
            const fileService = await this.getFileService();
            return await fileService.importOne(url, body);
        }

        async deleteOne(id: string){
            const fileService = await this.getFileService();
            return await fileService.deleteOne(id);
        }
}

export type ActivityServiceType = ItemsService<DirectusItem>
export class ActivityServiceCreator extends GetItemsService{

        async getActivityService(): Promise<ActivityServiceType> {
            const {ActivityService} = this.apiContext.services;
            const schema = await this.apiContext.getSchema();
            const database = this.apiContext.database;
            return new ActivityService({
                accountability: null, //this makes us admin
                knex: database, //TODO: i think this is not neccessary
                schema: schema,
            });
        }
}

export class ServerServiceCreator extends GetItemsService{

    // https://github.com/directus/directus/blob/main/api/src/services/server.ts
    async getServerService() {
        const {ServerService} = this.apiContext.services;
        const schema = await this.apiContext.getSchema();
        const database = this.apiContext.database;
        return new ServerService({
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });
    }

    async getServerInfo() {
        type ServerInfo = {
            project: {
                project_name: string;
            }
        }

        const serverService = await this.getServerService();
        return await serverService.serverInfo() as ServerInfo;
    }

}