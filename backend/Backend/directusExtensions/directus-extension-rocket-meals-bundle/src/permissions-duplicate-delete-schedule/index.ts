import {defineHook} from '@directus/extensions-sdk';
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {PermissionsServiceCreator} from "../helpers/ItemsServiceCreator";
import {DuplicatePermissionHelper} from "./DuplicatePermissionHelper";


const SCHEDULE_NAME = "permissions_duplicate_delete";

export default defineHook(async ({schedule}, apiContext) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
	if (!allTablesExist) {
		return;
	}

	const {
		services,
		database,
		getSchema,
		env,
		logger
	} = apiContext;

	let schema = await getSchema();
	const permissionsServiceCreator = new PermissionsServiceCreator(services, database, schema);
	const permissionsService = permissionsServiceCreator.getPermissionsService();

	const cronFrequencyEveryMinute =   '0 * * * * *';
	const cronFrequency = cronFrequencyEveryMinute;

	schedule(cronFrequency, async () => {
		// get all permissions entries
		let permissions = await permissionsService.readByQuery({});

		const duplicates = DuplicatePermissionHelper.findDuplicates(permissions);

		// delete duplicates
		for(let i = 0; i < duplicates.length; i++) {
			const permission = duplicates[i];
			let id_to_delete = permission.id;
			if(!!id_to_delete) {
				logger.info(SCHEDULE_NAME+ ": Deleting duplicate permission with id: "+id_to_delete);
				await permissionsService.deleteOne(permission.id);
			} else {
				logger.error(SCHEDULE_NAME+ ": Could not delete duplicate permission, id is missing");
				// print permission to logger
				logger.error(permission);
			}
		}
	});
});
