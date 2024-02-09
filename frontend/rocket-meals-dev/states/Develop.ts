import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";

export function useIsDevelop(): boolean {
  const [debug, setDebug] = useSyncState<boolean>(PersistentStore.develop)
  return !!debug
}