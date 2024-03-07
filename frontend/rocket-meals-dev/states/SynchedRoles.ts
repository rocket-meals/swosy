import {Buildings, CollectionsDatesLastUpdate, DirectusRoles, Markings} from "@/helper/database/databaseTypes/types";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {useIsDemo} from "@/states/SynchedDemo";
import {ServerAPI} from "@/helper/database/server/ServerAPI";

export function useSynchedRolesDict(): [(Record<string, DirectusRoles> | undefined), ((newValue: Record<string, DirectusRoles>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
    const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<DirectusRoles>(PersistentStore.roles);
    const demo = useIsDemo()
    let lastUpdate = resourcesRaw?.lastUpdate;
    let usedResources = resourcesOnly;
    if(demo) {
        //usedResources = getDemoBuildings()
    }

    async function updateFromServer(nowInMs?: number) {
        let resourceList = await ServerAPI.readRemoteRoles();
        let resourceDict = CollectionHelper.convertListToDict(resourceList, "id")
        setResourcesOnly(resourceDict, nowInMs);
    }

    return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}