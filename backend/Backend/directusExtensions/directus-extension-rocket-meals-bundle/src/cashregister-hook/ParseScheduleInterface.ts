import {CashregistersTransactions} from "../databaseTypes/types";

export type CashregistersTransactionsForParser = Omit<CashregistersTransactions, "id" | "created_on" | "updated_on" | "created_by" | "updated_by" | "status">

export interface ParseScheduleInterface {

    getTransactionsList(): Promise<CashregistersTransactionsForParser[]>

}
