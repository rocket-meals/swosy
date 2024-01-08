import {ServerAPI} from "../../../kitcheningredients";

export class RemoteDirectusSettingsLoader{

	static async getRemoteDirectusSettings(): Promise<any>{
		const directus = ServerAPI.getClient();
		try{
			let answer = await directus.settings.read()
			return answer;
		} catch (err){
			//console.log(err);
		}
		return null;
	}

}
