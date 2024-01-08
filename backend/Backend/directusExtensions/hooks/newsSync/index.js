import {NewsParseSchedule} from "./NewsParseSchedule.js"; // in directus we need to add the filetype ... otherwise we get an error
import {StudentenwerkHannoverNews_Parser} from "./StudentenwerkHannoverNews_Parser.js"; // in directus we need to add the filetype ... otherwise we get an error



const parseSchedule = new NewsParseSchedule(StudentenwerkHannoverNews_Parser);


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
    if (isMaster) {
        console.log("This is the master instance.");
    } else {
        console.log("This is a worker instance.");
    }

        try {
            await parseSchedule.init(getSchema, services, database, logger);
        } catch (err) {
            let errMsg = err.toString();
            if (errMsg.includes("no such table: directus_collections")) {
                console.log("+++++++++ Meal Parse Schedule +++++++++");
                console.log("++++ Database not initialized yet +++++");
                console.log("+++ Restart Server again after init +++");
                console.log("+++++++++++++++++++++++++++++++++++++++");
            } else {
                console.log("News Parse Schedule init error: ");
                console.log(err);
            }
        }

        let collection = "app_settings_news";

        filterFlowHookOnlyForMaster(filter, collection, isMaster, exceptions);

        action(
            collection + ".items.update",
            async (meta, context) => {
                console.log("Start News Parser Schedule to be checked");
                //TODO check if field "parse_foods" is active
                try {
                    await parseSchedule.parse(getSchema, services, database, logger);
                } catch (err) {
                    console.log(err);
                }
                //TODO set field "parse_foods" to false
            }
        );
};
