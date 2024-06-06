import * as appJson from '@/components/../app.json';

export class EnvHelper {
	static isProduction() {
		const env = EnvHelper.getEnv();
		return env.NODE_ENV === 'production';
	}

	static getBaseUrl() {
		return appJson.expo.experiments.baseUrl;
	}

	static getEnv() {
		return process.env;
	}
}
