import {PersistentStore} from "@/helper/syncState/PersistentStore";
import {DateHelper, Weekday} from "@/helper/date/DateHelper";
import {useSyncState} from "@/helper/syncState/SyncState";
import moment from 'moment';
import {useProfileLocaleForJsDate} from "@/states/SynchedProfile";

export function useSynchedFirstWeekday(): [Weekday, ((newValue: Weekday | null) => Promise<(boolean | void)>), (Weekday | null)] {
    const [resourcesRaw, setResourcesRaw] = useSyncState<Weekday>(PersistentStore.firstWeekday);
    const systemFirstWeekday = getSystemFirstWeekday();
    const usedFirstWeekday = resourcesRaw || systemFirstWeekday;

    return [usedFirstWeekday, setResourcesRaw, resourcesRaw]
}

function getSystemFirstWeekday(): Weekday {
    const locale = useProfileLocaleForJsDate();
    let firstWeekdayNumber: number = moment.localeData(locale).firstDayOfWeek();
    let firstWeekday: Weekday = DateHelper.getWeekdayByIndex(firstWeekdayNumber);
    return firstWeekday;
}