import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {AppTranslations} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
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

export function useSynchedAppTranslationsDict(): [( Record<string, AppTranslations | null | undefined> | null | undefined), ((callback: (currentValue: (Record<string, AppTranslations | null | undefined> | null | undefined)) => Record<string, AppTranslations | null | undefined>, timestamp?: (number | undefined)) => void), (number | undefined), (nowInMs?: number) => Promise<void>]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<AppTranslations>(PersistentStore.app_translations);
	const lastUpdate = resourcesRaw?.lastUpdate;

	async function updateFromServer(nowInMs?: number) {
		const resourceList = await loadTranslationsFromServer()
		const resourceDict = CollectionHelper.convertListToDict(resourceList, 'id')
		setResourcesOnly((currentResouce => {
			return resourceDict
		}), nowInMs);
	}

	return [resourcesOnly, setResourcesOnly, lastUpdate, updateFromServer]
}