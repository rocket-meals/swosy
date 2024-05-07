import { defineHook } from '@directus/extensions-sdk';
import {NotifySchedule} from "./NotifySchedule";

export default defineHook(async ({action}, {
	services,
	database,
	getSchema,
	logger
}) => {
	let collection = "app_settings";

	const notifySchedule = new NotifySchedule();

	try {
		console.log("foodNotify init");
		await notifySchedule.init(getSchema, services, database, logger);
	} catch (err: any) {
		let errMsg = err.toString();
		if (errMsg.includes("no such table: directus_collections")) {
			console.log("+++++++++ Meal Parse Schedule +++++++++");
			console.log("++++ Database not initialized yet +++++");
			console.log("+++ Restart Server again after init +++");
			console.log("+++++++++++++++++++++++++++++++++++++++");
		} else {
			console.log("foodNotify Schedule init error: ");
			console.log(err);
		}
	}

	action(
		collection + ".items.update",
		async () => {
			//TODO check if field "parse_foods" is active
			try {
				await notifySchedule.notify(1, false);
			} catch (err) {
				console.log(err);
			}
			//TODO set field "parse_foods" to false
		}
	);
});
