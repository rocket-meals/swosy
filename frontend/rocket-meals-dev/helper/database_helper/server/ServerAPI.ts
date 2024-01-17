import {
    authentication,
    createDirectus,
    DirectusClient,
    graphql, login, readMe, refresh,
    rest,
    RestClient,
    serverInfo,
    ServerInfoOutput
} from "@directus/sdk";
import {CustomDirectusTypes} from "@/helper/database_helper/directusTypes/types";
import {UrlHelper} from "@/helper/UrlHelper";


interface ExtendedProperties {
    project: {
        project_descriptor: string | null;
        project_logo: string | null;
        project_color: string | null;
        public_foreground: string | null;
        public_background: string | null;
        public_note: string | null;
        custom_css: string | null;
    };
}

type ExtendedServerInfoOutput = ServerInfoOutput & ExtendedProperties;

export interface ServerInfo{
    // status can be "loading", "online" or "offline"
    status: "loading" | "online" | "offline" | "error" | "cached";
    info: ExtendedServerInfoOutput | null;
    errorMessage?: any;
}

export class ServerAPI {

    static getServerUrl(){
        return 'https://rocket-meals.de/demo/api';
    }

    static getParamNameForDirectusAccessToken(){
        return "directus_access_token";
    }

    static getPublicClient():  DirectusClient<CustomDirectusTypes> & RestClient<any>{
        const client = createDirectus<CustomDirectusTypes>(ServerAPI.getServerUrl()).with(rest());
        return client;
    }

    static getClient():  DirectusClient<CustomDirectusTypes> & RestClient<any>{
        const client = createDirectus(ServerAPI.getServerUrl())
            .with(authentication('cookie', { credentials: 'include' }))
            .with(graphql({ credentials: 'include' }))
            .with(rest({ credentials: 'include' }));
        return client;
    }

    static async login_with_access_token(directus_access_token: string){
        console.log("login_with_access_token");
        console.log("directus_access_token", directus_access_token);
        const client = ServerAPI.getClient();
        let refresh_token: string = directus_access_token;
        const result = await client.request(refresh('json', refresh_token));
        console.log(result);
    }

    static async login_with_email_and_password(email: string, password: string){
        console.log("login_with_email_and_password");
        console.log("email", email);
        console.log("password", password)
        const client = ServerAPI.getClient();
        const result = await client.request(login(email, password))
        console.log(result);
        return result;
    }

    static async downloadServerInfo(): Promise<ServerInfo>{
        let result: ServerInfo = {
            status: "loading",
            info: null,
            errorMessage: null
        }

        try{
            let directus = ServerAPI.getPublicClient();
             let remote_info = await directus.request(serverInfo());
             result.status = "online";
             result.info = remote_info as ExtendedServerInfoOutput;
        } catch (err){
            console.log("Err at ServerAPI.getServerInfo()");
            console.log(err);
            result.errorMessage = "error";
            if(!!err && err.toString() === "Network Error"){ // TODO: check if this is the correct error message
                console.log("Offline");
                result.errorMessage = err.toString();
            }
            result.status = "offline";
        }
        return result;
    }

    static getUrlToProviderLogin(provider: string){
        provider= provider.toLowerCase();
        console.log("getUrlToProvider: "+provider);
        let redirectURL = UrlHelper.getURLToLogin();
        console.log("RedirectURL: "+redirectURL)
        let redirect_with_access_token = "?redirect="+ServerAPI.getServerUrl()+"/redirect-with-token?redirect="+redirectURL+"?"+ServerAPI.getParamNameForDirectusAccessToken()+"=";
        let totalURL = ServerAPI.getServerUrl()+"/auth/login/"+provider+redirect_with_access_token;
        return totalURL
    }

    static getAssetImageURL(imageID: string | null | undefined){
        return ServerAPI.getAssetURL(imageID);
    }

    static getAssetURL(file_id: string | null | undefined): any{
        if(!file_id){
            return null;
        }
        return ServerAPI.getServerUrl()+"/assets/"+file_id
    }

    static async getMe(): Promise<any>{
        let directus = ServerAPI.getClient();
        let me = await directus.request(readMe())
        return me;
    }

}