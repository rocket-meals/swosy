import {defineHook} from '@directus/extensions-sdk';
import {ReportSchedule} from "./ReportSchedule";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const parseSchedule = new ReportSchedule();

const SCHEDULE_NAME = "food_feedback_report";

export default defineHook(async ({schedule}, {
	services,
	database,
	getSchema,
	logger
}) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema);
	if (!allTablesExist) {
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
});
