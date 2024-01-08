// @ts-nocheck
import EnviromentHelper from "./EnviromentHelper";
import {Auth, AuthMode, Directus, MemoryStorage, ServerInfo, UserItem} from "@directus/sdk";
import axios, {AxiosInstance} from "axios";
import TransportWrapper from "./server/TransportWrapper";
import AuthTransportWrapper from "./server/AuthTransportWrapper";
import {ConfigHolder} from "./ConfigHolder";
import UserHelper from "./utils/UserHelper";

export default class ServerAPI{

  static dev = false;

	static directus = null;
	static tempStore = {
		serverInfo: undefined
	};

	static getAxiosInstance(): AxiosInstance{
		return axios.create();
	}

	/**
	 * We want a public client to get dont interfere with broken permissions and other stuff
	 */
	static getPublicClient(){
		let storage = new MemoryStorage();
		return ServerAPI.getDirectus(storage);
	}

	static getDirectus(storage, customErrorHandleCallback=null){
		let url = ConfigHolder.instance.getBackendUrl()
		let transport = ServerAPI.getTransport(url, storage);
		let auth = ServerAPI.getAuth(url, storage, customErrorHandleCallback)
    if(!!ConfigHolder.CustomDirectusTypes){
      return new Directus<ConfigHolder.CustomDirectusTypes>(url, {transport: transport, storage: storage, auth: auth});
    } else {
      return new Directus(url, {transport: transport, storage: storage, auth: auth});
    }
	}

	static areCredentialsSaved(){
		return ConfigHolder.instance.storage.has_credentials_saved();
	}

	static async handleLogoutError(){
		let storage = ConfigHolder.instance.storage;
		storage.deleteAll();
	}

	static async handleLogout(error=null){
		console.log("handleLogout")
		try{
			let directus = ServerAPI.getDirectus(ConfigHolder.instance.storage);
      console.log("call await directus.auth.logout();")
			let response = await directus.auth.logout();
      await ServerAPI.handleLogoutError(); // we better make sure to reset variables in storage
      console.log("logout: ", response);
		} catch (err){
			console.log("Error at: handleLogout");
			console.log(err);
			await ServerAPI.handleLogoutError(); // we better make sure to reset variables in storage
		}
    await ServerAPI.handleLogoutError(); // we better make sure to reset variables in storage
		console.log("navigate to login")
    await ConfigHolder.instance.setUser(null);
		await ConfigHolder.instance.setRedirectToLogin();
    if(!!ConfigHolder.plugin && !!ConfigHolder.plugin.onLogout){
      await ConfigHolder.plugin.onLogout(error);
    }
		await ConfigHolder.instance.initialize();
	}

	static getClient(): Directus<any>{
		if(ServerAPI.directus){
			return ServerAPI.directus;
		}
		let errorHandler = ServerAPI.handleLogoutError; //use default error handler
		if(ConfigHolder.instance.storage.is_anonymous()){
			errorHandler = () => {}; //as guest we ignore errors
		}
		const directus = ServerAPI.getDirectus(ConfigHolder.instance.storage, errorHandler);
		// api.interceptors.response.use(onResponse, onError);

		ServerAPI.directus = directus;
		return directus;
	}

	private static getPublicRole(){
	  return {"id":UserHelper.USER_ROLE_ANONYMOUS,"name":UserHelper.USER_ROLE_ANONYMOUS,"icon":"public","description":null,"ip_access":null,"enforce_tfa":false,"admin_access":false,"app_access":true,"users":[]}
  }

  static async delayInDev(ms: number) {
	  if(ServerAPI.dev){
      return new Promise( resolve => setTimeout(resolve, ms) );
    }
  }

	static async loadRole(role_id){
			try{
				let directus = ServerAPI.getClient();
				if(!role_id || role_id===UserHelper.USER_ROLE_ANONYMOUS){
				  return ServerAPI.getPublicRole()
        }

				await ServerAPI.delayInDev(1000);
				let role = await directus.roles.readOne(role_id);
				return role;
			} catch (err){
				console.log("Error at get Server Info: ",err);
			}
	}

  static async loadPermissions(role_id){
      try{
        let directus = ServerAPI.getClient();

        let query_role_id = role_id;
        if(role_id===UserHelper.USER_ROLE_ANONYMOUS){
          query_role_id = null;
        }

        let filter = {filter: {role: {
              _eq: query_role_id
            }}};

        await ServerAPI.delayInDev(1000);
        if(!directus.permissions.readByQuery){ //TODO only added for legacy support
          // @ts-ignore
          let permissions = await directus.permissions.readMany(filter);
          return permissions?.data;
        } else {
          let permissions = await directus.permissions.readByQuery(filter);
          return permissions?.data;
        }

      } catch (err){
        console.log("Error at get Server Info: ",err);
      }
  }

  static async loginWithAccessDirectusAccessToken(directus_access_token){
    return await ServerAPI.loginWithRefreshToken(directus_access_token);
  }

