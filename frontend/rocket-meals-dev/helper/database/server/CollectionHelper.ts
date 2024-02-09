import {DirectusClient, readItem, readItems, updateItem, updateItems, deleteItem, deleteItems, createItem, createItems, RestClient,} from "@directus/sdk";
import {CustomDirectusTypes} from "@/helper/database/databaseTypes/types";
import {ServerAPI} from "@/helper/database/server/ServerAPI";

export class CollectionHelper<CollectionScheme> {
    private collection: string;
    private client: (DirectusClient<CustomDirectusTypes> & RestClient<any>);

    constructor(collection: string, client?: DirectusClient<CustomDirectusTypes> & RestClient<any>) {
        this.collection = collection;
        if(!client){
            this.client = ServerAPI.getClient()
        } else {
            this.client = client;
        }
    }

    async readItems(query?: any) {
        return await this.client.request<CollectionScheme[]>(readItems(this.collection, query));
    }

    async readItem(id: number | string, query?: any) {
        return await this.client.request<CollectionScheme>(readItem(this.collection, id, query));
    }

    async updateItem(id: number | string, data: any) {
        return await this.client.request(updateItem(this.collection, id, data));
    }

    async updateItems(query: any, data: any) {
        return await this.client.request(updateItems(this.collection, query, data));
    }

    async deleteItem(id: number | string) {
        return await this.client.request(deleteItem(this.collection, id));
    }

    async deleteItems(query: any) {
        return await this.client.request(deleteItems(this.collection, query));
    }

    async createItem<CollectionScheme>(data: any) {
        return await this.client.request(createItem(this.collection, data));
    }

    convertListToDict(list: CollectionScheme[], key: string){
        let dict: Record<any, CollectionScheme> = {};
        for(let item of list){
            // @ts-ignore
            let id = item[key];
            // @ts-ignore
            dict[item[key]] = item;
        }
        return dict;
    }

}