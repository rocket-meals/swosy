import {ParseSchedule} from "./ParseSchedule"
import {Cashregisters_SWOSY} from "./Cashregisters_SWOSY"
import {defineHook} from "@directus/extensions-sdk";

const parser = new Cashregisters_SWOSY("https://share.sw-os.de/swosy-kassendaten-2h", `Nils:qYoTHeyPyRljfEGRWW52`);
const parseSchedule = new ParseSchedule(parser);

export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {
    let collection = "app_settings";

    try {
        await parseSchedule.init(getSchema, services, database, logger);
    } catch (err) {
        let errMsg = err.toString();
        if (errMsg.includes("no such table: directus_collections")) {
            console.log("+++++++++ Cashregister Parse Schedule +++++++++");
            console.log("++++ Database not initialized yet +++++");
            console.log("+++ Restart Server again after init +++");
            console.log("+++++++++++++++++++++++++++++++++++++++");
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
};
