import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {AppTranslations} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';

async function loadTranslationsFromServer(): Promise<AppTranslations[]> {
	const collectionHelper = new CollectionHelper<AppTranslations>('app_translations');

	const fields = ['*', 'translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedAppTranslationsDict(): [(Record<string, AppTranslations> | undefined), ((newValue: Record<string, AppTranslations>, timestamp?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<AppTranslations>(PersistentStore.app_translations);
	const lastUpdate = resourcesRaw?.lastUpdate;
	const usedResources = resourcesOnly;

	async function updateFromServer(nowInMs?: number) {
		const resourceList = await loadTranslationsFromServer()
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly(resourceDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}