import {ItemsServiceCreator} from "../../helper/ItemsServiceCreator.js"; // in directus we need to add the filetype ... otherwise we get an error

export default async function ({filter, action, init, schedule}, {
    services,
    exceptions,
    database,
    getSchema,
    logger
}) {

    const excludeCollections = ["collections_dates_last_update"];
    // create a function which will be called after any update, create or delete of a collection, except the collection "collections_dates_last_update"
    // this function will update the collection "collections_dates_last_update" with the current date for the collection which was updated, created or deleted

    let schema = await getSchema();
    let itemsServiceCreator = new ItemsServiceCreator(services, database, schema);
    let collectionsDatesLastUpdateService = itemsServiceCreator.getItemsService("collections_dates_last_update");

    async function updateLastUpdateDate(collection) {
        // check if the collection is not in the excludeCollections list
        if (!excludeCollections.includes(collection)) {
            // get the current date
            let currentDate = new Date().toISOString();

            // find if the item with the id: collection exists in the collection "collections_dates_last_update"
            let items = await collectionsDatesLastUpdateService.readByQuery({
                filter: {
                    id: collection
                }
            });

            // if the item with the id: collection exists in the collection "collections_dates_last_update"
            if (items.length > 0) {
                // update the item with the id: collection in the collection "collections_dates_last_update" with the current date
                await collectionsDatesLastUpdateService.updateOne(collection, {
                    date_updated: currentDate
                });
            } else {
                // create a new item in the collection "collections_dates_last_update" with the id: collection and the current date
                await collectionsDatesLastUpdateService.createOne({
                    id: collection,
                    date_updated: currentDate
                });
            }
        }
    }


    action(
        "*" + ".items.update",
        async (meta, context) => {
            // get the collection which was updated
            let collection = meta.collection;

            // update the collection "collections_dates_last_update" with the current date for the collection which was updated
            await updateLastUpdateDate(collection);
        }
    );

    action(
        "*" + ".items.create",
        async (meta, context) => {
            // get the collection which was created
            let collection = meta.collection;

            // update the collection "collections_dates_last_update" with the current date for the collection which was created
            await updateLastUpdateDate(collection);
        }
    );

    action(
        "*" + ".items.delete",
        async (meta, context) => {
            // get the collection which was deleted
            let collection = meta.collection;

            // update the collection "collections_dates_last_update" with the current date for the collection which was deleted
            await updateLastUpdateDate(collection);
        }
    );
};
