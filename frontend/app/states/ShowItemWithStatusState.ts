import {useSyncState} from '@/helper/syncState/SyncState';
import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {useIsDeveloperModeActive} from "@/states/Develop";
import {useIsDebug} from "@/states/Debug";
import {useSearchParamKioskMode} from "@/helper/searchParams/SearchParams";




export function useShowItemsWithEveryStatusStateRaw(): [boolean | null | undefined, (value: (((currentValue: boolean) => boolean) | boolean)) => void] {
	const [valueRaw, setValueRaw] = useSyncState<boolean, boolean>(NonPersistentStore.showItemsWithEveryStatus)
	return [valueRaw, setValueRaw]
}

export function useShowItemsWithEveryStatusState(): [boolean | null | undefined, (value: boolean) => void] {
	const [valueRaw, setValueRaw] = useShowItemsWithEveryStatusStateRaw()

	const isDevelopment = useIsDeveloperModeActive()
	const isDebug = useIsDebug()
	const isKiosk = useSearchParamKioskMode()

	let showItemsWithEveryStatus = valueRaw

	if(isDevelopment || isDebug || isKiosk){
		showItemsWithEveryStatus = true // always show all items in development mode, debug mode or kiosk mode
	}

	const setShowItemsWithEveryStatus = (value: boolean) => setValueRaw(value)
	return [showItemsWithEveryStatus, setShowItemsWithEveryStatus]
}