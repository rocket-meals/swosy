import {getAllCollectionNames} from "./CollectionNames";

/**
 * Helper for Account things
 */
const EXTENSION_NAME = "directus-extension-rocket-meals-bundle";

export class DatabaseInitializedCheck{
    static async checkAllTablesExist(scheduleName: string, getSchema: any): Promise<boolean> {
        return await DatabaseInitializedCheck.checkTablesExist(scheduleName, getSchema, getAllCollectionNames());
    }

    static async getTableNames(getSchema: any): Promise<string[]> {
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
    }

    static async checkTablesExist(scheduleName: string, getSchema: any, tables: string[]): Promise<boolean> {
        let missingTables = [];

        let tableNames = await DatabaseInitializedCheck.getTableNames(getSchema);
        for (let table of tables) {
            if (!tableNames.includes(table)) {
                missingTables.push(table);
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
