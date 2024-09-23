import {useBreakPointValue} from '@/helper/device/DeviceHelper';
import {DisplaySettingsValueRanges, useSynchedDisplaySettings} from "@/states/SynchedDisplaySettings";

export function useMyGridListDefaultColumns(): number {
	const [displaySettings, setDisplaySettings] = useSynchedDisplaySettings();
	const amountOfColumns = displaySettings.amountColumns;
	if(!!amountOfColumns && amountOfColumns >= DisplaySettingsValueRanges.AMOUNT_COLUMNS_MIN && amountOfColumns<= DisplaySettingsValueRanges.AMOUNT_COLUMNS_MAX){
		return amountOfColumns;
	}

	return useBreakPointValue({sm: 2, md: 3, lg: 4, xl: 5});
}