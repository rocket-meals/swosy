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

    getItemsService(tablename: string) {
        const {ItemsService} = this.services;
        return new ItemsService(tablename, {
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