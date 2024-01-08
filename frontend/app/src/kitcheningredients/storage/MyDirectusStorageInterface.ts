import {Cookie} from "../screens/legalRequirements/CookieHelper";

export interface MyDirectusStorageInterface{
    get(key: string);
    storageEntryExists(key: string): boolean;
    set(key: string, value: string);
    getAllKeys(): string[];
    delete(key: string);
    init();
    is_anonymous();
    set_is_anonymous(isAnonymous);
    initContextStores(SynchedState: any);
    get_auth_expires_date(): string;
    get_auth_refresh_token(): string;
    get_auth_access_token(): string;
    has_credentials_saved(): boolean;
    getCookieFromStorageString(storageString: string): Cookie;
    getNewCookieFromKeyValue(key: string, value: string): Cookie
    getStorageStringFromCookie(cookie: Cookie): string
}
