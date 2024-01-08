import {StorageImplementationInterface} from "./StorageImplementationInterface";

export class MyDirectusStorageWeb implements StorageImplementationInterface/** extends Storage */{
    private webstorage: any;

    // webstorage: Storage
    constructor() {
        // @ts-ignore
        this.webstorage = localStorage;
    }

    get(key: string) {
        return this.webstorage.getItem(key)
    }

    remove(key: string) {
        return this.webstorage.removeItem(key)
    }

    set(key: string, value: string) {
        return this.webstorage.setItem(key, value)
    }

  getAllKeys(): string[] {
    return Object.keys(this.webstorage);
  }

  init(): Promise<void> {
    return Promise.resolve(undefined);
  }


}
