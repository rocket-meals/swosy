import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';

export function useDemoRaw(): [boolean | null, (newValue: boolean) => void] {
	const [debug, setDebug] = useSyncState<boolean>(PersistentStore.demo)
	return [debug, setDebug]
}

export function useIsDemo(): boolean {
	const [debug, setDebug] = useDemoRaw()
	return !!debug
}