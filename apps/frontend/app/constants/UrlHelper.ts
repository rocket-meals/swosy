import { createURL } from 'expo-linking';
import { EnvHelper } from './EnvHelper';

// import app.json

export class UrlHelper {
	static createLocalURL(path: string) {
		const isProduction = EnvHelper.isProduction();

		if (isProduction) {
			const urlWithoutBaseUrl = createURL(path); // createUrl creates a url but without the base url which seems to be a bug
			// example: path = "/login"
			// example: urlWithoutBaseUrl = "https://localhost:3000/login"
			const urlWithoutPath = urlWithoutBaseUrl.replace(path, ''); // remove the path from the url
			// example: urlWithoutPath = "https://localhost:3000"
			// const baseUrl = EnvHelper.getBaseUrl();
			const baseUrl = '/rocket-meals';
			// example: baseUrl = "/rocket-meals"
			const url = urlWithoutPath + baseUrl + path;
			// example: url = "https://localhost:3000/rocket-meals/login"

			return url;
		} else {
			const url = createURL(path);
			// example: url = "localhost:19006/login"
			return url;
		}
	}

	static getURLToLogin() {
		const url = UrlHelper.createLocalURL('/login');
		return url;
	}
}
