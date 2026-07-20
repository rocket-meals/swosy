import { createURL } from 'expo-linking';
import { Platform } from 'react-native';
import { EnvHelper } from './EnvHelper';

// import app.json

export class UrlHelper {
	static createLocalURL(path: string) {
		const isProduction = EnvHelper.isProduction(); // TODO: Check if issue: https://github.com/rocket-meals/rocket-meals/issues/15 is fixed

		if (Platform.OS !== 'web') {
			// The base url workaround below is only needed for web builds. In
			// native production builds it turned "scheme://login" into
			// "scheme://rocket-meals/login", which matches no expo-router route,
			// so the auth deep link could never reach the login screen.
			return createURL(path);
		}

		if (isProduction) {
			// TODO: Check if issue: https://github.com/rocket-meals/rocket-meals/issues/15 is fixed
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
			// example: url = "localhost:19006/login" TODO: Url does not seem to have the baseUrl but it works in development. Seems to be a bug.
			return url;
		}
	}

	static getURLToLogin() {
		const url = UrlHelper.createLocalURL('/login');
		return url;
	}
}
