import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {TimerHelper} from "../helpers/TimerHelper";

const TABLENAME_CASHREGISTERS = "cashregisters";
const TABLENAME_CASHREGISTERS_TRANSACTIONS = "cashregisters_transactions";
const TABLENAME_FLOWHOOKS = "app_settings";

let SCHEDULE_NAME = "Cashregister"

export class ParseSchedule {

    private parser: any;
    private finished: boolean;
    private schema: any;
    private database: any;
    private logger: any;
    private services: any;
    private itemsServiceCreator: ItemsServiceCreator;
    private itemService: any;
    private cashregisters_service: any;
    private cashregisters_transactions_service: any;

    constructor(parser) {
        this.parser = parser;
        this.finished = true;
    }

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(services, database, this.schema);

        this.cashregisters_service = this.itemsServiceCreator.getItemsService(TABLENAME_CASHREGISTERS);
        this.cashregisters_transactions_service = this.itemsServiceCreator.getItemsService(TABLENAME_CASHREGISTERS_TRANSACTIONS);
    }

    async setStatus(status) {
        await this.database(TABLENAME_FLOWHOOKS).update({
            cashregisters_parsing_status: status
        });
    }

    async isEnabled() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.cashregisters_parsing_enabled;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getStatus() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.cashregisters_parsing_status;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async deleteAllTransactions() {
        let hasMore = true;

        console.log("deleteAllTransactions");
        let amountToDeleteInABatch = 10000
        let times = 0;
        while (hasMore) {
            // Fetch transactions in batches
            let itemsToDelete = await this.cashregisters_transactions_service.readByQuery({
                filter: {},
                limit: amountToDeleteInABatch // Adjust the limit as needed, but keep it manageable
            });

            // Check if there are items to delete
            if (itemsToDelete.length > 0) {
                // Prepare array of IDs to delete
                let idsToDelete = itemsToDelete.map(item => item.id);

                // Delete transactions by IDs
                await this.cashregisters_transactions_service.deleteMany(idsToDelete);
            } else {
                // No more items to delete
                hasMore = false;
            }
            times++;
            console.log("-- "+times);
        }
        console.log("FINISHED DELETION");
    }


    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()
        let statusCheck = "start";
        let statusFinished = "finished";
        let statusRunning = "running";
        let statusFailed = "failed";

        if (enabled && status === statusCheck && this.finished) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            this.finished = false;
            await this.setStatus(statusRunning);

            try {
                console.log("Create Needed Data");
                await this.parser.loadData();


                let transactions = await this.parser.getTransactionsList();

                let totalTransactionsToCheck = transactions.length;
                let myTimer = new TimerHelper(SCHEDULE_NAME+" parsing", totalTransactionsToCheck, 100);

                let external_cashregister_id_to_internal_cashregister_id = {

                }


                // DEBUG: DELETE ALL TRANSACTIONS
                let clearAllData = false;
                if(clearAllData){
                    await this.deleteAllTransactions();
                }


                myTimer.start()



                for (let i = 0; i < totalTransactionsToCheck; i++) {
                    //console.log("Transaction parsing progress: " + i + "/" + totalTransactionsToCheck);
                    let transaction = transactions[i];

                    // Timing getCashregisterExternalIdentifierFromTransaction
                    //console.time("getCashregisterExternalIdentifierFromTransaction");
                    let cashregister_external_id = await this.parser.getCashregisterExternalIdentifierFromTransaction(transaction);
                    //console.timeEnd("getCashregisterExternalIdentifierFromTransaction");

                    // Timing findOrCreateCashregister
                    //console.time("findOrCreateCashregister");
                    let cached_id = external_cashregister_id_to_internal_cashregister_id[cashregister_external_id];
                    let cashregister_internal_id = undefined;
                    if(!cached_id){ // TODO: change to check for undefined and null instead
                        let cashRegister = await this.findOrCreateCashregister(cashregister_external_id);
                        if(!!cashRegister){
                            cached_id = cashRegister?.id;
                            external_cashregister_id_to_internal_cashregister_id[cashregister_external_id] = cached_id;
                            cashregister_internal_id = cached_id
                        }
                    } else {
                        cashregister_internal_id = cached_id
                    }
                    //console.timeEnd("findOrCreateCashregister");

                    if(!!cashregister_internal_id){
                        //console.time("findOrCreateCashregisterTransaction");
                        await this.findOrCreateCashregisterTransaction(transaction, cashregister_internal_id);
                        //console.timeEnd("findOrCreateCashregisterTransaction");
                    } else {
                        console.log("Houston we got a problem? Seems like somebody deleted a cashregister mid transaction");
                    }

                    myTimer.printEstimatedTime(i);
                }


                console.log("[CashregisterParseSchedule] Finished");
                this.finished = true;
                await this.setStatus(statusFinished);
            } catch (err) {
                console.log("[CashregisterParseSchedule] Failed");
                console.log(err);
                this.finished = true;
                await this.setStatus(statusFailed);
            }

        } else if (!this.finished && status !== statusRunning) {
            await this.setStatus(statusRunning);
        }
    }

    async findOrCreateCashregisterTransaction(transaction, intern_cash_register_id) {

        let transaction_id = this.parser.getIdFromTransaction(transaction);

        if(!transaction_id){
            return null;
        }


        let obj_json = {
            date: new Date(this.parser.getDateFromTransaction(transaction)),
            name:this.parser.getNameFromTransaction(transaction),
            quantity:this.parser.getQuantityFromTransaction(transaction),
            cashregister: intern_cash_register_id,
            id: transaction_id,
        };


        let obj = undefined;
        let objs = this.cashregisters_transactions_service.readOne(obj_json?.id);
        obj = objs[0]
        /**
         * Using readOne get this error:
         * https://github.com/directus/directus/issues/20990
         Error [DirectusError]: You don't have permission to access this.
             at ItemsService.readOne (file:///directus/node_modules/.pnpm/file+api_@unhead+vue@1.8.9_pinia@2.1.7_typescript@5.3.3_vue@3.3.13/node_modules/@directus/api/dist/services/items.js:367:19)
             at async ParseSchedule.parse (file:///directus/extensions/hooks/cashregisterSchedule/ParseSchedule.js:165:25)
             at async EventEmitter.<anonymous> (file:///directus/extensions/hooks/cashregisterSchedule/index.js?t=1704650646922:73:17)
             at async Promise.all (index 0) {
           extensions: undefined,
           code: 'FORBIDDEN',
           status: 403
         }
         */


        if (!obj) {
            obj_json = this.setStatusPublished(obj_json);

            try{
                await this.cashregisters_transactions_service.createOne(obj_json);
            } catch (err){
                // this error should not happen. Only happend one, where we used readMany instead of readOne
                // TODO: Check if this error still occurs
                //console.log("Error at: await this.cashregisters_transactions_service.createOne(obj_json);");
                //console.log("obj_json?.id: "+obj_json?.id)
            }

            objs = this.cashregisters_transactions_service.readMany([obj_json.id]);
            obj = objs[0]
        } else {
            //console.log("Transaction already found")
        }


        return obj;
    }

    async findOrCreateCashregister(external_identifier) {
        let obj_json = {
            external_identifier: external_identifier,
        };

        let objs = await this.cashregisters_service.readByQuery({
            filter: {external_identifier: obj_json.external_identifier}
        })
        let obj = objs[0]

        if (!obj) {
            obj_json = this.setStatusPublished(obj_json);
            await this.cashregisters_service.createOne(obj_json);
            objs = await this.cashregisters_service.readByQuery({
                filter: {external_identifier: obj_json.external_identifier}
            })
            obj = objs[0]
        }
        return obj;
    }

    setStatusPublished(json) {
        json["status"] = "published";
        return json;
    }

}
