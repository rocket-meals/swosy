import {createURL} from "expo-linking";

export class UrlHelper {

	static getURLToLogin(){
		let url = createURL("/login");
		return url;
	}

}
