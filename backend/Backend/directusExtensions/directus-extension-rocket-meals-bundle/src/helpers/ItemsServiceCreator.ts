import {CollectionNames} from "./CollectionNames";

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

export class AppSettingsService extends GetItemsService{

    async getAppSettings(): null | any {
        let itemsService = new ItemsServiceCreator(this.services, this.database, this.schema);
        let appSettingsService = itemsService.getItemsService(CollectionNames.APP_SETTINGS);
        let appSettingsList = await appSettingsService.readByQuery({});
        if(!!appSettingsList && appSettingsList.length === 0){
            let appSettings = appSettingsList[0];
            return appSettings;
        } else {
            return null;
        }
    }

}