import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export function useIsDevelop(): boolean {
  const [debug, setDebug] = useSyncState<boolean>(PersistentStore.develop)
  return !!debug
}