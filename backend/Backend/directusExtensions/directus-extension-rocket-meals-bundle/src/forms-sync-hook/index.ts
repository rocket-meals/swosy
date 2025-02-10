import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FormsSyncInterface} from "./FormsSyncInterface";

const SCHEDULE_NAME = "forms_sync_hook";

function getFormSync(): FormsSyncInterface | null {


    return null;
}

export default defineHook(async ({action, init, filter}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let collection = CollectionNames.APP_SETTINGS

    const myDatabaseHelper = new MyDatabaseHelper(apiContext);

});