export class PersistentStore {
  // the key is just for easier access, the value is the actual key in the storage or syncState
  static test = "PersistentStore.test"

  static debug = "PersistentStore.debug"
  static demo = "PersistentStore.demo"
  static develop = "PersistentStore.develop"

  static debugAutoLogin = "PersistentStore.debugAutoLogin"

  static drawerConfig = "PersistentStore.drawerConfig"

  static colorSchemeName = "PersistentStore.colorSchemeName"
  static cachedUser = "PersistentStore.user"

  static server_info = "PersistentStore.server_info"

  static canteens = "PersistentStore.canteens"
  static languages = "PersistentStore.languages"
  static wikis = "PersistentStore.wikis"
  static buildings = "PersistentStore.buildings"
  static apartments = "PersistentStore.apartments"
  static app_settings = "PersistentStore.app_settings"
  static markings = "PersistentStore.markings"
  static roles = "PersistentStore.roles"
  static permissions = "PersistentStore.permissions"
  static foods = "PersistentStore.foods"
  static foodOffers = "PersistentStore.foodOffers"

  static profile = "PersistentStore.profile"

  static firstWeekday = "PersistentStore.firstWeekday"

}

type ValueOf<T> = T[keyof T];
export type PersistentStoreValues = ValueOf<typeof PersistentStore>;