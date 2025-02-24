import {ApiContext} from "./ApiContext";
import {EventContext as ExtentContextDirectusTypes} from "@directus/types";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {DirectusUsers} from "../databaseTypes/types";

export interface MyDatabaseHelperInterface {

    apiContext: ApiContext;
    eventContext: ExtentContextDirectusTypes | undefined;

    getUsersHelper(): ItemsServiceHelper<DirectusUsers>;

}
