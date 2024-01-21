import {createURL} from "expo-linking";
import {EnvHelper} from "@/helper/EnvHelper";

// import app.json


export class UrlHelper {

	static createLocalURL(path: string){
		let isProduction = EnvHelper.isProduction(); // TODO: Check if issue: https://github.com/rocket-meals/rocket-meals/issues/15 is fixed

		if(isProduction){
			// TODO: Check if issue: https://github.com/rocket-meals/rocket-meals/issues/15 is fixed
			let urlWithoutBaseUrl = createURL(path); // createUrl creates a url but without the base url which seems to be a bug
			// example: path = "/login"
			// example: urlWithoutBaseUrl = "https://localhost:3000/login"
			let urlWithoutPath = urlWithoutBaseUrl.replace(path, ""); // remove the path from the url
			// example: urlWithoutPath = "https://localhost:3000"
			let baseUrl = EnvHelper.getBaseUrl();
			// example: baseUrl = "/rocket-meals"
			let url = urlWithoutPath + baseUrl + path;
			// example: url = "https://localhost:3000/rocket-meals/login"

			return url;
		} else {
			let url = createURL(path);
			// example: url = "localhost:19006/login" TODO: Url does not seem to have the baseUrl but it works in development. Seems to be a bug.
			return url;
		}
	}

	static getURLToLogin(){
		let url = UrlHelper.createLocalURL("/login");
		return url;
	}

}
