import {EventHelper} from '../../helper/EventHelper.js'; // in directus we need to add the filetype ... otherwise we get an error
import {ItemsServiceCreator} from "../../helper/ItemsServiceCreator.js"; // in directus we need to add the filetype ... otherwise we get an error

// TODO: Catch if table does not exist

/**
 * A small hook, to create a profile upon user registration
 * You will need to create a table (e. G. "profiles") with a field "user" which relates to "directus_users"
 */

//TODO try catch init if database is not ready
//TODO init table profiles if not exists
//TODO check if field profile exists in directus_users

const DEFAULT_PROFILE_TABLENAME = 'profiles';

class ProfileCreateHook {
    static handleHook(
        tablename_profiles,
        registerFunctions,
        {
            services,
            exceptions,
            database,
            getSchema,
            logger
        }
    ) {
        const {filter, action, init, schedule} = registerFunctions;

        filter(
            EventHelper.USERS_LOGIN_EVENT,
            //     async (input: any, actionContext: any) => { /** action */
            async (input, meta, actionContext) => {
                /** filter */
                const {database, schema, accountability} = actionContext;

                let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
                let profiles_service = itemsServiceCreator.getItemsService("profiles");
                let users_service = itemsServiceCreator.getItemsService("directus_users");

                const currentProvider = input.provider; //get the current provider
                //        let userId = input.user; // action
                let userId = meta.user; // filter
                const existingUsers = await database('directus_users').where({
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
    }

    /**
     * Register the profile create hook
     * @param customProfileTablename you can specify the name of the profile tablename
     */
    static registerHook(customProfileTablename) {
        let tablename = customProfileTablename || DEFAULT_PROFILE_TABLENAME;
        return ProfileCreateHook.handleHook.bind(null, tablename);
    }
}

export default ProfileCreateHook.registerHook();