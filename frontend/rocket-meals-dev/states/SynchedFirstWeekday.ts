import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {useSyncState} from "@/helper/syncState/SyncState";
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";

export function useSynchedFirstWeekday(): [Weekday, ((newValue: Weekday | null) => Promise<(boolean | void)>), (Weekday | null)] {
    const [resourcesRaw, setResourcesRaw] = useSyncState<Weekday>(PersistentStore.firstWeekday);
    const systemFirstWeekday = getSystemFirstWeekday();
    const usedFirstWeekday = resourcesRaw || systemFirstWeekday;

    return [usedFirstWeekday, setResourcesRaw, resourcesRaw]
}

function getSystemFirstWeekday(): Weekday {
    const locale = useProfileLocaleForJsDate();
    // we cannot use "moment" because: moment.localeData(locale).firstDayOfWeek(); crashes on Android in Expo-Go
    let firstWeekdayNumber: number = 1 // default to Monday
    let firstWeekday: Weekday = DateHelper.getWeekdayByIndex(firstWeekdayNumber);
    return firstWeekday;
}