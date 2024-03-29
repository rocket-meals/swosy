import {ReportSchedule} from "./ReportSchedule.js"
const parseSchedule = new ReportSchedule();

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
        console.log("Canteen Food Feedback Report Schedule This is the master instance.");
    } else {
        console.log("Canteen Food Feedback Report Schedule This is a worker instance.");
        return;
    }

    try {
        console.log("Canteen Food Feedback Report Schedule init");
        await parseSchedule.init(getSchema, services, database, logger);
        console.log("Canteen Food Feedback Report Schedule init finished");
    } catch (err) {
        let errMsg = err.toString();
        console.log("Canteen Food Feedback Report Schedule init error: ");
        console.log(errMsg);
    }

    console.log("Canteen Food Feedback Report Schedule schedule register");
    schedule('*/20 * * * * *', async () => {
        //console.log("Canteen Food Feedback Report Schedule run: "+new Date().toISOString());
        await parseSchedule.run();
    });
};
