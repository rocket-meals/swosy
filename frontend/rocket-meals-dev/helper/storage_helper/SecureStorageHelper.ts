
// Installation
// https://docs.expo.dev/versions/latest/sdk/securestore/#installation

// Usage
// https://docs.expo.dev/versions/latest/sdk/securestore/#usage

import * as SecureStore from 'expo-secure-store';
import  secureLocalStorage  from  "react-secure-storage";
import {PlatformHelper} from "@/helper/PlatformHelper";

export class SecureStorageHelper {

    /**
     * Sets a value in the storage. Null for value deletes the entry.
     * @param key
     * @param value
     */
    static async setItem(key: string, value: string | null): Promise<boolean> {
        //console.log("StorageHelper.setItem", key, value)
        if(value===null){
            return await SecureStorageHelper.removeItemRaw(key);
        } else {
            return await SecureStorageHelper.setItemRaw(key, value);
        }
    }

    private static async removeItemRaw(key: string): Promise<boolean> {
        try {
            if(PlatformHelper.isWeb()){
                // TODO: Web has no SecureStore, so we should encrypt the data and store it in localStorage or use the idea of the browser fingerprint (https://www.npmjs.com/package/react-secure-storage)
                await secureLocalStorage.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
            return true;
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    private static async setItemRaw(key: string, value: string): Promise<boolean> {
        try {
            if(PlatformHelper.isWeb()){
                await secureLocalStorage.setItem(key, value)
            } else {
                await SecureStore.setItemAsync(key, value);
            }
            return true;
        } catch (error) {
            console.error(error);
        }
        return false;
    }

    static async getItem(key: string): Promise<string | undefined> {
        try {
            let value: string | undefined | null = undefined
            if(PlatformHelper.isWeb()){
                let valueFromSecureLocalStorage = secureLocalStorage.getItem(key);
                if(typeof valueFromSecureLocalStorage === "string"){
                    value = valueFromSecureLocalStorage;
                }
            } else {
                value = await SecureStore.getItemAsync(key);
            }
            if (value !== null) {
                return value;
            }
            return undefined;
        } catch (error) {
            console.error(error);
        }
        return undefined;
    }

}