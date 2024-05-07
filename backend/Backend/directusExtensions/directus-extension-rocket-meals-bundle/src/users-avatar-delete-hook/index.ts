import { defineHook } from '@directus/extensions-sdk';
import {EventHelper} from "../helpers/EventHelper";
import {AvatarHelper} from "../helpers/AvatarHelper";

export default defineHook(({ filter }, {services}) => {
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
