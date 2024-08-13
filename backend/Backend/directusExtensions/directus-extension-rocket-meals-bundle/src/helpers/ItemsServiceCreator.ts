import type {Accountability, PrimaryKey, Query, SchemaOverview} from '@directus/types';
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

    upsertSingleton(data: Partial<Item>): Promise<PrimaryKey>;
    readSingleton(): Promise<Item>;
}

class GetItemsService {
    public apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
    }

}

// https://github.com/directus/directus/blob/main/api/src/services/items.ts
export class ItemsServiceCreator extends GetItemsService{

    async getItemsService<Item>(tablename: string): Promise<AbstractService<Item>> {
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

export class ActivityServiceCreator extends GetItemsService{

        async getActivityService() {
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
        const serverService = await this.getServerService();
        return await serverService.serverInfo();
    }

}

export class PermissionsServiceCreator extends GetItemsService{

    async getPermissionsService() {
        const {PermissionsService} = this.apiContext.services;
        const schema = this.apiContext.getSchema()
        const database = this.apiContext.database
        return new PermissionsService({
            accountability: null, //this makes us admin
            knex: database, //TODO: i think this is not neccessary
            schema: schema,
        });
    }
}