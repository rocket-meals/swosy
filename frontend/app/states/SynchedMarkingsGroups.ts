import {Markings, MarkingsGroups} from '@/helper/database/databaseTypes/types';
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
import {getMarkingName, getMarkingShortCode} from "@/components/food/MarkingListItem";

export const TABLE_NAME_MARKINGS_GROUPS = 'markings_groups';
const cacheHelperDeepFields_markings: MyCacheHelperDeepFields = new MyCacheHelperDeepFields([
	{
		field: '*',
		limit: -1,
		dependency_collections_or_enum: [TABLE_NAME_MARKINGS_GROUPS],
	},
	{
		field: 'translations.*',
		limit: -1,
		dependency_collections_or_enum: ["markings_groups_translations"],
	}
])
export async function loadMarkingsFromServer(): Promise<MarkingsGroups[]> {
	const collectionHelper = new CollectionHelper<MarkingsGroups>(TABLE_NAME_MARKINGS_GROUPS);
	const query = cacheHelperDeepFields_markings.getQuery()
	return await collectionHelper.readItems(query);
}

export function useSynchedMarkingsGroupsDict(): [( Record<string, MarkingsGroups | null | undefined> | null | undefined), (callback: (currentValue: (Record<string, MarkingsGroups | null | undefined> | null | undefined)) => Record<string, MarkingsGroups | null | undefined>, sync_cache_composed_key_local?: string) => void, cacheHelperObj: MyCacheHelperType]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<MarkingsGroups>(PersistentStore.markings_groups);
	const demo = useIsDemo()
	const sync_cache_composed_key_local = resourcesRaw?.sync_cache_composed_key_local;
	let usedResources = resourcesOnly;

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