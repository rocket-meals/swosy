import {ParseSchedule} from "./ParseSchedule"
import {Cashregisters_SWOSY} from "./Cashregisters_SWOSY"
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const parser = new Cashregisters_SWOSY("https://share.sw-os.de/swosy-kassendaten-2h", `Nils:qYoTHeyPyRljfEGRWW52`);
const parseSchedule = new ParseSchedule(parser);

export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(ParseSchedule.SCHEDULE_NAME,getSchema, database);
    if (!allTablesExist) {
        return;
    }


    let collection = CollectionNames.APP_SETTINGS;

    try {
        await parseSchedule.init(getSchema, services, database, logger);
    } catch (err) {
        let errMsg = err.toString();
        if (errMsg.includes("no such table: directus_collections")) {
            console.log("+++++++++ Cashregister Parse Schedule +++++++++");
            console.log("++++ Database not initialized yet +++++");
            console.log("+++ Restart Server again after init +++");
            console.log("+++++++++++++++++++++++++++++++++++++++");
            return;
        } else {
            console.log("Cashregister Parse Schedule init error: ");
            console.log(err);
        }
    }

    action(
        collection + ".items.update",
        async (meta, context) => {
            try {
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
        }
    );
});
