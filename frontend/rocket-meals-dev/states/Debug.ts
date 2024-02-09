import {useServerInfo} from "@/states/SyncStateServerInfo";
import {useSyncState} from "@/helper/syncState/SyncState";
import {PersistentStore} from "@/helper/syncState/PersistentStore";

export function useDebugRaw(): [boolean | null, (newValue: boolean) => void] {
  const [debug, setDebug] = useSyncState<boolean>(PersistentStore.debug)
  return [debug, setDebug]
}

export function useIsDebug(): boolean {
  const [debug, setDebug] = useDebugRaw()
  return !!debug
}