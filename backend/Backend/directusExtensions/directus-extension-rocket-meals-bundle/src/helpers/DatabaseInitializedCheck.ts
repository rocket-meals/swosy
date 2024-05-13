import {getAllCollectionNames} from "./CollectionNames";

/**
 * Helper for Account things
 */
const EXTENSION_NAME = "directus-extension-rocket-meals-bundle";

export class DatabaseInitializedCheck{
    static async checkAllTablesExist(scheduleName: string, getSchema: any, database: any): Promise<boolean> {
        return await DatabaseInitializedCheck.checkTablesExist(scheduleName, getSchema, database, getAllCollectionNames());
    }

    static async checkTablesExist(scheduleName: string, getSchema: any, database: any, tables: string[]): Promise<boolean> {
        let schema = await getSchema();
        let missingTables = [];

        let tableNames = schema.tables.map((table: any) => table.name);
        for (let table of tables) {
            if (!tableNames.includes(table)) {
                missingTables.push(table);
            }
        }

        let allTablesExist = missingTables.length === 0;
        if(!allTablesExist){
            let logMessage = "++ "+EXTENSION_NAME+`: Database not initialized yet. Missing tables: ${missingTables.join(", ")}`;
            console.log(logMessage);
        }
        return allTablesExist;
    }
}
