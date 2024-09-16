export class DictHelper{
    static getValueListFromDict<T>(dict: { [p: string]: T }): T[] {
        let keys = Object.keys(dict);
        let values: T[] = [];
        for(let key of keys){
            let value = dict[key];
            if(!!value){
                values.push(value);
            }
        }
        return values;
    }

    static transformListToDict<T>(list: T[], keySelector: (item: T) => string): Record<string, T> {
        let dict: { [p: string]: T } = {};
        for(let item of list){
            let key = keySelector(item);
            dict[key] = item;
        }
        return dict
    }
}