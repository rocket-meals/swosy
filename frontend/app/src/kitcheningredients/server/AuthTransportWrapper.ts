import {Transport, TransportMethods, TransportOptions, TransportResponse} from "@directus/sdk";
import ServerAPI from "../ServerAPI";

export default class AuthTransportWrapper extends Transport{
	customErrorHandleCallback = null;

	protected async request<T = any, R = any>(
		method: TransportMethods,
		path: string,
		data?: Record<string, any>,
		options?: Omit<TransportOptions, 'url'>
	): Promise<TransportResponse<T, R>> {
		try {
			return await super.request(method, path, data, options);
		} catch (error: any) {
			if (!error || error instanceof Error === false) {
				throw error;
			}

			const status = error.response?.status;
			const code = error.errors?.[0]?.extensions?.code;

			console.log("");
			console.log("AuthTransportWrapper error");
			console.log("path: ",path);
			console.log("status: ",status);
			console.log("code: ",code);

			if (
				status === 401 &&
				code === 'INVALID_CREDENTIALS'
				/**
				&&
				error.request.responseURL.includes('refresh') === false &&
				error.request.responseURL.includes('login') === false &&
				error.request.responseURL.includes('tfa') === false
				 */
			) {
			  console.log("Invalid Credentials");
			  console.log(error);
				await ServerAPI.handleLogout(error);
				return Promise.reject(error);
			}

			console.log("-------")
			//console.log("No idea what error caused neither what to do");
			return Promise.reject(error);
		}
	}


}
