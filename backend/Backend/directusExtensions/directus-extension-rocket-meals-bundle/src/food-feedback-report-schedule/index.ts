import {defineHook} from '@directus/extensions-sdk';
import {ReportSchedule} from "./ReportSchedule";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";


const SCHEDULE_NAME = "food_feedback_report";

export default defineHook(async ({schedule}, apiContext) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	const {
		services,
		database,
		getSchema,
		logger
	} = apiContext;

	const parseSchedule = new ReportSchedule(apiContext);

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
