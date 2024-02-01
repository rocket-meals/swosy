import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";
import {Foods} from "@/helper/database_helper/databaseTypes/types";
import {useSynchedResourceRaw} from "@/helper/sync_state_helper/custom_sync_states/SynchedResource";

export function useSynchedFoods(): [(Record<string, Foods> | undefined), ((newValue: Record<string, Foods>, timestampe?: number) => void), (number | undefined)] {
  const [resourcesOnly, setResourcesOnly, resourcesRaw, setResourcesRaw] = useSynchedResourceRaw<Foods>(PersistentStore.foods);
  let lastUpdate = resourcesRaw?.lastUpdate;
  return [resourcesOnly, setResourcesOnly, lastUpdate]
}