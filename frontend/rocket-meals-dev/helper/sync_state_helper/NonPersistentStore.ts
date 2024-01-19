export class NonPersistentStore {
  // the key is just for easier access, the value is the actual key in the storage or syncState
  static test = "NonPersistentStore.test"

  static loggedIn = "NonPersistentStore.loggedIn"

}

type ValueOf<T> = T[keyof T];
export type NonPersistentStoreValues = ValueOf<typeof NonPersistentStore>;
