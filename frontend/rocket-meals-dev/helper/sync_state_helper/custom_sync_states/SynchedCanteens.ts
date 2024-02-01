import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Canteens} from "@/helper/database_helper/databaseTypes/types";

export type NewValueRawTypeKey = string | number |symbol
export type NewValueRawType<Key extends NewValueRawTypeKey, Scheme> = {
  data: Record<Key, Scheme>,
  lastUpdate: number
}

function useSynchedResourceRaw<Resource>(storeKey: string): [(Record<string, Resource> | undefined | string | number | null | Object | boolean), ((newValue: Record<string, Resource>, timestampe?: number) => void), (NewValueRawType<string, Resource> | null), ((value: (NewValueRawType<string, Resource> | null)) => void)] {
  const [resourcesRaw, setResourcesRaw] = useSyncState<NewValueRawType<string, Resource>>(storeKey)
  const setResourcesOnly = (newValue: Record<number, Resource>, timestampe?: number) => {
    let timeInMs = timestampe || new Date().getTime()
    setResourcesRaw({
      data: newValue,
      lastUpdate: timeInMs
    })
  }
  const resourcesOnly = resourcesRaw?.data
  return [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw]
}

export function useSynchedCanteens(): [(Record<string, Canteens> | undefined | string | number | null | Object | boolean), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
  let lastUpdate = resourcesRaw?.lastUpdate;
  return [resourcesOnly, setResourcesOnly, lastUpdate]
}