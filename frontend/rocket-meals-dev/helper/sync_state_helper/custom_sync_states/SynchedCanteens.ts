import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Canteens} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/helper/sync_state_helper/custom_sync_states/SynchedResource";

export function useSynchedCanteens(): [(Record<string, Canteens> | undefined), ((newValue: Record<string, Canteens>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Canteens>(PersistentStore.canteens);
  let lastUpdate = resourcesRaw?.lastUpdate;
  return [resourcesOnly, setResourcesOnly, lastUpdate]
}