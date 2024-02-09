import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Buildings} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/states/SynchedResource";
import {useIsDemo} from "@/states/SynchedDemo";

export function useSynchedBuildingsDict(): [(Record<string, Buildings> | undefined), ((newValue: Record<string, Buildings>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Buildings>(PersistentStore.buildings);
  const demo = useIsDemo()
  let lastUpdate = resourcesRaw?.lastUpdate;
  let usedResources = resourcesOnly;
  if(demo) {
    usedResources = getDemoBuildings()
  }
  return [usedResources, setResourcesOnly, lastUpdate]
}

function getDemoBuildings(): Record<string, Buildings> {

  let demoResource: Buildings = {
    name: "Demo Building",
    apartments: [],
    canteens: [],
    id: 123,
    status: "",
    translations: []
  }

  return {
    [demoResource.id]: demoResource
  }
}