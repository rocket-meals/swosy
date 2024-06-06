import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';

export function usePerformanceRaw(): [boolean | null, (newValue: boolean) => void] {
	const [resource, setResource] = useSyncState<boolean>(PersistentStore.performance)
	return [resource, setResource]
}

export function useIsPerformanceMode(): boolean {
	const [resource, setResource] = usePerformanceRaw()
	return !!resource
}