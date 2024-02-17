import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Apartments, Buildings, Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";

async function loadApartmentsFromServer(): Promise<Apartments[]> {
  let collectionHelper = new CollectionHelper<Apartments>("apartments");

  const fields = ['*'];

  let query = {
    limit: -1,
    fields: fields
  }

  return await collectionHelper.readItems(query);
}

export function useSynchedApartmentsDict(): [(Record<string, Apartments> | undefined), ((newValue: Record<string, Apartments>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Apartments>(PersistentStore.apartments);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoBuildings()
  }

  async function updateFromServer(nowInMs?: number) {
    let resourceAsList = await loadApartmentsFromServer();
    let resourceAsDict = CollectionHelper.convertListToDict(resourceAsList, "id")
    setResourcesOnly(resourceAsDict, nowInMs);
  }

  return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoBuildings(): Record<string, Apartments> {

  let demoResource: Apartments = {
    id: "",
    washingmachines: [],
  }

  return {
    [demoResource.id]: demoResource
  }
}