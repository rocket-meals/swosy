import {SecureStorageHelper} from "@/helper/storage_helper/SecureStorageHelper";

// TODO: Rename to SecureStorageHelper and Rename the other SecureStorageHelper to something with platform Specific or so.
export abstract class SecureStorageHelperAbstractClass {

    /**
     * Initializes the storage if necessary.
     */
    abstract init(): Promise<void>;

    static async init(): Promise<void> {
        await SecureStorageHelperAbstractClass.getInstance().init();
    }

    static instance: SecureStorageHelperAbstractClass | null = null;

    static getInstance(): SecureStorageHelperAbstractClass {
        if(!SecureStorageHelperAbstractClass.instance){
            SecureStorageHelperAbstractClass.instance = new SecureStorageHelper();
        }
        return SecureStorageHelperAbstractClass.instance;
    }

    /**
     * Sets a value in the storage. Null for value deletes the entry.
     * @param key
     * @param value
     */
    static async setItem(key: string, value: string | null): Promise<boolean> {
        //console.log("StorageHelper.setItem", key, value)
        if(value===null){
            return await SecureStorageHelperAbstractClass.getInstance().removeItemRaw(key);
        } else {
            return await SecureStorageHelperAbstractClass.getInstance().setItemRaw(key, value);
        }
    }

    /**
     * Gets a value from the storage.
     * @param key
     */
    static async getItem(key: string): Promise<string | undefined> {
        try {
            let value: string | undefined | null = undefined
            let valueFromSecureLocalStorage = await SecureStorageHelperAbstractClass.getInstance().getItemRaw(key);
            if(typeof valueFromSecureLocalStorage === "string"){
                value = valueFromSecureLocalStorage;
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

    abstract getItemRaw(key: string): Promise<string | undefined | null>

    abstract removeItemRaw(key: string): Promise<boolean>;

    abstract setItemRaw(key: string, value: string): Promise<boolean>;
}