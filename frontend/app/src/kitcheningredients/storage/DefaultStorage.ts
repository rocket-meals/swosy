import {RequiredStorageKeys} from "./RequiredStorageKeys";
import {MyDirectusStorageInterface} from "./MyDirectusStorageInterface";
import {StorageImplementationInterface} from "./StorageImplementationInterface";
import {
  Cookie,
  CookieDetails,
  CookieHelper,
  CookieStorageTypeEnum,
  CookieGroupEnum
} from "../screens/legalRequirements/CookieHelper";

export class DefaultStorage implements MyDirectusStorageInterface/** extends Storage */{
    implementation: StorageImplementationInterface;

    async init(){
      await this.implementation.init();
    }

    constructor(implementation: StorageImplementationInterface) {
        this.implementation = implementation;
    }

    defaultSaveStorageContext(storageKey, state, payload){
        try{
            this.set(storageKey, payload);
        } catch (err){
            console.log(err);
            return false;
        }
        return true;
    }

    async initContextStores(SynchedState){
        let keys = SynchedState.getRequiredStorageKeys();
        this.initSynchedStorageKeys(SynchedState, keys, true);
        let pluginStorageKeys = SynchedState.getPluginStorageKeys()
        this.initSynchedStorageKeys(SynchedState, pluginStorageKeys, false);
    }

    initSynchedStorageKeys(SynchedState, keys, override){
        for(let i=0; i<keys.length; i++){
            let storageKey = keys[i];
            let cookie = this.getCookie(storageKey);
            let value = cookie?.value;
            CookieHelper.CookieDictNameToDetails[storageKey] = storageKey;
            SynchedState.registerSynchedStates(storageKey, value, this.defaultSaveStorageContext.bind(this), null, override);
        }
    }

    getAllKeys(): string[] {
      if(!!this.implementation){
        return this.implementation.getAllKeys();
      }
      throw new Error("Method not implemented.");
    }

    getStorageImplementation(): StorageImplementationInterface{
        return this.implementation;
    }

    is_anonymous(){
        return !!this.get(RequiredStorageKeys.IS_ANONYMOUS);
    }

    set_is_anonymous(isAnonymous){
        this.setValueOrDeleteIfNull(RequiredStorageKeys.IS_ANONYMOUS, isAnonymous)
    }

    setValueOrDeleteIfNull(key, value){
        if(!value){
            this.delete(key)
        } else {
            this.set(key, value);
        }
    }

    clear_credentials(){
      console.log("clear_credentials");
      this.set_user(null);
      this.set_refresh_token(null);
      this.set_access_token(null);
      this.set_is_anonymous(false);
    }

    has_credentials_saved(){
        if(!!this.get_auth_refresh_token()){
            return true;
        }
        return !!this.get_auth_access_token();
    }

    set_user(user){
      if(!!user){
        user = JSON.stringify(user);
      }
      this.setValueOrDeleteIfNull(RequiredStorageKeys.CACHED_USER, user)
    }
    /**
     * Refresh Token
     */
    set_refresh_token(token){
        this.setValueOrDeleteIfNull(RequiredStorageKeys.KEY_AUTH_REFRESH_TOKEN, token)
    }
    set auth_refresh_token(token) { //DO not change
        this.set_refresh_token(token);
    }
    get_auth_refresh_token(){
        return this.get(RequiredStorageKeys.KEY_AUTH_REFRESH_TOKEN);
    }
    get auth_refresh_token() { //DO not change
        return this.get_auth_refresh_token();
    }

    /**
     * Auth Token
     */
    set_access_token(token){
        this.setValueOrDeleteIfNull(RequiredStorageKeys.KEY_AUTH_ACCESS_TOKEN, token)
    }
    set auth_token(token) { //DO not change
        this.set_access_token(token);
    }
    get_auth_access_token(){
        return this.get(RequiredStorageKeys.KEY_AUTH_ACCESS_TOKEN);
    }
    get auth_token() { //DO not change
        return this.get_auth_access_token();
    }

    /**
     * Expires
     */
    set_auth_expires(time: number){
        let expiresIn = null;
        if(!!time){
            let timeNumber = parseInt(""+time);
            expiresIn = new Date(Date.now() + timeNumber);
            expiresIn = expiresIn.toISOString()
        }
        this.setValueOrDeleteIfNull(RequiredStorageKeys.KEY_AUTH_EXPIRES_DATE, expiresIn+"")
        this.setValueOrDeleteIfNull(RequiredStorageKeys.KEY_AUTH_EXPIRES, time+"")
    }
    set auth_expires(time){ //DO not change
        this.set_auth_expires(time);
    }

    get_auth_expires_date(){
      return this.get(RequiredStorageKeys.KEY_AUTH_EXPIRES_DATE);
    }

    get_auth_expires(){
        return Number(this.get(RequiredStorageKeys.KEY_AUTH_EXPIRES));
    }
    get auth_expires() { //DO not change
        return this.get_auth_expires();
    }

    public getCookie(cookieName: string): Cookie {
      let cookieAsString = this.getStorageImplementation().get(cookieName);
      return this.getCookieFromStorageString(cookieAsString);
    }
    public storageEntryExists(cookieName: string): boolean {
      let cookie = this.getCookie(cookieName);
      return !!cookie;
    }

    public getCookieFromStorageString(cookieAsString: string): Cookie {
      if(!!cookieAsString){
        return JSON.parse(cookieAsString);
      }
      return null;
    }

    public setCookie(cookieName: string, cookie: Cookie) {
      this.getStorageImplementation().set(cookieName, this.getStorageStringFromCookie(cookie));
    }

    public getStorageStringFromCookie(cookie: Cookie): string {
      return JSON.stringify(cookie);
    }

    public getNewCookieFromKeyValue(key: string, value: string): Cookie {
      return {
        name: key,
        value: value,
        date_created: new Date(),
      }
    }

    private deleteCookie(cookieName: string) {
      this.getStorageImplementation().remove(cookieName);
    }

    /**
     * Getter and Setter and Delete
     */
    get(key: string) { //DO not change
        let cookie = this.getCookie(key);
        return cookie?.value;

//        return this.getStorageImplementation().get(key);
        //return '';
    }

    set(key: string, value: string) { //DO not change
        let cookie: Cookie = this.getNewCookieFromKeyValue(key, value);
        this.setCookie(key, cookie);

//        this.getStorageImplementation().set(key, value);
        return value;
    }

    delete(key: string) { //DO not change
//        this.getStorageImplementation().remove(key);
        this.deleteCookie(key);
        return null;
    }

    deleteAll(){
        let allKeys = this.getAllKeys();
        for(let i=0; i<allKeys.length; i++){
            this.delete(allKeys[i]);
        }
    }
}
