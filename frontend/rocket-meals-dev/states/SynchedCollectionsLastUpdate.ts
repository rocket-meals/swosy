import {Buildings, CollectionsDatesLastUpdate, Markings} from "@/helper/database/databaseTypes/types";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useIsDemo} from "@/states/SynchedDemo";

async function loadCollectionsDatesLastUpdateFromServer(): Promise<CollectionsDatesLastUpdate[]> {
    let collectionHelper = new CollectionHelper<CollectionsDatesLastUpdate>("collections_dates_last_update");

    let query = {
        limit: -1,
        fields: ["*"],
    }

    return await collectionHelper.readItems(query);
}

export function useSynchedCollectionsDatesLastUpdateDict(): [(Record<string, CollectionsDatesLastUpdate> | undefined), ((newValue: Record<string, CollectionsDatesLastUpdate>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
    const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<CollectionsDatesLastUpdate>(PersistentStore.markings);
    const demo = useIsDemo()
    let lastUpdate = resourcesRaw?.lastUpdate;
    let usedResources = resourcesOnly;
    if(demo) {
        //usedResources = getDemoBuildings()
    }

    async function updateFromServer(nowInMs?: number) {
        let resourceList = await loadCollectionsDatesLastUpdateFromServer();
        let resourceDict = CollectionHelper.convertListToDict(resourceList, "id")
        setResourcesOnly(resourceDict, nowInMs);
    }

    return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}