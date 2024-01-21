import {useServerInfo} from "@/helper/sync_state_helper/custom_sync_states/SyncStateServerInfo";
import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export function useDebugRaw(): [boolean | null, (newValue: boolean) => void] {
  const [debug, setDebug] = useSyncState<boolean>(PersistentStore.debug)
  return [debug, setDebug]
}

export function useIsDebug(): boolean {
  const [debug, setDebug] = useDebugRaw()
  return !!debug
}