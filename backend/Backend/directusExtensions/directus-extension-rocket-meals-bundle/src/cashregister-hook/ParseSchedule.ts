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
                    console.log("Transaction parsing progress: " + i + "/" + totalTransactionsToCheck);
                    let transaction = transactions[i];
                    if(!transaction){
                        continue;
                    }

                    let cashregister_external_id = transaction?.cashregister_external_idenfifier;
                    console.log("cashregister_external_id: "+cashregister_external_id);

                    let cached_cashregister_id = external_cashregister_id_to_internal_cashregister_id[cashregister_external_id];
                    let cashregister_id = undefined;
                    console.log("cached_cashregister_id: "+cached_cashregister_id);
                    if(cached_cashregister_id === undefined){
                        console.log("findOrCreateCashregister");
                        let cashRegister = await this.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregister(cashregister_external_id);
                        if(!!cashRegister){
                            console.log("cashRegister found: "+cashRegister.id);
                            cached_cashregister_id = cashRegister?.id;
                            external_cashregister_id_to_internal_cashregister_id[cashregister_external_id] = cached_cashregister_id;
                            cashregister_id = cached_cashregister_id
                        }
                    } else {
                        cashregister_id = cached_cashregister_id
                    }
                    //console.timeEnd("findOrCreateCashregister");

                    if(cashregister_id !== undefined){
                        console.log("cashregister_id found: "+cashregister_id);
                        console.log("findOrCreateCashregisterTransaction");
                        await this.findOrCreateCashregisterTransaction(transaction, cashregister_id);
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
        return await this.myDatabaseHelper.getCashregisterHelper().findOrCreateCashregisterTransaction(transaction, cashregister_id);
    }

}
