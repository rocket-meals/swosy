import {ParseSchedule} from "./ParseSchedule.js"
import {Cashregisters_SWOSY} from "./Cashregisters_SWOSY.js"

const parser = new Cashregisters_SWOSY("https://share.sw-os.de/swosy-kassendaten-2h", `Nils:qYoTHeyPyRljfEGRWW52`);
const parseSchedule = new ParseSchedule(parser);

/**
 *    *    *    *    *    *
 ┬    ┬    ┬    ┬    ┬    ┬
 │    │    │    │    │    │
 │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
 │    │    │    │    └───── month (1 - 12)
 │    │    │    └────────── day of month (1 - 31)
 │    │    └─────────────── hour (0 - 23)
 │    └──────────────────── minute (0 - 59)
 └───────────────────────── second (0 - 59, OPTIONAL)
 */

function filterFlowHookOnlyForMaster(filter, collection, isMaster, exceptions){
    filter(
        collection + ".items.update",
        async (payload, meta, context) => {
            console.log("filterFlowHookOnlyForMaster: collection: "+collection);
            if(payload?.flowHook){
                if(isMaster){
//                    console.log("okay i am master continue");
                } else {
//                    console.log("as a worker this shall be blocked");
                    const { InvalidPayloadException } = exceptions;
                    throw new InvalidPayloadException('Update only as master allowed');
                }
            }
            return payload;
        }
    );
}

export default async function ({filter, action, init, schedule}, {
    services,
    exceptions,
    database,
    getSchema,
    logger
}) {
    const instanceId = process?.env?.INSTANCE_ID;
    let isMaster = instanceId === "master"

    let collection = "app_settings_cashregisters";

    try {
        console.log("cashregisterSchedule init");
        await parseSchedule.init(getSchema, services, database, logger);
        console.log("cashregisterSchedule master init finished");
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

    filterFlowHookOnlyForMaster(filter, collection, isMaster, exceptions);

    action(
        collection + ".items.update",
        async (meta, context) => {
            try {
                await parseSchedule.parse(getSchema, services, database, logger);
            } catch (err) {
                console.log(err);
            }
        }
    );
};
