import {useSyncState} from "@/helper/sync_state_helper/SyncState";
import {PersistentStore} from "@/helper/sync_state_helper/PersistentStore";

export function useDemoRaw(): [boolean | null, (newValue: boolean) => void] {
  const [debug, setDebug] = useSyncState<boolean>(PersistentStore.demo)
  return [debug, setDebug]
}

export function useIsDemo(): boolean {
  const [debug, setDebug] = useDemoRaw()
  return !!debug
}