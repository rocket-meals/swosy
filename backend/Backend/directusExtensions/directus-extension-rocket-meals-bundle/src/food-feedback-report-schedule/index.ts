import {defineHook} from '@directus/extensions-sdk';
import {ReportSchedule} from "./ReportSchedule";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";


const SCHEDULE_NAME = "food_feedback_report";

export default defineHook(async ({schedule}, apiContext) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	const parseSchedule = new ReportSchedule(apiContext);

	console.log("Canteen Food Feedback Report Schedule schedule register");
	schedule('*/20 * * * * *', async () => {
		//console.log("Canteen Food Feedback Report Schedule run: "+new Date().toISOString());
		await parseSchedule.run();
	});
});
