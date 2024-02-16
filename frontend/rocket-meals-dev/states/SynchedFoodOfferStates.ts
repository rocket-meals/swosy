import {useSyncState} from "@/helper/syncState/SyncState";
import {NonPersistentStore} from "@/helper/syncState/NonPersistentStore";
import {DateHelper} from "@/helper/date/DateHelper";
import {useIsDemo} from "@/states/SynchedDemo";
import {Foodoffers, Foods} from "@/helper/database/databaseTypes/types";
import {getDemoFoods} from "@/states/SynchedFoods";

export function useFoodOfferSelectedDate(): [Date, (newValue: Date) => void, (days: number) => void]
{
    const [selectedDate, setSelectedDate] = useSyncState<Date>(NonPersistentStore.foodOfferSelectedDate);

    let usedSelectedDate = selectedDate || new Date();

    function changeAmountDays(days: number) {
        const nextDate = DateHelper.addDaysAndReturnNewDate(usedSelectedDate, days);
        setSelectedDate(nextDate);
    }

    return [usedSelectedDate, setSelectedDate, changeAmountDays]
}

export function useFoodOffersForSelectedDate(): [Foodoffers[] | undefined, (newValue: Foodoffers[]) => void]
{
    const [selectedDate, setSelectedDate, changeAmountDays] = useFoodOfferSelectedDate();
    const copySelectedDate = new Date(selectedDate); // copy to avoid unwanted side effects

    const isDemo = useIsDemo();
    if(isDemo) {
        return [getDemoFoodOffersForDate(copySelectedDate), () => {}];
    }

    return [undefined, () => {}];

}

function getDemoFoodOffersForDate(date: Date): Foodoffers[]
{

    if(DateHelper.isWeekend(date)) {
        return [];
    }

    const demoFoods = getDemoFoods();
    const demoFoodOffer: Foodoffers[] = [];
    let demoFoodsKeys = Object.keys(demoFoods);

    let amount = 10 + date.getDay() // add day to get different amount of foods for each day
    if(amount > demoFoodsKeys.length) {
        amount = demoFoodsKeys.length;
    }

    // now lets select a bit of random foods based on the date
    let randomFoods: Foods[] = [];
    let start = date.getDay(); // start with the day of the week
    for (let i = 0; i < amount; i++) {
        randomFoods.push(demoFoods[demoFoodsKeys[(start + i) % demoFoodsKeys.length]]);
    }


    for (let i = 0; i < randomFoods.length; i++) {
        const food = randomFoods[i];
        demoFoodOffer.push({
            date: date.toISOString(),
            food: food,
            id: i,
            markings: food.markings,
            status: "active",
            user_created: undefined,
            user_updated: undefined,
            date_created: new Date().toISOString(),
            date_updated: new Date().toISOString()
        });
    }

    return demoFoodOffer;
}