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
}