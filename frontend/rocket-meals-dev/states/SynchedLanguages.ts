import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Languages} from '@/helper/database/databaseTypes/types';
import {useSynchedResourceRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';

export async function loadLanguageRemoteDict() {
	const collectionHelper = new CollectionHelper<Languages>('languages')
	return await collectionHelper.readItems();
}

export function useSynchedLanguagesDict(): [(Record<string, Languages> | undefined), ((newValue: Record<string, Languages>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Languages>(PersistentStore.languages);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoResources()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadLanguageRemoteDict();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'code')
		setResourcesOnly(resourceAsDict, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

export function useSynchedLanguageByCode(code: string): Languages | undefined {
	const [resources, setResources, lastUpdate] = useSynchedLanguagesDict()
	return resources?.[code]
}

function getDemoResources(): Record<string, Languages> {
	const demoResource: Languages = {
		code: 'de-DE',
		name: 'Deutsch',
		direction: 'ltr',
	}

	return {
		[demoResource.code]: demoResource
	}
}