import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {DateHelper} from "@/helper/date/DateHelper";

export function useFoodOfferSelectedDate(): [Date, (newValue: Date) => void, (days: number) => void]
{
    const [selectedDate, setSelectedDate] = useSyncState<Date>(NonPersistentStore.foodOfferSelectedDate);

    let usedSelectedDate = selectedDate || new Date();

    function changeAmountDays(days: number) {
        console.log("changeAmountDays", days);
        console.log("usedSelectedDate", usedSelectedDate);
        const nextDate = DateHelper.addDaysAndReturnNewDate(usedSelectedDate, days);
        console.log("nextDate", nextDate);
        setSelectedDate(nextDate);
    }

    return [usedSelectedDate, setSelectedDate, changeAmountDays]
}