	static async loginWithRefreshToken(refresh_token_to_use){
    let storage = ConfigHolder.instance.storage;
    await ServerAPI.delayInDev(1000);
		let data = await ServerAPI.refreshWithRefreshToken(refresh_token_to_use);
		let access_token = data?.access_token;
		let refresh_token = data?.refresh_token;
		let expires = data?.expires || ""+0;
		//https://github.com/directus/directus/blob/main/api/src/services/authentication.ts
		//let expiresIn = new Date(Date.now() + ms(expires as string));
    console.log("access_token: ", access_token)
    console.log("refresh_token: ", refresh_token)
    console.log("expires: ", expires)
		await storage.set_auth_expires(expires);
		await storage.set_refresh_token(refresh_token);
		await storage.set_access_token(access_token);
		return data;
	}

	private static getAuth(url, storage, customErrorHandleCallback=null){
		let transport = ServerAPI.getAuthTransport(url, storage, customErrorHandleCallback);
		const modeForAuth: AuthMode = "json";
		//const modeForAuth: AuthMode = "cookie";
		let auth = new Auth({
			transport: transport,
			storage: storage,
			autoRefresh: true,
			mode: modeForAuth
		});
		return auth;
	}

	static getAuthorizationHeader(storage = ConfigHolder.instance.storage){
		const token = storage.auth_token;
		const bearer = token
			? token.startsWith(`Bearer `)
				? String(storage.auth_token)
				: `Bearer ${storage.auth_token}`
			: '';
		return {
			Authorization: bearer
		}
	}

	private static getTransport(url, storage){
		let myTransport = new TransportWrapper({
			url: url,
			beforeRequest: (config) => {
				const token = storage.auth_token;
				const bearer = token
					? token.startsWith(`Bearer `)
						? String(storage.auth_token)
						: `Bearer ${storage.auth_token}`
					: '';

				return {
					...config,
					headers: {
						Authorization: bearer,
						...config.headers,
					},
				};
			}
		});
		return myTransport;
	}

	private static getAuthTransport(url, storage, customErrorHandleCallback=null){
		let myTransport = new AuthTransportWrapper({
			url: url,
			beforeRequest: (config) => {
				const token = storage.auth_token;
				const bearer = token
					? token.startsWith(`Bearer `)
						? String(storage.auth_token)
						: `Bearer ${storage.auth_token}`
					: '';

				return {
					...config,
					headers: {
						Authorization: bearer,
						...config.headers,
					},
				};
			}
		});
		myTransport.customErrorHandleCallback = customErrorHandleCallback;
		return myTransport;
	}

	static getAPIUrl(){
		let directus = ServerAPI.getPublicClient();
		// @ts-ignore
		return directus.transport.url;
	}

	static async getServerInfo(): Promise<ServerInfo>{
	  console.log("getServerInfo");
		try{
			let directus = ServerAPI.getPublicClient();
			//TODO we could add caching here
      await ServerAPI.delayInDev(1000);
			let serverInfo = await directus.server.info();
			ServerAPI.tempStore.serverInfo = serverInfo;
			return serverInfo;
		} catch (err){
			console.log("Err at ServerAPI.getServerInfo()");
			console.log(err);
			if(!!err && !!err.parent && !!err.parent.message === "Network Error"){
			  console.log("Offline");
      }
		}
		return null;
	}

	static getAssetImageURL(imageID: string){
		return EnviromentHelper.getAssetURL(imageID);
	}

	static async getAuthProviders(): Promise<any>{
		let getProvidersURL = ServerAPI.getAPIUrl()+"/auth";
		try{
			let api = ServerAPI.getAxiosInstance();
      await ServerAPI.delayInDev(1000);
			let answer = await api.get(getProvidersURL);
			let providers = answer?.data?.data;
			return providers
		} catch (err){
			console.log(err)
		}
		return null;
	}

	static async getMe(directus=null): Promise<UserItem>{
		if(!directus){
			directus = ServerAPI.getClient();
		}
		return directus.users.me.read();
	}

	static async isRefreshTokenSaved(){
		let token = ConfigHolder.instance.storage.auth_refresh_token;
		return !!token;
	}

	private static async refreshWithRefreshToken(refresh_token: string){
		let url = ConfigHolder.instance.getBackendUrl()+'/auth/refresh';
		const api = ServerAPI.getAxiosInstance();
		try{
      await ServerAPI.delayInDev(1000);
			let response = await api.post(url, {"refresh_token": ""+refresh_token, mode: "json"}, {});
			return response?.data?.data;
		} catch (err){
			console.log("refreshWithDirectusToken error");
			console.log(err);
			console.log(err.toString())
      console.log(JSON.stringify(err));
			console.log(Object.keys(err));
			// "config", "request", "response", "isAxiosError", "toJSON"
      console.log(err?.message);
      console.log(err?.response);
      console.log(err?.response?.data);
      console.log(err?.requests);
      console.log(err.toJSON());
		}
		return null;
	}
}
