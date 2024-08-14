import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {TimerHelper} from "../helpers/TimerHelper";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";

const TABLENAME_CASHREGISTERS = CollectionNames.CASHREGISTERS
const TABLENAME_CASHREGISTERS_TRANSACTIONS = CollectionNames.CASHREGISTERS_TRANSACTIONS
const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS

export const SCHEDULE_NAME = "Cashregister"

export class ParseSchedule {

    static SCHEDULE_NAME = SCHEDULE_NAME;

    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper

    private parser: any;
    private finished: boolean;
    private schema: any;
    private database: any;
    private logger: any;
    private services: any;
    private itemsServiceCreator: ItemsServiceCreator;
    private cashregisters_service: any;
    private cashregisters_transactions_service: any;

    constructor(parser, apiContext: ApiContext) {
        this.apiContext = apiContext
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext)
        this.parser = parser;
        this.finished = true;
    }

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(this.apiContext);

        this.cashregisters_service = await this.itemsServiceCreator.getItemsService(TABLENAME_CASHREGISTERS);
        this.cashregisters_transactions_service = await this.itemsServiceCreator.getItemsService(TABLENAME_CASHREGISTERS_TRANSACTIONS);
    }

    async setStatus(status: FlowStatus) {
        await this.myDatabaseHelper.getAppSettingsHelper().setCashregisterParsingStatus(status);
    }

    async isEnabled() {
        return await this.myDatabaseHelper.getAppSettingsHelper().isCashregisterParsingEnabled();
    }

    async getStatus() {
        return await this.myDatabaseHelper.getAppSettingsHelper().getCashregisterParsingStatus();
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        if (enabled && status === FlowStatus.START && this.finished) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            this.finished = false;
            await this.setStatus(FlowStatus.RUNNING);

            try {
                console.log("Create Needed Data");
                let transactions = await this.parser.getTransactionsList();

                let totalTransactionsToCheck = transactions.length;
                let myTimer = new TimerHelper(SCHEDULE_NAME+" parsing", totalTransactionsToCheck, 100);

                let external_cashregister_id_to_internal_cashregister_id = {

                }


                // DEBUG: DELETE ALL TRANSACTIONS
                let clearAllData = false;
                if(clearAllData){
                    await this.myDatabaseHelper.getCashregisterHelper().deleteAllTransactions();
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
                        let cashRegister = await this.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregister(cashregister_external_id);
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
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("[CashregisterParseSchedule] Failed");
                console.log(err);
                this.finished = true;
                await this.setStatus(FlowStatus.FAILED);
            }

        } else if (!this.finished && status !== FlowStatus.RUNNING) {
            await this.setStatus(FlowStatus.RUNNING);
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
