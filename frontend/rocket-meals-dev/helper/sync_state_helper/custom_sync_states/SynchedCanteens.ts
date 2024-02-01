import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Canteens, CanteensBusinesshours} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/helper/sync_state_helper/custom_sync_states/SynchedResource";
import {useIsDemo} from "@/helper/sync_state_helper/custom_sync_states/SynchedDemo";

export function useSynchedCanteens(): [(Record<string, Canteens> | undefined), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoResource()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

function getDemoResource(): Record<string, Canteens> {

  const emptyBusinesshours = undefined as any as string & CanteensBusinesshours[];
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
    businesshours: emptyBusinesshours,
  }

  return {
    [demoResource.id]: demoResource
  }
}