//import * as appJson from '@/app.config';
import getAppJson from "@/app.config";


export class EnvHelper {
	static isProduction() {
		const env = EnvHelper.getEnv();
		return env.NODE_ENV === 'production';
	}

	static getBaseUrl() {
		const appJson = getAppJson({});

		return appJson.expo.experiments.baseUrl;
	}

	static getEnv() {
		return process.env;
	}
}
