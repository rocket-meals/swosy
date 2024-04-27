import {Markings} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";

export const TABLE_NAME_MARKINGS = 'markings';
const cacheHelperDeepFields_markings: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_MARKINGS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["markings_translations"],
	}
])
export async function loadMarkingsFromServer(): Promise<Markings[]> {
	const collectionHelper = new CollectionHelper<Markings>(TABLE_NAME_MARKINGS);
	const query = cacheHelperDeepFields_markings.getQuery()
	return await collectionHelper.readItems(query);
}

function getDemoMarking(index: number): Markings {
	let id = 'demo-marking'+index

	let names = [
		"Nuss", "Fleisch", "Erdnüsse", "Fisch", "Soja", "Milch", "Ei", "Weizen", "Schalenfrüchte", "Sellerie", "Senf", "Sesam", "Schwefeldioxid und Sulfite", "Lupinen", "Weichtiere", "Krebstiere", "Glutenhaltiges Getreide", "Gerste", "Hafer", "Dinkel", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut", "Grünkern", "Emmer", "Einkorn", "Buchweizen", "Reis", "Mais", "Hirse", "Quinoa", "Amarant", "Teff", "Triticale", "Gerste", "Roggen", "Weizen", "Kamut"
	]
	let name: string = names[index%names.length]

	let languages = getDemoLanguagesDict();

	let translations = []
	for (let languageKey in languages) {
		let language = languages[languageKey]
		translations.push({
			name: language.code+" - "+name,
			id: id,
			markings_id: id,
			languages_code: language.code
		})
	}

	const marking: Markings = {
		id: id,
		translations: translations
	}

	return marking
}

export function getDemoMarkings(): Record<string, Markings> {
	const resourceDict: Record<string, Markings> = {}

	// extreme = 500;
	let amount_realistic = 50;
	for (let i = 0; i < amount_realistic; i++) {
		const demoResource = getDemoMarking(i)
		resourceDict[demoResource.id] = demoResource
	}

	return resourceDict
}

export function useSynchedMarkingsDict(): [( Record<string, Markings | null | undefined> | null | undefined), (callback: (currentValue: (Record<string, Markings | null | undefined> | null | undefined)) => Record<string, Markings | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Markings>(PersistentStore.markings);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoMarkings()
	}

	async function updateFromServer(sync_cache_composed_key_local?: string) {
		const markingsList = await loadMarkingsFromServer();
		const markingsDict = CollectionHelper.convertListToDict(markingsList, 'id')
		setResourcesOnly((currentValue) => {
			return markingsDict
		}, sync_cache_composed_key_local);
	}

	const cacheHelperObj: MyCacheHelperType = {
		sync_cache_composed_key_local: sync_cache_composed_key_local,
		updateFromServer: updateFromServer,
		dependencies: cacheHelperDeepFields_markings.getDependencies()
	}

	return [usedResources, setResourcesOnly, cacheHelperObj]
}