import {ApiContext} from "./ApiContext";
import {ItemsServiceCreator} from "./ItemsServiceCreator";
import {CollectionNames} from "./CollectionNames";
import {Cashregisters, CashregistersTransactions} from "../databaseTypes/types";

export class CashregisterHelper {

    private apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiExtensionContext;
    }

    async getCashregisterTransactionsService() {
        const services = this.apiContext.services;
        const database = this.apiContext.database;
        const schema = await this.apiContext.getSchema();
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return itemsServiceCreator.getItemsService<CashregistersTransactions>(CollectionNames.CASHREGISTERS_TRANSACTIONS);
    }

    async getCashregisterService() {
        const services = this.apiContext.services;
        const database = this.apiContext.database;
        const schema = await this.apiContext.getSchema();
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return itemsServiceCreator.getItemsService<Cashregisters>(CollectionNames.CASHREGISTERS);
    }

    setStatusPublished(json: any) {
        json["status"] = "published";
        return json;
    }

    async findOrCreateCashregister(external_identifier: string) {
        const cashregisters_service = await this.getCashregisterService();
        let obj_json = {
            external_identifier: external_identifier,
        };

        const searchQuery = {
            filter: {_and: [
                    {external_identifier: {
                        _eq: obj_json.external_identifier
                    }},
                ]}
        }

        let objs = await cashregisters_service.readByQuery(searchQuery)
        let obj = objs[0]

        if (!obj) {
            obj_json = this.setStatusPublished(obj_json);
            await cashregisters_service.createOne(obj_json);
            objs = await cashregisters_service.readByQuery(searchQuery)
            obj = objs[0]
        }
        return obj;
    }

    async deleteAllTransactions() {
        let hasMore = true;
        const cashregisters_transactions_service = await this.getCashregisterTransactionsService();

        console.log("deleteAllTransactions");
        let amountToDeleteInABatch = 10000
        let times = 0;
        while (hasMore) {
            // Fetch transactions in batches
            let itemsToDelete = await cashregisters_transactions_service.readByQuery({
                filter: {},
                limit: amountToDeleteInABatch // Adjust the limit as needed, but keep it manageable
            });

            // Check if there are items to delete
            if (itemsToDelete.length > 0) {
                // Prepare array of IDs to delete
                let idsToDelete = itemsToDelete.map(item => item.id);

                // Delete transactions by IDs
                await cashregisters_transactions_service.deleteMany(idsToDelete);
            } else {
                // No more items to delete
                hasMore = false;
            }
            times++;
            console.log("-- "+times);
        }
        console.log("FINISHED DELETION");
    }

}
