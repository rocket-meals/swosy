import {CommonSystemActionHelper} from "./SystemActionHelper";

export class UrlHelper {

	static async openExternalUrl(url){
		return await CommonSystemActionHelper.openExternalURL(url);
	}

}