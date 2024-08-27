import {AbstractService, ItemsServiceCreator} from "./ItemsServiceCreator";
import type {Filter} from "@directus/types/dist/filter";
import {ApiContext} from "./ApiContext";
import {PrimaryKey} from "@directus/types";

export class ItemsServiceHelper{

    static async updateItemWithApiContext<T>(apiContext: ApiContext, tablename: string, primary_key: PrimaryKey, update: Partial<T>): Promise<PrimaryKey>{
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return await itemsService.updateOne(primary_key, update);
    }

    static async findOrCreateItemWithApiContext<T>(apiContext: ApiContext, tablename: string, search: Partial<T>, create: Partial<T>){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return this.findOrCreateItem<T>(itemsService, search, create);
    }

    static async findOrCreateItem<T>(itemService: AbstractService<T>, search: Partial<T>, create: Partial<T>){
        let andFilter: any[] = [];
        let fieldsOfItem = Object.keys(search);
        for(let field of fieldsOfItem){
            let fieldFilter: any = {};
            // @ts-ignore
            let fieldValue = search[field];
            fieldFilter[field] = {_eq: fieldValue};
            andFilter.push(fieldFilter);
        }

        let queryFilter: Filter = {_and: andFilter};
        const query = {filter: queryFilter};

        let queriedItems = await itemService.readByQuery(query);
        let foundItem = queriedItems[0]

        let copiedCreateItem = JSON.parse(JSON.stringify(create));
        if (!foundItem) {
            copiedCreateItem = ItemsServiceHelper.setStatusPublished(copiedCreateItem);
            await itemService.createOne(copiedCreateItem)

        }
        queriedItems = await itemService.readByQuery(query);
        foundItem = queriedItems[0]
        return foundItem;
    }

    static async createItemWithApiContext<T>(apiContext: ApiContext, tablename: string, create: Partial<T>){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        create = ItemsServiceHelper.setStatusPublished(create);
        return itemsService.createOne(create);
    }

    static async readOneItemWithApiContext<T>(apiContext: ApiContext, tablename: string, primary_key: PrimaryKey){
        const itemsServiceCreator = new ItemsServiceCreator(apiContext);
        let itemsService = await itemsServiceCreator.getItemsService<T>(tablename);
        return itemsService.readOne(primary_key);
    }

    static setStatusPublished(json: any) {
        json["status"] = "published";
        return json;
    }
}