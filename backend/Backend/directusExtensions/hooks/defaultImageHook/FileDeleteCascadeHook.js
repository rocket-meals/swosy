import {AvatarHelper} from '../../helper/AvatarHelper.js';

export class FileDeleteCascadeHook {
    /**
     * Register this hook to delete files when item with files is deleted
     * @param collection_name the collection name
     * @param file_field_name the field name of the file
     */
    static registerHook(collection_name, file_field_name) {
        return FileDeleteCascadeHook.handleHook.bind(
            null,
            collection_name,
            file_field_name
        );
    }

    static handleHook(
        collection_name,
        file_field_name,
        registerFunctions,
        context
    ) {
        registerFunctions.filter(
            collection_name + '.items.delete',
            async (payload, input, { database, schema, accountability }) => {
                const collectionIds = payload; //get the user ids
                for (const collectionId of collectionIds) {
                    // for all users which get deleted
                    await AvatarHelper.deleteFileOfCollection(
                        context.services,
                        database,
                        schema,
                        accountability,
                        context.exceptions,
                        collection_name,
                        file_field_name,
                        collectionId
                    ); //delete avatar file
                }

                return payload;
            }
        );
    }
}
