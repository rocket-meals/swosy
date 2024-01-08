import {AvatarHelper} from '../../helper/AvatarHelper.js';

export class FileUpdateDeleteCascadeHook {
  /**
   * Register this hook to delete files when item is updated
   * @param collection_name the collection name
   * @param file_field_name the field name of the file
   * @param beforeDelete [optional] a hook before the deletion of the file. Must return payload
   * @param afterDelete [optional] a hook after the deletion of the file. Must return payload
   */
  static registerHook(
      collection_name,
      file_field_name,
      beforeDelete,
      afterDelete
  ) {
    return FileUpdateDeleteCascadeHook.handleHook.bind(
        null,
        collection_name,
        file_field_name,
        beforeDelete,
        afterDelete
    );
  }

  static handleHook(
      collection_name,
      file_field_name,
      beforeDelete,
      afterDelete,
      registerFunctions,
      context
  ) {
    registerFunctions.filter(
        collection_name + '.items.update',
        async (payload, input, { database, schema, accountability }) => {
          if (file_field_name in payload) {
            //is our searched key updated (value can be null!)
            const collectionIds = input.keys; // get all items which get updated

            if (beforeDelete) {
              payload = await beforeDelete(
                  collection_name,
                  file_field_name,
                  payload,
                  input,
                  database,
                  schema,
                  accountability,
                  registerFunctions,
                  context
              );
            }

            for (const collectionId of collectionIds) {
              // for item which gets updated
              await AvatarHelper.deleteFileOfCollection(
                  context.services,
                  database,
                  schema,
                  accountability,
                  context.exceptions,
                  collection_name,
                  file_field_name,
                  collectionId
              ); //delete file
            }

            if (afterDelete) {
              payload = await afterDelete(
                  collection_name,
                  file_field_name,
                  payload,
                  input,
                  database,
                  schema,
                  accountability,
                  registerFunctions,
                  context
              );
            }
          }

          return payload;
        }
    );
  }
}
