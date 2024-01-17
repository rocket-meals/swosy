import {Platform} from "react-native";
import {PlatformHelper} from "@/helper/PlatformHelper";
import {createURL} from "expo-linking";

export class UrlHelper {

	static getURLToLogin(){
		let url = createURL("/login");
		return url;
	}

}
