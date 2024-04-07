import {PersistentStore} from '@/helper/syncState/PersistentStore';
import { Wikis} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';

export enum Custom_Wiki_Ids {
    about_us = 'about-us',
    license = 'license',
    privacy_policy = 'privacy-policy',
    cookieComponentConsent = 'cookieComponentConsent',
    cookieComponentAbout = 'cookieComponentAbout',
    terms_of_service = 'terms-of-service',
    accessibility = 'accessibility',
}

async function loadWikisFromServer(): Promise<Wikis[]> {
	const collectionHelper = new CollectionHelper<Wikis>('wikis');

	const fields = ['*','translations.*'];

	const query = {
		limit: -1,
		fields: fields
	}

	return await collectionHelper.readItems(query);
}

export function useSynchedWikisDict(): [ Record<string, Wikis | null | undefined> | null | undefined, ((callback: (currentValue: Record<string, Wikis | null | undefined> | null | undefined) => Record<string, Wikis | null | undefined>, timestamp?: number | undefined) => void), number | undefined, ((nowInMs?: number | undefined) => Promise<void>)]
{
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Wikis>(PersistentStore.wikis);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoWikis()
	}

	async function updateFromServer(nowInMs?: number) {
		const resourceAsList = await loadWikisFromServer();
		const resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, 'id')
		setResourcesOnly((currentValue) => {
			return resourceAsDict
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

export function useSynchedWikisDictByCustomId(): Record<string, Wikis> {
	const [wikis, setWikis, lastUpdate] = useSynchedWikisDict();
	const dictCustomIdToWiki: Record<string, Wikis> = {}
	if (wikis) {
		const wikiKeys = Object.keys(wikis)
		for (let i = 0; i < wikiKeys.length; i++) {
			const wiki = wikis[wikiKeys[i]]
			if (wiki.custom_id) {
				dictCustomIdToWiki[wiki.custom_id] = wiki
			}
		}
	}
	return dictCustomIdToWiki;
}

export function useSynchedWikiByCustomId(customId: string): Wikis | undefined {
	const dictCustomIdToWiki = useSynchedWikisDictByCustomId()
	return dictCustomIdToWiki[customId]
}

export function useSynchedWikiById(id: string): Wikis | undefined {
	const [wikis, setWikis, lastUpdate] = useSynchedWikisDict();
	if (wikis) {
		return wikis[id]
	}
	return undefined
}

function getDemoWiki(index: number){
	const demoResource: Wikis = {
		roles_required: [],
		children: [],
		translations: [],
		date_created: new Date().toISOString(),
		date_updated: new Date().toISOString(),
		id: (1000+index)+'',
		drawer_position: (index*2),
		sort: undefined,
		status: '',
		user_created: undefined,
		user_updated: undefined
	}
	return demoResource;
}

function getDemoWikis(): Record<string, Wikis> {
	const demoResources: Record<string, Wikis> = {}
	for(let i = 0; i < 10; i++){
		const demoResource = getDemoWiki(i)
		demoResources[demoResource.id] = demoResource
	}
	return demoResources
}