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
        console.log("findOrCreateCashregisterTransaction in CashregisterHelper");
        console.log("cashregistersTransactionsForParser");
        console.log(cashregistersTransactionsForParser);
        console.log("cashregister_id");
        console.log(cashregister_id);
        const cashregisters_transactions_service = await this.getCashregisterTransactionsService();
        let obj_json: Partial<CashregistersTransactions> = cashregistersTransactionsForParser.baseData
        obj_json.id = cashregistersTransactionsForParser.baseData.id; // just to be sure that the external_identifier is set


        console.log("readOne");
        console.log("cashregistersTransactionsForParser.baseData.id");
        console.log(cashregistersTransactionsForParser.baseData.id);

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
            console.log("transaction not found - create it");
            obj_json = this.setStatusPublished(obj_json);
            console.log("create one with id");
            console.log(obj_json.id);
            let transaction_id = await cashregisters_transactions_service.createOne({
                id: obj_json.id,
            });

            console.log("update name");
            console.log("obj_json.name");
            console.log(obj_json.name);
            await cashregisters_transactions_service.updateOne(transaction_id, {
                name: obj_json.name,
            });

            console.log("update quantity");
            console.log("obj_json.quantity");
            console.log(obj_json.quantity);
            await cashregisters_transactions_service.updateOne(transaction_id, {
                quantity: obj_json.quantity,
            });

            console.log("update date");
            console.log("obj_json.date");
            console.log(obj_json.date);
            await cashregisters_transactions_service.updateOne(transaction_id, {
                date: obj_json.date,
            });

            console.log("update related cashregister");
            console.log("cashregister_id");
            console.log(cashregister_id);
            await cashregisters_transactions_service.updateOne(transaction_id, {
                cashregister: cashregister_id,
            });

            console.log("created and updated transaction hopefully");
            console.log("search again for the transaction");
            console.log("transaction_id");
            console.log(transaction_id);
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
