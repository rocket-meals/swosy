import {getAllCollectionNames} from "./CollectionNames";
import {ApiContext} from "./ApiContext";

/**
 * Helper for Account things
 */
const EXTENSION_NAME = "directus-extension-rocket-meals-bundle";

export class DatabaseInitializedCheck{

    static async checkAllTablesExistWithApiContext(scheduleName: string, apiContext: ApiContext){
        return await DatabaseInitializedCheck.checkTablesExist(scheduleName, apiContext.getSchema, getAllCollectionNames());
    }

    static async getTableNames(getSchema: any): Promise<string[]> {
        try{
            let schema = await getSchema();
            let collectionKeys = Object.keys(schema.collections);
            let tableNamesDict: any = {};
            for(let collectionKey of collectionKeys) {
                let collection = schema.collections[collectionKey];
                if(!!collection){
                    tableNamesDict[collection.collection] = collection.collection;
                }
            }
            return Object.keys(tableNamesDict);
        } catch (e) {
            console.error("++ "+EXTENSION_NAME+" - getTableNames: Error: ", e);
            return [];
        }
    }

    static async checkTablesExist(scheduleName: string, getSchema: any, tablesRequiredForPlugin: string[]): Promise<boolean> {
        let missingTables = [];

        let existingTablesNamesOnServer = await DatabaseInitializedCheck.getTableNames(getSchema);
        for (let tableRequiredForPlugin of tablesRequiredForPlugin) {
            if (!existingTablesNamesOnServer.includes(tableRequiredForPlugin)) {
                missingTables.push(tableRequiredForPlugin);
            }
        }

        let allTablesExist = missingTables.length === 0;
        if(!allTablesExist){
            let logMessage = "++ "+EXTENSION_NAME+" - "+scheduleName+`: Database not initialized yet. Missing tables: ${missingTables.join(", ")}`;
            console.log(logMessage);
        }
        return allTablesExist;
    }
}
