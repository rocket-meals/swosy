export class KeyExtractorHelper{

    static getListOfStaticKeyValues(Class): string[]{
        let classKeys = Object.keys(Class);
        let synchedKeys = [];
        for(let classKey of classKeys){
            let synchedKey = Class[classKey];
            synchedKeys.push(synchedKey)
        }
        return synchedKeys;
    }
}