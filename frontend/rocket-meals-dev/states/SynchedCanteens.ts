import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {Canteens, CanteensBusinesshours, Markings} from "@/helper/database/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {getDemoUtilizationGroup} from "@/states/SynchedUtiliztations";

async function loadCanteensFromServer(): Promise<Canteens[]> {
  let collectionHelper = new CollectionHelper<Canteens>("canteens");

  const fields = ['*', "utilization_group.*"];

  let query = {
    limit: -1,
    fields: fields
  }

  return await collectionHelper.readItems(query);
}

export function useSynchedCanteensDict(): [(Record<string, Canteens> | undefined), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined), ((nowInMs?: number) => Promise<void>)
] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoCanteens()
  }

  async function updateFromServer(nowInMs?: number) {
    let canteensList = await loadCanteensFromServer()
    let canteensDict = CollectionHelper.convertListToDict(canteensList, "id")
    setResourcesOnly(canteensDict, nowInMs);
  }

  return [usedResources, setResourcesOnly, lastUpdate, updateFromServer]
}

function getDemoCanteens(): Record<string, Canteens> {

  let resources: Record<string, Canteens> = {};

  for (let i=0; i<7; i++){
    let demoResource: Canteens = {
      building: undefined,
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString(),
      id: "demoCanteen"+(i),
      alias: "Demo Canteen "+(i),
      sort: undefined,
      status: "",
      user_created: undefined,
      user_updated: undefined,
      businesshours: [],
      utilization_group: getDemoUtilizationGroup()
    }
    resources[demoResource.id] = demoResource;
  }

  return resources
}