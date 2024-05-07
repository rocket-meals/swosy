import {ParseSchedule} from "./ParseSchedule"; // in directus we need to add the filetype ... otherwise we get an error
import {TL1Parser_Web_SWOSY} from "./TL1Parser_Web_SWOSY";
import {defineHook} from "@directus/extensions-sdk"; // in directus we need to add the filetype ... otherwise we get an error

//const SWOSY_Osnabrueck_Web_Parser = require("./SWOSY_Osnabrueck_Web_Parser");
//const StudiFutter_Web_Parser = require("./StudiFutter_Web_Parser");

const parser = TL1Parser_Web_SWOSY.getInstance();
const parseSchedule = new ParseSchedule(parser);


export default defineHook(async ({action}, {
    services,
    database,
    getSchema,
    logger
}) => {

    let collection = "app_settings";

    try {
        console.log("foodParseSchedule init");
        await parseSchedule.init(getSchema, services, database, logger);
        console.log("foodParseSchedule master init finished");
    } catch (err) {
        let errMsg = err.toString();
        if (errMsg.includes("no such table: directus_collections")) {
            console.log("+++++++++ Meal Parse Schedule +++++++++");
            console.log("++++ Database not initialized yet +++++");
            console.log("+++ Restart Server again after init +++");
            console.log("+++++++++++++++++++++++++++++++++++++++");
        } else {
            console.log("Meal Parse Schedule init error: ");
            console.log(err);
        }
    }

    action(
        collection + ".items.update",
        async () => {
            //TODO check if field "parse_foods" is active
            try {
                await parseSchedule.parse(false);
            } catch (err) {
                console.log(err);
            }
            //TODO set field "parse_foods" to false
        }
    );
});