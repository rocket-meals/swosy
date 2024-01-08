export class CollectionHelper {

    static transformCollectionToDict(collection: any[]): any {
        return CollectionHelper.transformCollectionToDictByKey("id", collection);
    }

    static transformCollectionToDictByKey(key: string, collection: any[]): any {
        let dict = {};
        for(let item of collection){
            dict[item[key]] = item;
        }
        return dict;
    }

}
