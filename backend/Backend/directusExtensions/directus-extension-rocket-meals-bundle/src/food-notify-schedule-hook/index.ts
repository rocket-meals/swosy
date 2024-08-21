import { defineHook } from '@directus/extensions-sdk';
import {NotifySchedule} from "./NotifySchedule";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const SCHEDULE_NAME = "food_notify";

export default defineHook(async ({action}, apiContext) => {

	let collection = CollectionNames.APP_SETTINGS
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	const notifySchedule = new NotifySchedule(apiContext);

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
