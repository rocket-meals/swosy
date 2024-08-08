import {ApiContext} from "./ApiContext";
import {AppSettingsHelper} from "./AppSettingsHelper";

export class MyDatabaseHelper {

    private apiExtensionContext: ApiContext;

    constructor(apiExtensionContext: ApiContext) {
        this.apiExtensionContext = apiExtensionContext;
    }

    getAppSettingsHelper() {
        return new AppSettingsHelper(this.apiExtensionContext);
    }

}
