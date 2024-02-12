import {
    authentication,
    AuthenticationClient,
    AuthenticationConfig,
    AuthenticationData,
    AuthenticationStorage,
    createDirectus,
    DirectusClient,
    graphql,
    GraphqlClient,
    readMe,
    ReadProviderOutput,
    readProviders,
    rest,
    RestClient,
    serverInfo,
    ServerInfoOutput
} from "@directus/sdk";
import {CustomDirectusTypes, DirectusFiles} from "@/helper/database/databaseTypes/types";
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

export type AuthProvider = {
    name: string;
    icon?: string | null;
}

export class ServerAPI {

    static client: DirectusClient<any> & AuthenticationClient<any> & GraphqlClient<any> & RestClient<any> | null = null;

    static getServerUrl(){
        return 'https://rocket-meals.de/demo/api';
    }

    static ParamNameForAccessToken = "directus_refresh_token";

    static getParamNameForDirectusAccessToken(){
        return ServerAPI.ParamNameForAccessToken
    }

    static getDirectusAccessTokenFromParams(params: any): string | null | undefined{
        return params?.[ServerAPI.getParamNameForDirectusAccessToken()];
    }

    static getPublicClient():  DirectusClient<CustomDirectusTypes> & RestClient<any>{
        const client = createDirectus<CustomDirectusTypes>(ServerAPI.getServerUrl()).with(rest());
        return client;
    }

    static createAuthentificationStorage(
        get: () => Promise<AuthenticationData | null> | AuthenticationData | null,
        set: (value: AuthenticationData | null) => Promise<void> | void
    ){
        //console.log("createAuthentificationStorage called")
        if(!ServerAPI.simpleAuthentificationStorage){
            //console.log("createAuthentificationStorage first time created")
            ServerAPI.simpleAuthentificationStorage = {
                get: async () => {
                    let result = await get();
                    //console.log("simpleAuthentificationStorage get", result)
                    return result;
                },
                set: async (value: AuthenticationData | null) => {
                    //console.log("simpleAuthentificationStorage set", value)
                    await set(value);
                    //console.log("simpleAuthentificationStorage set done")
                }
            }
        }
    }

    static async getAuthProviders(): Promise<AuthProvider[]>{
        const client = ServerAPI.getPublicClient();
        let providers: AuthProvider[] = [];
        const result: ReadProviderOutput[] = await client.request(readProviders());
        for(let provider of result){
            providers.push({
                name: provider.name,
                icon: provider.icon
            })
        }
        return providers;
    }

    /**
     * interface AuthenticationStorage {
     *     get: () => Promise<AuthenticationData | null> | AuthenticationData | null;
     *     set: (value: AuthenticationData | null) => Promise<void> | void;
     * }
     */
    static simpleAuthentificationStorage: AuthenticationStorage | null = null;

    // TODO create a initClient function that passes the storage to use which uses our useSyncState hook to save the data.

    static getClient(): DirectusClient<any> & AuthenticationClient<any> & GraphqlClient<any> & RestClient<any>{
        if(!ServerAPI.client){
            let authentificationStorage = ServerAPI.simpleAuthentificationStorage;
            if(!authentificationStorage){
                throw new Error("ServerAPI.simpleAuthentificationStorage is not set. Please call ServerAPI.createAuthentificationStorage() before calling ServerAPI.getClient()");
            } else {
                let authconfig:  Partial<AuthenticationConfig> = {
                    autoRefresh: true,
                    //msRefreshBeforeExpires: number;
                    credentials: "include",
                    storage: authentificationStorage
                }

                const client = createDirectus(ServerAPI.getServerUrl())
                    .with(authentication('json', authconfig))
                    .with(graphql())
                    .with(rest());
                ServerAPI.client = client;
            }
        }
        return ServerAPI.client;
    }

    static async authenticate_with_access_token(directus_access_token: string | undefined | null){
        try{
            //console.log("ServerAPI.authenticate_with_access_token", directus_access_token);
            const client = ServerAPI.getClient();
            let refresh_token: string | undefined = undefined;
            if(directus_access_token){
                refresh_token = directus_access_token
                //console.log("authenticate_with_access_token set refresh_token to directus_access_token")
                await ServerAPI.simpleAuthentificationStorage?.set({
                    access_token: null,
                    refresh_token: directus_access_token,
                    expires: null,
                    expires_at: null,
                });
                //console.log("authenticate_with_access_token set refresh_token to directus_access_token done")
            }
            let result = await client.refresh();
            //console.log("authenticate_with_access_token: result: ", result)

            return result;
        } catch (err){
            console.log("ERROR: authenticate_with_access_token")
            console.log(err);
        }
    }

    static async authenticate_with_email_and_password(email: string, password: string){
        try{
            //console.log("login_with_email_and_password");
            //console.log("email", email);
            //console.log("password", password)
            const client = ServerAPI.getClient();
            let result = await client.login(email, password);

            await ServerAPI.simpleAuthentificationStorage?.set({
                access_token: result.access_token,
                refresh_token: result.refresh_token,
                expires: result.expires,
                expires_at: result.expires_at,
            });

            //console.log("login_with_email_and_password result", result);
            result = await client.refresh();

            return result;
        } catch (err){
            console.log("ERROR: login_with_email_and_password")
            console.log(err);
        }
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

    static getUrlToProviderLogin(provider: AuthProvider){
        let providerName = provider.name.toLowerCase();
        //console.log("getUrlToProvider: "+provider);
        let redirectURL = UrlHelper.getURLToLogin();
        //console.log("RedirectURL: "+redirectURL)
        let redirect_with_access_token = "?redirect="+ServerAPI.getServerUrl()+"/redirect-with-token?redirect="+redirectURL+"?"+ServerAPI.getParamNameForDirectusAccessToken()+"=";
        let totalURL = ServerAPI.getServerUrl()+"/auth/login/"+providerName+redirect_with_access_token;
        return totalURL
    }

    /**
     * TODO: Check if this problem still occurs when https://github.com/rocket-meals/rocket-meals/issues/11 is fixed
     * Currently we could send a user a mail with a link. This link would redirect the user to an application that the attacker controls. the attacker could then grab the token and use it to login to the app.
     */
    static getUrlToLoginExploit(){
        let redirectURL = UrlHelper.getURLToLogin();
        //console.log("RedirectURL: "+redirectURL)
        let totalURL = ServerAPI.getServerUrl()+"/redirect-with-token?redirect="+redirectURL+"?"+ServerAPI.getParamNameForDirectusAccessToken()+"=";
        return totalURL
    }

    static getAssetImageURL(imageID: string | null | undefined | DirectusFiles) {
        let usedImageId;

        // Assuming DirectusFiles is a type and we need to check if imageID is of that type
        if (typeof imageID === 'object' && imageID !== null && 'id' in imageID) {
            usedImageId = imageID.id;
        } else {
            usedImageId = imageID;
        }

        return ServerAPI.getAssetURL(usedImageId);
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