import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {News} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {DateHelper} from '@/helper/date/DateHelper';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_NEWS = 'news';
const cacheHelperDeepFields_news: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_NEWS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["news_translations"],
	},
])
async function loadNewsFromServer(): Promise<News[]> {
	const collectionHelper = new CollectionHelper<News>(TABLE_NAME_NEWS);
	const query = cacheHelperDeepFields_news.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedNewsDict(): [( Record<string, News | null | undefined> | null | undefined), ( (callback: (currentValue: (Record<string, News | null | undefined> | null | undefined)) => Record<string, News | null | undefined>, sync_cache_composed_key_local?: string) => void), cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<News>(PersistentStore.news);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoNews()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const resourceAsList = await loadNewsFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_news.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}

function getSingleDemoNews(index: number): News {
	const news_id = 'demo-news'+index

	const amountNewsTranslations = 1

	const titles = ['Demo Neueröffnung unseres Kantinengebäudes!', 'Immer frisch und lecker: Wir haben unsere Speisekarte erweitert!', 'Hier kommt ein langer Titel, der sich über mehrere Zeilen erstreckt und so weiter und so fort, bis er schließlich endet.']
	const contents = [
		'Wir freuen uns, die Eröffnung unseres brandneuen Kantinengebäudes ankündigen zu können! Ab dem 15. März 2024 heißen wir Sie herzlich willkommen, die Vielfalt unserer kulinarischen Angebote zu entdecken. Von klassischen Gerichten bis hin zu internationalen Spezialitäten – für jeden Geschmack ist etwas dabei.\n' +
      '\n' +
      '## Was gibt\'s Neues?\n' +
      '\n' +
      '- **Moderne Essbereiche**: Genießen Sie Ihre Mahlzeiten in einem angenehmen und modern gestalteten Ambiente.\n' +
      '- **Erweitertes Menüangebot**: Entdecken Sie unsere neuen, saisonalen Menüs, zubereitet mit frischen, lokalen Zutaten.\n' +
      '- **Digitale Bestellung**: Bestellen und bezahlen Sie Ihre Mahlzeiten bequem über unsere App – sparen Sie Zeit und vermeiden Sie Warteschlangen.\n',

		'Hier bei Rocket Meals legen wir großen Wert auf Vielfalt und Qualität. Deshalb haben wir unsere Speisekarte um einige neue, leckere Gerichte erweitert.'
	]

	let languages = getDemoLanguagesDict();

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			translation_settings: '',
			be_source_for_translations: false,
			title: language.code+" - "+titles[index%titles.length],
			content: language.code+" - "+contents[index%contents.length],
			id: amountNewsTranslations*index,
			news_id: news_id,
			languages_code: language.code
		})
	}

	const image_remote_urls = [
		'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fG5ld3N8ZW58MHx8MHx8fDA%3D',
		'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmV3c3xlbnwwfHwwfHx8MA%3D%3D',
		'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YnVzaW5lc3MlMjBuZXdzfGVufDB8fDB8fHwy',
		'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGJ1c2luZXNzJTIwbmV3c3xlbnwwfHwwfHx8Mg%3D%3D',
		'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGJ1c2luZXNzJTIwbmV3c3xlbnwwfHwwfHx8Mg%3D%3D'
	]

	const demoNewsUrl = 'https://news.google.com';

	return {
		alias: 'Demo News',
		date_created: DateHelper.addDays(new Date(), -index).toISOString(),
		date: DateHelper.addDays(new Date(), -index).toISOString(),
		date_updated: new Date().toISOString(),
		external_identifier: undefined,
		id: news_id,
		image: undefined,
		image_remote_url: image_remote_urls[index%image_remote_urls.length],
		image_thumb_hash: undefined,
		sort: undefined,
		status: '',
		translations: translations,
		url: demoNewsUrl,
		user_created: undefined,
		user_updated: undefined

	}
}

function getDemoNews(): Record<string, News> {
	const resourceDict: Record<string, News> = {}

	for (let i = 0; i < 100; i++) {
		const demoResource = getSingleDemoNews(i)
		resourceDict[demoResource.id] = demoResource
	}

	return resourceDict
}