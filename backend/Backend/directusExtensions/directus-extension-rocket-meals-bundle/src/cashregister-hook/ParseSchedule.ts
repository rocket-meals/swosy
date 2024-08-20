import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {TimerHelper} from "../helpers/TimerHelper";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {
    CashregistersTransactionsForParser,
    CashregisterTransactionParserInterface
} from "./CashregisterTransactionParserInterface";
import {Cashregisters, CashregistersTransactions} from "../databaseTypes/types";

const TABLENAME_CASHREGISTERS = CollectionNames.CASHREGISTERS
const TABLENAME_CASHREGISTERS_TRANSACTIONS = CollectionNames.CASHREGISTERS_TRANSACTIONS
const TABLENAME_FLOWHOOKS = CollectionNames.APP_SETTINGS

export const SCHEDULE_NAME = "Cashregister"

export class ParseSchedule {

    static SCHEDULE_NAME = SCHEDULE_NAME;

    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper
    private parser: CashregisterTransactionParserInterface;

    constructor(parser: CashregisterTransactionParserInterface, apiContext: ApiContext) {
        this.apiContext = apiContext
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext)
        this.parser = parser;
    }

    async getCashregisterService(){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return await itemsServiceCreator.getItemsService<Cashregisters>(TABLENAME_CASHREGISTERS);
    }

    async getCashregisterTransactionService(){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        return await itemsServiceCreator.getItemsService<CashregistersTransactions>(TABLENAME_CASHREGISTERS_TRANSACTIONS);
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

        if (enabled && status === FlowStatus.START) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);

            try {
                console.log("Create Needed Data");
                let transactions = await this.parser.getTransactionsList();

                let totalTransactionsToCheck = transactions.length;
                let myTimer = new TimerHelper(SCHEDULE_NAME+" parsing", totalTransactionsToCheck, 100);

                let external_cashregister_id_to_internal_cashregister_id: {[key: string]: string} = {

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
                    if(!transaction){
                        continue;
                    }

                    // Timing getCashregisterExternalIdentifierFromTransaction
                    //console.time("getCashregisterExternalIdentifierFromTransaction");
                    let cashregister_external_id = transaction?.cashregister_external_idenfifier;
                    //console.timeEnd("getCashregisterExternalIdentifierFromTransaction");

                    // Timing findOrCreateCashregister
                    //console.time("findOrCreateCashregister");
                    let cached_cashregister_id = external_cashregister_id_to_internal_cashregister_id[cashregister_external_id];
                    let cashregister_id = undefined;
                    if(!cached_cashregister_id){ // TODO: change to check for undefined and null instead
                        let cashRegister = await this.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregister(cashregister_external_id);
                        if(!!cashRegister){
                            cached_cashregister_id = cashRegister?.id;
                            external_cashregister_id_to_internal_cashregister_id[cashregister_external_id] = cached_cashregister_id;
                            cashregister_id = cached_cashregister_id
                        }
                    } else {
                        cashregister_id = cached_cashregister_id
                    }
                    //console.timeEnd("findOrCreateCashregister");

                    if(!!cashregister_id){
                        //console.time("findOrCreateCashregisterTransaction");
                        await this.findOrCreateCashregisterTransaction(transaction, cashregister_id);
                        //console.timeEnd("findOrCreateCashregisterTransaction");
                    } else {
                        console.log("Houston we got a problem? Seems like somebody deleted a cashregister mid transaction");
                    }

                    myTimer.printEstimatedTime(i);
                }


                console.log("[CashregisterParseSchedule] Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("[CashregisterParseSchedule] Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }
        }
    }

    async findOrCreateCashregisterTransaction(transaction: CashregistersTransactionsForParser, cashregister_id: string) {

        let transaction_id = transaction.baseData.id

        if(!transaction_id){
            return null;
        }


        let obj_json: CashregistersTransactions = {
            status: "published",
            date: transaction.baseData.date,
            name: transaction.baseData.name,
            quantity: transaction.baseData.quantity,
            cashregister: cashregister_id,
            id: transaction_id,
        };

        let cashregisters_transactions_service = await this.getCashregisterTransactionService();

        let obj = undefined;
        let objs = await cashregisters_transactions_service.readByQuery({
            filter: {id: {
                    _eq: transaction_id
                }
            }
        })
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
            try{
                await cashregisters_transactions_service.createOne(obj_json);
            } catch (err){
                // this error should not happen. Only happend one, where we used readMany instead of readOne
                // TODO: Check if this error still occurs
                //console.log("Error at: await this.cashregisters_transactions_service.createOne(obj_json);");
                //console.log("obj_json?.id: "+obj_json?.id)
            }

            objs = await cashregisters_transactions_service.readMany([obj_json.id]);
            obj = objs[0]
        } else {
            //console.log("Transaction already found")
        }
        return obj;
    }

}
