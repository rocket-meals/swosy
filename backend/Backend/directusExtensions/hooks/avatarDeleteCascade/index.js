// in directus we need to add the filetype ... otherwise we get an error
import {EventHelper} from "../../helper/EventHelper.js"; // in directus we need to add the filetype ... otherwise we get an error
import {AvatarHelper} from "../../helper/AvatarHelper.js"; // in directus we need to add the filetype ... otherwise we get an error


function registerHook() {
    return handleHook.bind(null);
}

function handleHook(
    registerFunctions,
    context
) {
    registerFunctions.filter(
        EventHelper.USERS_DELETE_EVENT,
        // @ts-ignore
        async (payload, input, {database, schema, accountability}) => {
            const usersIds = payload; //get the user ids
            for (const userId of usersIds) {
                // for all users which get deleted
                await AvatarHelper.deleteAvatarOfUser(
                    context.services,
                    database,
                    schema,
                    accountability,
                    context.exceptions,
                    userId
                ); //delete avatar file
            }

            return payload;
        }
    );
}

export default registerHook();