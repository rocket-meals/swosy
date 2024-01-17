export class PersistentSecureStore {
  // the key is just for easier access, the value is the actual key in the storage or syncState
  static refresh_token = "PersistentSecureStore.refresh_token";

}

type ValueOf<T> = T[keyof T];
export type PersistentSecureStoreValues = ValueOf<typeof PersistentSecureStore>;