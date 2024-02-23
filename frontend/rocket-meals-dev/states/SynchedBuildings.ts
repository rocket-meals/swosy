import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Buildings, Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {index} from "@zxing/text-encoding/es2015/encoding/indexes";

async function loadBuildingsFromServer(): Promise<Buildings[]> {
  let collectionHelper = new CollectionHelper<Buildings>("buildings");

  const fields = ['*',"translations.*"];

  let query = {
    limit: -1,
    fields: fields
  }

  return await collectionHelper.readItems(query);
}

export function useSynchedBuildingsDict(): [(Record<string, Buildings> | undefined), ((newValue: Record<string, Buildings>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Buildings>(PersistentStore.buildings);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoBuildings()
  }

  async function updateFromServer(nowInMs?: number) {
    let resourceAsList = await loadBuildingsFromServer();
    let resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, "id")
    setResourcesOnly(resourceAsDict, nowInMs);
  }

  return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoResource(index: number): Buildings {
  return {
    canteens: [],
    alias: "Demo Building "+index,
    apartments: [],
    id: index+"",
    status: "",
    translations: []
  }
}

export function getDemoBuildings(): Record<string, Buildings> {

  let demoResources: Record<string, Buildings> = {}
    for(let i = 0; i < 12; i++) {
        let demoResource = getDemoResource(i)
        demoResources[demoResource.id] = demoResource
    }

  return demoResources
}