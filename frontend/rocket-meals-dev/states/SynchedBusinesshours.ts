import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {Businesshours, Canteens} from '@/helper/database/databaseTypes/types';
import {useSynchedResourcesDictRaw} from '@/states/SynchedResource';
import {useIsDemo} from '@/states/SynchedDemo';
import {CollectionHelper} from '@/helper/database/server/CollectionHelper';
import {getDemoUtilizationGroup} from '@/states/SynchedUtiliztations';

async function loadBusinesshoursFromServer(): Promise<Businesshours[]> {
	const collectionHelper = new CollectionHelper<Businesshours>('businesshours');

	const fields = ['*'];

	const query = {
		limit: -1,
		fields: fields
	}

	console.log("await collectionHelper.readItems(query);")
	return await collectionHelper.readItems(query);
}

export function useSynchedBusinesshoursDict(): [(Record<string, Businesshours | null | undefined> | null | undefined), (callback: (currentValue: Record<string, Businesshours | null | undefined> | null | undefined) => Record<string, Businesshours | null | undefined>, timestamp?: number) => void, number | undefined, (nowInMs?: number) => Promise<void>] {
	const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourcesDictRaw<Businesshours>(PersistentStore.businesshours);
	const demo = useIsDemo()
	const lastUpdate = resourcesRaw?.lastUpdate;
	let usedResources = resourcesOnly;
	if (demo) {
		usedResources = getDemoBusinesshoursDict()
	}

	async function updateFromServer(nowInMs?: number) {
		console.log("await loadBusinesshoursFromServer()");
		const businesshoursList = await loadBusinesshoursFromServer()
		const businesshoursDict = CollectionHelper.convertListToDict(businesshoursList, 'id')
		setResourcesOnly((currentValue) => {
			return businesshoursDict;
		}, nowInMs);
	}

	return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

export function getDemoBusinesshoursDict(): Record<string, Businesshours> {
	const resources: Record<string, Businesshours> = {
		"1": {
			valid_days: "",
			valid_range: "",
			"id": "1",
			time_start: "08:00:00",
			time_end: "15:00:00",
			monday: true,
		},
		"1.1": {
			valid_days: "",
			valid_range: "",
			"id": "1.1",
			time_start: "16:00:00",
			time_end: "20:00:00",
			monday: true,
		},
		"2": {
			valid_days: "",
			valid_range: "",
			"id": "2",
			date_valid_from: new Date().toISOString(), // from today until next week
			date_valid_till: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
			time_start: "08:00:00",
			time_end: "16:00:00",
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: true,
		},
		"3": {
			valid_days: "",
			valid_range: "",
			"id": "3",
			time_start: "08:00:00",
			time_end: "16:00:00",
			wednesday: true,
			thursday: true,
			friday: true,
			saturday: true,
		},
	};

	return resources
}