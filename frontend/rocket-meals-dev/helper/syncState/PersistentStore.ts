export class PersistentStore {
	// the key is just for easier access, the value is the actual key in the storage or syncState
	static test = 'PersistentStore.test'

	static debug = 'PersistentStore.debug'
	static demo = 'PersistentStore.demo'
	static performance = 'PersistentStore.performance'
	static develop = 'PersistentStore.develop'

	static debugAutoLogin = 'PersistentStore.debugAutoLogin'

	static drawerConfig = 'PersistentStore.drawerConfig'

	static colorSchemeName = 'PersistentStore.colorSchemeName'
	static cachedUser = 'PersistentStore.user'

	static server_info = 'PersistentStore.server_info'

	static course_timetable_settings = 'PersistentStore.course_timetable_settings'
	static course_timetable = 'PersistentStore.course_timetable'

	static app_translations = 'PersistentStore.app_translations'
	static canteens = 'PersistentStore.canteens'
	static languages = 'PersistentStore.languages'
	static wikis = 'PersistentStore.wikis'
	static news = 'PersistentStore.news'
	static buildings = 'PersistentStore.buildings'
	static apartments = 'PersistentStore.apartments'
	static app_settings = 'PersistentStore.app_settings'
	static markings = 'PersistentStore.markings'
	static roles = 'PersistentStore.roles'
	static permissions = 'PersistentStore.permissions'
	static foods = 'PersistentStore.foods'
	static foodOffers = 'PersistentStore.foodOffers'

	static sortConfigFoodoffers = 'PersistentStore.sortConfigFoodoffers'

	static profile = 'PersistentStore.profile'

	static notificationPermission = 'PersistentStore.notificationPermission'

	static firstWeekday = 'PersistentStore.firstWeekday'
}

type ValueOf<T> = T[keyof T];
export type PersistentStoreValues = ValueOf<typeof PersistentStore>;