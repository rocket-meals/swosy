import {authentication, createDirectus, DirectusClient, graphql, readItems, rest, RestClient,} from "@directus/sdk";
import {CustomDirectusTypes} from "@/helper/database_helper/directusTypes/types";

export class ServerAPI {

    static getServerUrl(){
        return 'http://directus.example.com';
    }

    static getPublicClient():  DirectusClient<CustomDirectusTypes> & RestClient<any>{
        const client = createDirectus<CustomDirectusTypes>(ServerAPI.getServerUrl()).with(rest());
        return client;
    }

    static getClient():  DirectusClient<CustomDirectusTypes> & RestClient<any>{
        const client = createDirectus(ServerAPI.getServerUrl())
            .with(authentication('cookie', { credentials: 'include' }))
            .with(graphql({ credentials: 'include' }))
            .with(rest({ credentials: 'include' }));
        return client;
    }

}