import {ServerAPI} from "../../../kitcheningredients";

export class SyncCollectionLoader {

	static getFieldsForAll(){
		return ["*"];
	}

	static getFieldsForAllAndTranslations(additionalFields: string[] = []): string[]{
		let fields = SyncCollectionLoader.getFieldsForAll();
		fields.push("translations.*");
		for(let field of additionalFields){
			fields.push(field);
		}
		return fields;
	}

	private static async getRemoteCollection(collection, fields?, transformFunction?, sort?, limit?, offset?): Promise<any>{
		if(!limit){
			limit = -1;
		}

		//console.log("getRemoteCollection", collection);
		if(!fields){
			fields = SyncCollectionLoader.getFieldsForAll();
		}
		const directus = ServerAPI.getClient();
		try{
			let answer = await directus.items(collection).readByQuery({limit: limit, fields: fields, sort: sort, offset: offset});
			let data = answer?.data;

			if(!!transformFunction && !!data){
				data = await transformFunction(data);
			}

			return data;
		} catch (err){
			console.log("getRemoteCollection", collection, "failed");
			console.log(err);
			return [];
		}
		return null;
	}

	static async setCacheOfRemoteCollection(collection, currentValue, setFunction, fields?, transformFunction?, sort?, limit?, offset?): Promise<any>{
		let loadedValue = await SyncCollectionLoader.getRemoteCollection(collection, fields, transformFunction, sort, limit, offset);
		if(!!loadedValue){
			let asString = JSON.stringify(loadedValue)
			if(asString!==JSON.stringify(currentValue)){
				setFunction(loadedValue);
			}
		}
		return loadedValue;
	}

}
