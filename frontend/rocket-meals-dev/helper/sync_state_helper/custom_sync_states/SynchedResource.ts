import {useSyncState} from "@/helper/sync_state_helper/SyncState";

export type NewValueRawTypeKey = string | number |symbol
export type NewValueRawType<Key extends NewValueRawTypeKey, Scheme> = {
  data: Record<Key, Scheme>,
  lastUpdate: number
}

export function useSynchedResourceRaw<Resource>(storeKey: string): [(Record<string, Resource> | undefined), ((newValue: Record<string, Resource>, timestampe?: number) => void), (NewValueRawType<string, Resource> | null), ((value: (NewValueRawType<string, Resource> | null)) => void)] {
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