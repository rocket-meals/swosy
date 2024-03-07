import {
    Buildings,
    CollectionsDatesLastUpdate,
    DirectusPermissions,
    DirectusRoles,
    Markings
} from "@/helper/database/databaseTypes/types";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useIsDemo} from "@/states/SynchedDemo";
import {ServerAPI} from "@/helper/database/server/ServerAPI";

export function useSynchedPermissionsDict(): [(Record<string, DirectusPermissions> | undefined), ((newValue: Record<string, DirectusPermissions>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
    const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<DirectusPermissions>(PersistentStore.permissions);
    const demo = useIsDemo()
    let lastUpdate = resourcesRaw?.lastUpdate;
    let usedResources = resourcesOnly;
    if(demo) {
        //usedResources = getDemoBuildings()
    }

    async function updateFromServer(nowInMs?: number) {
        let resourceList = await ServerAPI.readRemotePermissions();
        let resourceDict = CollectionHelper.convertListToDict(resourceList, "id")
        setResourcesOnly(resourceDict, nowInMs);
    }

    return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}