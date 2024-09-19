import {Markings} from '@/helper/database/databaseTypes/types';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useIsDemo} from '@/states/SynchedDemo';
import {getDemoLanguagesDict} from "@/states/SynchedLanguages";
import {MyCacheHelperDeepFields, MyCacheHelperType} from "@/helper/cache/MyCacheHelper";
import {IconNames} from "@/constants/IconNames";
import {MARKDOWN_EXAMPLE} from "@/components/markdown/ThemedMarkdown";
import {SortType} from "@/states/SynchedSortType";
import {useProfileLanguageCode} from "@/states/SynchedProfile";
import {getMarkingName} from "@/components/food/MarkingListItem";

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
			description: MARKDOWN_EXAMPLE,
			id: id,
			markings_id: id,
			languages_code: language.code
		})
	}

	const image_remote_url = index % 2 === 0 ? "https://www.studentenwerk-osnabrueck.de/fileadmin/_processed_/9/f/csm_Mensa_Global_rund_weiss_a79f6b48ba.png" : null;

	const marking: Markings = {
		id: id,
		excluded_by_markings: [],
		icon: IconNames.change_image_icon,
		image_remote_url: image_remote_url,
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


export function useSortedMarkings(marking_ids?: string[]) {
	const [markingsDict, setMarkingsDict] = useSynchedMarkingsDict();
	const [languageCode, setLanguageCode] = useProfileLanguageCode()
	const sortType = SortType.intelligent;

	const markings: Markings[] = []
	if (markingsDict) {
		let usedMarkingIds = marking_ids || Object.keys(markingsDict)
		for (let i = 0; i < usedMarkingIds.length; i++) {
			const key = usedMarkingIds[i];
			const marking = markingsDict[key];
			if (marking) {
				markings.push(marking)
			}
		}
	}
	return sortMarkings(markings, markingsDict, sortType, languageCode);
}

export function sortMarkings(resources: Markings[], resourcesDict: Record<string, Markings | null | undefined> | null | undefined, sortType: SortType, languageCode: string): Markings[] {
	let copiedResources = [...resources];
	if(sortType === SortType.intelligent){
		// sort first by name, then by eating habits, then by favorite
		let sortOrders = [SortType.sortFromServer];
		for(const sortOrder of sortOrders){
			copiedResources = sortMarkings(copiedResources, resourcesDict, sortOrder, languageCode);
		}
	} else if(sortType === SortType.alphabetical){
		copiedResources = sortMarkingsByNames(copiedResources, resourcesDict, languageCode);
	} else if(sortType === SortType.sortFromServer){
		copiedResources = sortMarkingsBySortFromServer(copiedResources, resourcesDict, languageCode);
	}
	return copiedResources;
}

function sortMarkingsBySortFromServer(resources: Markings[], resourcesDict: Record<string, Markings | null | undefined> | null | undefined, languageCode: string): Markings[] {
	resources.sort((a, b) => {
		let sortA = a.sort;
		let sortB = b.sort;
		if(sortA && sortB){
			return sortA - sortB;
		} else if (sortA){
			return -1;
		} else if (sortB){
			return 1;
		}
		return 0;
	});
	return resources;
}

function sortMarkingsByNames(resources: Markings[], resourcesDict: Record<string, Markings | null | undefined> | null | undefined, languageCode: string): Markings[] {
	resources.sort((a, b) => {
		const withoutExternalIdentifier = true;
		let nameA = getMarkingName(a, languageCode, withoutExternalIdentifier);
		let nameB = getMarkingName(b, languageCode, withoutExternalIdentifier);
		if(nameA && nameB){
			return nameA.localeCompare(nameB);
		} else if (nameA){
			return -1;
		} else if (nameB){
			return 1;
		}
		return 0;
	});
	return resources;
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