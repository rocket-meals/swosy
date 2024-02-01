export class PersistentStore {
  // the key is just for easier access, the value is the actual key in the storage or syncState
  static test = "PersistentStore.test"

  static debug = "PersistentStore.debug"
  static debugAutoLogin = "PersistentStore.debugAutoLogin"

  static drawerConfig = "PersistentStore.drawerConfig"

  static colorSchemeName = "PersistentStore.colorSchemeName"
  static cachedUser = "PersistentStore.user"

  static server_info = "PersistentStore.server_info"

  static canteens = "PersistentStore.canteens"

}

type ValueOf<T> = T[keyof T];
export type PersistentStoreValues = ValueOf<typeof PersistentStore>;