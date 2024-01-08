import {Transport, TransportMethods, TransportOptions, TransportResponse} from "@directus/sdk";
import ServerAPI from "../ServerAPI";
import {ConfigHolder} from "../ConfigHolder";
import AwaitLock from "await-lock";

let refreshLock = new AwaitLock(); //we want to synchronize the refresh, cause maybe two refreshes collide

export default class TransportWrapper extends Transport{
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
			console.log("TransportWrapper error");
			console.log("path: ",path);
			console.log("status: ",status);
			console.log("code: ",code);
			console.log("error: ",error);
			console.log(JSON.stringify(error, null, 2))

			//Happens when the refresh or access token is too old
			if(this.isTokenExpired(error, status, code)){
			  console.log("- Token is expired")

        let shouldRetryRequest = await this.shouldRetryRequest();
			  console.log("- shouldRetryRequest: "+shouldRetryRequest);

				if(shouldRetryRequest){
					console.log("Okay lets try to resend the request")
					try{
						let answer = await super.request(method, path, data, options);
						console.log("retry of request successfull");
						return answer;
					} catch (err){
						console.log("Resent request after refresh still unsuccessfull, rejecting");
						console.log(err);
						return Promise.reject(error);
					}
				} else {
				  console.log("Refresh not successfull or was not tried, handle logout");
					await ServerAPI.handleLogout(error); // after releasing lock!
					return Promise.reject(error);
				}
			}

			console.log("-------")
			return Promise.reject(error);
		}
	}

	async shouldRetryRequest(){
	  console.log("shouldRetryRequest?");
    let retryRequest = false;

    await refreshLock.acquireAsync(); //okay lets lock this, so not that we dont register multiple times
    console.log("refreshLock acquired");
    //TODO check if lock is free, otherwise wait until its free, and then skip the refresh and simple resend the super.request
    try{
      //Okay we have the lock, so only one refresh can happen at the same time
      let wasAlreadyRefreshed = await this.wasAlreadyRefreshed();
      if(wasAlreadyRefreshed){
        console.log("Token was already refreshed, so we dont need to refresh it again")
        retryRequest = true;
      } else {
        console.log("Token was not refreshed yet, so we need to refresh it")
        let refreshAnswer = await this.handleRefresh();
        console.log("refreshAnswer: ");
        console.log(JSON.stringify(refreshAnswer, null, 2));
        retryRequest = this.isRefreshSuccessfull(refreshAnswer);
        console.log("retryRequest after refresh: "+retryRequest);
      }
    } catch (err){
      console.log("Error at refresh")
      console.log(err);
    } finally {
      console.log("Release lock");
      this.releaseLock();
    }
    return retryRequest;
  }

	async wasAlreadyRefreshed(){
	  let expiresDateISOString = await ConfigHolder.instance.storage.get_auth_expires_date();
	  if(!expiresDateISOString){
	    return false;
    }
    let now: any = new Date();
	  let expiresDate: any = new Date(expiresDateISOString);
    let secondsTillExpiration = expiresDate-now || 0;
    console.log("secondsTillExpiration: "+secondsTillExpiration);
    if(secondsTillExpiration>0){
      return true;
    } else {
      return false;
    }
  }

	async handleRefresh(){
    try{
      console.log("Token is expired, lets try to refresh it")
      let directus = ServerAPI.getDirectus(ConfigHolder.instance.storage, ServerAPI.handleLogoutError);
      //console.log("get_auth_refresh_token: "+ConfigHolder.instance.storage.get_auth_refresh_token());
      //console.log("get_auth_access_token: "+ConfigHolder.instance.storage.get_auth_access_token());
      // ServerAPI.loginWithAccessDirectusAccessToken
      let refresh_token = await ConfigHolder.instance.storage.get_auth_refresh_token();
      let access_token = await ConfigHolder.instance.storage.get_auth_access_token();

      console.log("using refresh_token: "+refresh_token);
      //let refreshAnswer = await ServerAPI.loginWithRefreshToken(refresh_token);
      let refreshAnswer = await directus.auth.refresh();
      console.log("refreshAnswer: ");
      console.log(JSON.stringify(refreshAnswer, null, 2));

      return refreshAnswer;
    } catch (err){
      console.log("Error at refresh")
      console.log(err);
    }
  }

	releaseLock(){
	  try{
      refreshLock.release(); //before handleLogout
    } catch (err){
	    console.log("releaseLock err");
	    console.log(err);
    }
  }

	isRefreshSuccessfull(answer){
		return !!answer && !!answer["access_token"] && !!answer["refresh_token"] && !!answer["expires"]
	}

	isTokenExpired(error, status, code){
	  console.log("isTokenExpired?");
    console.log("error.toString(): "+error.toString())

		if(error.toString().includes("Token expired")){
			return true;
		}
    if(error.toString().toLowerCase().includes("Token expired".toLowerCase())){
      return true;
    }
		if(status===403 && code==="INVALID_TOKEN"){
			return true;
		}
    if(status===401 && code==="INVALID_TOKEN"){
      return true;
    }
		return false;
	}

}
