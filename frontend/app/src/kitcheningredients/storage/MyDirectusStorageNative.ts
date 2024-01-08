import SyncStorage from 'sync-storage';
import {StorageImplementationInterface} from "./StorageImplementationInterface";

export class MyDirectusStorageNative implements StorageImplementationInterface/** extends Storage */{

    constructor() {

    }

    async init(){
      const data = await SyncStorage.init();
    }

    getStorageImplementation(){
        return SyncStorage;
    }

    getAllKeys(){
        return SyncStorage.getAllKeys()
    }

    get(key: string) {
        return SyncStorage.get(key);
    }

    remove(key: string) {
        SyncStorage.remove(key);
    }

    set(key: string, value: string) {
        return SyncStorage.set(key, value)
    }

}
