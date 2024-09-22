import {PersistentStore} from '@/helper/syncState/PersistentStore';
import {useSyncState} from "@/helper/syncState/SyncState";

export type DisplaySettings = {
	amountColumns: number | null | undefined,
}

function getDefaultDisplaySettings(): DisplaySettings {
	return {
		amountColumns: undefined
	}
}

export class DisplaySettingsValueRanges{
	static AMOUNT_COLUMNS_MIN = 1;
	static AMOUNT_COLUMNS_MAX = 10;
}

export function useSynchedDisplaySettings(): [ DisplaySettings, (value: (DisplaySettings | ((currentValue: DisplaySettings) => DisplaySettings))) => void]
{
	const [resource, setResource] = useSyncState<DisplaySettings>(PersistentStore.displaySettings);
	let usedResources = resource || getDefaultDisplaySettings()

	return [usedResources, setResource]
}