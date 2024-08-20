import {ApiContext} from "./ApiContext";
import {ItemsServiceCreator} from "./ItemsServiceCreator";
import {CollectionNames} from "./CollectionNames";
import {Cashregisters, CashregistersTransactions} from "../databaseTypes/types";
import {
    CashregistersTransactionsForParser,
    CashregistersTransactionsOmmitedFields
} from "../cashregister-hook/CashregisterTransactionParserInterface";
import {Query} from "@directus/types";

export class CashregisterHelper {

    private apiContext: ApiContext;

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
    }

    async getCashregisterTransactionsService() {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return itemsServiceCreator.getItemsService<CashregistersTransactions>(CollectionNames.CASHREGISTERS_TRANSACTIONS);
    }

    async getCashregisterService() {
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return itemsServiceCreator.getItemsService<Cashregisters>(CollectionNames.CASHREGISTERS);
    }

    setStatusPublished(json: any) {
        json["status"] = "published";
        return json;
    }

    async findOrCreateCashregisterTransaction(cashregistersTransactionsForParser: CashregistersTransactionsForParser, cashregister_id: string) {
        const cashregisters_transactions_service = await this.getCashregisterTransactionsService();
        let obj_json: Partial<CashregistersTransactions> = cashregistersTransactionsForParser.baseData
        obj_json.id = cashregistersTransactionsForParser.baseData.id; // just to be sure that the external_identifier is set

        //let obj = await cashregisters_transactions_service.readOne(cashregistersTransactionsForParser.baseData.id) // Error [DirectusError]: You don't have permission to access this.
        // workaround use query instead of readOne
        const searchQuery = {
            filter: {
                id: {
                    _eq: cashregistersTransactionsForParser.baseData.id
                }
            }
        }
        let objs = await cashregisters_transactions_service.readByQuery(searchQuery)
        let obj = objs[0]

        if (!obj) {
            //console.log("transaction not found - create it");
            obj_json = this.setStatusPublished(obj_json);
            //console.log("create one with obj_json and cashregister_id");
            //console.log(obj_json);
            await cashregisters_transactions_service.createOne({
                ...obj_json,
                cashregister: cashregister_id,
            });

            objs = await cashregisters_transactions_service.readByQuery(searchQuery)
            obj = objs[0]
            return obj;
        } else {
            console.log("transaction found");
            return obj;
        }
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
