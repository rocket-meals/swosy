import { defineHook } from '@directus/extensions-sdk';
import {EventHelper} from '../helpers/EventHelper';
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";

const SCHEDULE_NAME = "profile_create";

export default defineHook(async ({ filter}, {services, getSchema, database}) => {
	let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExist(SCHEDULE_NAME,getSchema, database);
	if (!allTablesExist) {
		return;
	}

	filter(
		EventHelper.USERS_LOGIN_EVENT,
		//     async (input: any, actionContext: any) => { /** action */
		async (input, meta, actionContext) => {
			/** filter */
			const {database, schema} = actionContext;

			let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
			let profiles_service = itemsServiceCreator.getItemsService(CollectionNames.PROFILES);
			let users_service = itemsServiceCreator.getItemsService(CollectionNames.USERS);

			//const currentProvider = input.provider; //get the current provider
			//        let userId = input.user; // action
			let userId = meta.user; // filter
			const existingUsers = await database(CollectionNames.USERS).where({
				id: userId,
			});
			const existingUser = existingUsers[0];
			if (!existingUser) {
				//handle no user found error
				// @ts-ignore
				throw new Error(
					'profileCreateHook: No user found with id: ' + userId
				);
			}

			if (existingUser?.profile) {
				//user already has a profile
				return input;
			} else {
				//create a profile for the user
				try {
					console.log("Creating profile for user: " + userId)
					let profile_id = await profiles_service.createOne({}); //create a profile
					console.log("Created profile for user: " + userId)
					if (profile_id) {
						console.log("New profile id: " + profile_id)
						await users_service.updateOne(userId, {
							profile: profile_id
						});
						return input;
					}
				} catch (e) {
					console.log(
						'profileCreateHook: Error while creating profile for user: ' +
						userId
					);
					console.log(e);
					return input;
				}
			}
		}
	);
});
