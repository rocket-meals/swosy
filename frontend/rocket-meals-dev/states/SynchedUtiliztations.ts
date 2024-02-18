import {UtilizationsEntries, UtilizationsGroups} from "@/helper/database/databaseTypes/types";
import {CollectionHelper} from "@/helper/database/server/CollectionHelper";
import {useIsDemo} from "@/states/SynchedDemo";

export async function loadUtilizationEntriesRemote(utilizationGroup: UtilizationsGroups, date: Date, isDemo: boolean): Promise<UtilizationsEntries[]> {

    console.log("loadUtilizationEntriesRemote", utilizationGroup, date, isDemo)

    let utilizationEntries: UtilizationsEntries[] = [];
    if(isDemo){
        utilizationEntries = getDemoUtilizationEntries(date);
        return utilizationEntries;
    } else {
        let utilizationEntriesHelper = new CollectionHelper<UtilizationsEntries>("utilizations_entries");
        let date_start = new Date(date);
        date_start.setHours(0,0,0,0);

        let date_end = new Date(date_start);
        date_end.setHours(23,59,59,999);

        utilizationEntries = await utilizationEntriesHelper.readItems({
            filter: {
                utilization_group: utilizationGroup.id,
                date_start: {
                    $gte: date_start.toISOString(),
                    $lt: date_end.toISOString()
                }
            }
        });
        return utilizationEntries;
    }
}


function getDemoUtilizationEntries(date: Date) {
    let utilizationEntries: UtilizationsEntries[] = [];

    // if saturday or sunday return empty array
    if(date.getDay() === 0 || date.getDay() === 6){
        return utilizationEntries;
    }

    let start = new Date(date);
    // set start to 10:00
    start.setHours(10)
    start.setMinutes(0)
    start.setSeconds(0)
    start.setMilliseconds(0)

    let end = new Date(date);
    // set end to 17:00
    end.setHours(17)
    end.setMinutes(0)
    end.setSeconds(0)
    end.setMilliseconds(0)

    let peak = new Date(date);
    peak.setHours(12)
    peak.setMinutes(0)
    peak.setSeconds(0)
    peak.setMilliseconds(0)

    // create utilization entries for every 15 minutes
    let current = new Date(start);
    while (current < end) {
        let date_start = current.toISOString();
        let date_end = new Date(current);
        date_end.setMinutes(date_end.getMinutes() + 15);

        // let value_forecast_current start at 10 and has its peak at 12:00 and then goes down to 10 again
        let value_at_peak = 100;
        let value_at_start = 10;
        let minutes_to_peak_from_start = (peak.getTime() - start.getTime()) / 1000 / 60;
        let minutes_to_peak_from_end = (end.getTime() - peak.getTime()) / 1000 / 60;
        let value_forecast_current = value_at_start
        if(current < peak){
            // interpolate between value_at_start and value_at_peak with a s-curve which starts as value_at_start and ends as value_at_peak
            let t = (current.getTime() - start.getTime()) / 1000 / 60;
            let x = t / minutes_to_peak_from_start;
            value_forecast_current = value_at_start + (value_at_peak - value_at_start) * (x * x * (3 - 2 * x));
        } else {
            // interpolate between value_at_peak and value_at_start with a s-curve which starts as value_at_peak and ends as value_at_start
            let t = (current.getTime() - peak.getTime()) / 1000 / 60;
            let x = t / minutes_to_peak_from_end;
            value_forecast_current = value_at_peak + (value_at_start - value_at_peak) * (x * x * (3 - 2 * x));
        }



        let utilizationEntry: UtilizationsEntries = {
            date_start: current.toISOString(),
            date_end: date_end.toISOString(),
            date_updated: new Date().toISOString(),
            date_created: new Date().toISOString(),
            id: "demo"+current.toISOString(),
            value_forecast_current: value_forecast_current,
            value_real: value_forecast_current
        };
        utilizationEntries.push(utilizationEntry);
        current.setMinutes(current.getMinutes() + 15);
    }

    return utilizationEntries;
}
