import {ApiContext} from "./ApiContext";
import {AppSettingsHelper} from "./AppSettingsHelper";
import {CashregisterHelper} from "./CashregisterHelper";

export class MyDatabaseHelper {

    private apiExtensionContext: ApiContext;

    constructor(apiExtensionContext: ApiContext) {
        this.apiExtensionContext = apiExtensionContext;
    }

    getAppSettingsHelper() {
        return new AppSettingsHelper(this.apiExtensionContext);
    }

    getCashregisterHelper() {
        return new CashregisterHelper(this.apiExtensionContext);
    }

}
