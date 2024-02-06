import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Canteens, CanteensBusinesshours} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/helper/sync_state_helper/custom_sync_states/SynchedResource";
import {useIsDemo} from "@/helper/sync_state_helper/custom_sync_states/SynchedDemo";

export function useSynchedCanteensDict(): [(Record<string, Canteens> | undefined), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoCanteens()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

function getDemoCanteens(): Record<string, Canteens> {

  let demoResource: Canteens = {
    building: undefined,
    date_created: new Date().toISOString(),
    date_updated: new Date().toISOString(),
    id: 123,
    label: "Demo Canteen",
    sort: undefined,
    status: "",
    user_created: undefined,
    user_updated: undefined,
    businesshours: [],
  }

  return {
    [demoResource.id]: demoResource
  }
}