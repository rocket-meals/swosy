import { defineHook } from '@directus/extensions-sdk';
import {ReportSchedule} from "./ReportSchedule";
const parseSchedule = new ReportSchedule();

export default defineHook(async ({schedule}, {
	services,
	database,
	getSchema,
	logger
}) => {
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
});
