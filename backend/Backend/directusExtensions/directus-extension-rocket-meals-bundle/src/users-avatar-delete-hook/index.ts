import { defineHook } from '@directus/extensions-sdk';
import {EventHelper} from "../helpers/EventHelper";
import {AvatarHelper} from "../helpers/AvatarHelper";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const SCHEDULE_NAME = "users_avatar_delete";

export default defineHook(async({ filter }, {services, getSchema, database}) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema, database);
	if (!allTablesExist) {
		return;
	}

	filter(
		EventHelper.USERS_DELETE_EVENT,
		// @ts-ignore
		async (payload, input, {database, schema, accountability}) => {
			const usersIds = payload; //get the user ids
			for (const userId of usersIds) {
				// for all users which get deleted
				await AvatarHelper.deleteAvatarOfUser(
					services,
					database,
					schema,
					accountability,
					userId
				); //delete avatar file
			}

			return payload;
		}
	);
});
