import {ParseSchedule, SCHEDULE_NAME} from "./ParseSchedule"
import {Cashregisters_SWOSY} from "./Cashregisters_SWOSY"
import {defineHook} from "@directus/extensions-sdk";
import {CollectionNames} from "../helpers/CollectionNames";
import {DatabaseInitializedCheck} from "../helpers/DatabaseInitializedCheck";
import {EnvVariableHelper, SyncForCustomerEnum} from "../helpers/EnvVariableHelper";
import {CashregisterTransactionParserInterface} from "./CashregisterTransactionParserInterface";


export default defineHook(async ({action}, apiContext) => {
    let allTablesExist = await DatabaseInitializedCheck.checkAllTablesExistWithApiContext(SCHEDULE_NAME,apiContext);
    if (!allTablesExist) {
        return;
    }

    let collection = CollectionNames.APP_SETTINGS;

    let usedParser: CashregisterTransactionParserInterface | null = null;
    switch (EnvVariableHelper.getSyncForCustomer()) {
        case SyncForCustomerEnum.TEST:
            usedParser = null;
            break;
        case SyncForCustomerEnum.HANNOVER:
            usedParser = null;
            break;
        case SyncForCustomerEnum.OSNABRUECK:
            usedParser = new Cashregisters_SWOSY("https://share.sw-os.de/swosy-kassendaten-2h", `Nils:qYoTHeyPyRljfEGRWW52`);
            break;
    }

    if (!usedParser) {
        console.log("No Parser set for Cashregister Sync");
        return;
    }

    const parseSchedule = new ParseSchedule(usedParser, apiContext);

    action(
        collection + ".items.update",
        async (meta, context) => {
            try {
                await parseSchedule.parse();
            } catch (err) {
                console.log(err);
            }
        }
    );
});
