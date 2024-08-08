import type {Accountability, PrimaryKey, Query, SchemaOverview} from '@directus/types';
import type {Knex} from 'knex';

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

class GetItemsService {
    public services: any;
    public schema: any;
    public database: any;

    constructor(services: any, database: any, schema: any) {
        this.services = services;
        this.database = database;
        this.schema = schema;
    }
}

// https://github.com/directus/directus/blob/main/api/src/services/items.ts
export class ItemsServiceCreator extends GetItemsService{

    getItemsService<Item>(tablename: string): AbstractService<Item> {
        const {ItemsService} = this.services;
        return new ItemsService(tablename, {
            accountability: null, //this makes us admin
            knex: this.database, //TODO: i think this is not neccessary
            schema: this.schema,
        });
    }

}

export class FileServiceCreator extends GetItemsService{

    //https://github.com/directus/directus/blob/main/api/src/services/files.ts
        getFileService() {
            const {FilesService} = this.services;
            return new FilesService({
                accountability: null, //this makes us admin
                knex: this.database, //TODO: i think this is not neccessary
                schema: this.schema,
            });
        }

        async importByUrl(url: string, body: Partial<File>){
            const fileService = this.getFileService();
            return await fileService.importOne(url, body);
        }

        async deleteOne(id: string){
            const fileService = this.getFileService();
            return await fileService.deleteOne(id);
        }
}

export class ActivityServiceCreator extends GetItemsService{

        getActivityService() {
            const {ActivityService} = this.services;
            return new ActivityService({
                accountability: null, //this makes us admin
                knex: this.database, //TODO: i think this is not neccessary
                schema: this.schema,
            });
        }
}

export class ServerServiceCreator extends GetItemsService{

    // https://github.com/directus/directus/blob/main/api/src/services/server.ts
    getServerService() {
        const {ServerService} = this.services;
        return new ServerService({
            accountability: null, //this makes us admin
            knex: this.database, //TODO: i think this is not neccessary
            schema: this.schema,
        });
    }

    async getServerInfo() {
        const serverService = this.getServerService();
        return await serverService.serverInfo();
    }

}

export class PermissionsServiceCreator extends GetItemsService{

    getPermissionsService() {
        const {PermissionsService} = this.services;
        return new PermissionsService({
            accountability: null, //this makes us admin
            knex: this.database, //TODO: i think this is not neccessary
            schema: this.schema,
        });
    }
}