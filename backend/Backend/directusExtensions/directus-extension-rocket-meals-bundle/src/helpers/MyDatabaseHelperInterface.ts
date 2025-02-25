import {ApiContext} from "./ApiContext";
import {EventContext as ExtentContextDirectusTypes} from "@directus/types";
import {ItemsServiceHelper} from "./ItemsServiceHelper";
import {DirectusUsers} from "../databaseTypes/types";
import {ServerInfo} from "./ItemsServiceCreator";

export interface MyDatabaseTestableHelperInterface {
    getServerInfo(): Promise<ServerInfo>;
    getServerUrl(): string | undefined;
}

export class MyDatabaseTestableHelper implements MyDatabaseTestableHelperInterface {
    async getServerInfo(): Promise<ServerInfo> {
        return {
            project: {
                project_name: 'Rocket Meals',
                project_color: '#D14610',
                project_logo: undefined,
            }
        };
    }

    getServerUrl(): string | undefined {
        return 'https://127.0.0.1/rocket-meals/api';
    }
}

export interface MyDatabaseHelperInterface extends MyDatabaseTestableHelperInterface {

    apiContext: ApiContext;
    eventContext: ExtentContextDirectusTypes | undefined;

    getUsersHelper(): ItemsServiceHelper<DirectusUsers>;

}
