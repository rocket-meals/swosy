import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {FlowStatus} from "../helpers/AppSettingsHelper";
import {
    Canteens,
    Cashregisters,
    CashregistersTransactions,
    UtilizationsEntries,
    UtilizationsGroups
} from "../databaseTypes/types";
import {DateHelper} from "../helpers/DateHelper";


const SCHEDULE_NAME = "UtilizationSchedule";

export class ParseSchedule {

    private itemsServiceCreator: ItemsServiceCreator;
    private apiContext: ApiContext;
    private myDatabaseHelper: MyDatabaseHelper;

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...

    constructor(apiContext: ApiContext) {
        this.apiContext = apiContext;
        this.itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        this.myDatabaseHelper = new MyDatabaseHelper(this.apiContext);
    }

    async setStatus(status: FlowStatus) {
        await this.myDatabaseHelper.getAppSettingsHelper().setUtilizationForecastCalculationStatus(status, new Date());
    }

    async isEnabled() {
        return await this.myDatabaseHelper.getAppSettingsHelper().isUtilizationForecastCalculationEnabled();
    }

    async getStatus() {
        return await this.myDatabaseHelper.getAppSettingsHelper().getUtilizationForecastCalculationStatus();
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()

        if (enabled && status === FlowStatus.START) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            await this.setStatus(FlowStatus.RUNNING);

            try {
                // Get all Canteens
                //console.log("UtilizationSchedule: load all canteens");
                let canteens = await this.getAllCanteens();
                // For every canteen, get all cashregisters
                for(let canteen of canteens){
                    await this.calcForecastForCanteen(canteen)
                }

                console.log("Finished");
                await this.setStatus(FlowStatus.FINISHED);
            } catch (err) {
                console.log("[UtilizationSchedule] Failed");
                console.log(err);
                await this.setStatus(FlowStatus.FAILED);
            }

        }
    }

    async calcForecastForCanteen(canteen: Canteens){
        //console.log("UtilizationSchedule: calc for canteen - label: "+canteen?.label);
        //console.log(canteen);

        // for every canteen create a utilization group or find it
        let utilization_group_for_canteen = await this.findOrCreateOrUpdateUtilizationGroupForCanteen(canteen)

        if(utilization_group_for_canteen){
            // delete all future utilization forecast entries for the canteen group
            await this.deleteAllFutureUtilizationForecastEntries(utilization_group_for_canteen);

            // Have a list of all transactions
            let cashregisters = await this.getAllCashregistersForCanteen(canteen);

            // calculate the prediction using as input: the transactions in the last x days, the canteen business hours
            let intervalMinutes = 15;
            let amountDaysForecast = 8;

            let dates = [];
            let today = new Date();

            today.setDate(today.getDate()-1); // start with yesterday, so happened events can be saved as such
            for(let i=0; i<amountDaysForecast; i++){
                dates.push(new Date(today));
                today.setDate(today.getDate()+1);
            }

            for(let date of dates){
                console.log("")
                console.log("###########");
                console.log("Calc for: "+date);

                await this.updateUtilizationEntryForCanteenAtDate(canteen, utilization_group_for_canteen, cashregisters, date, intervalMinutes);
            }

        } else {
            console.log("Houston we got a problem at calcForecastForCanteen");
        }
    }

    async createUtilizationEntry(utilization_group: UtilizationsGroups, date_start: Date, date_end: Date){
        let itemService = await this.itemsServiceCreator.getItemsService<UtilizationsEntries>(CollectionNames.UTILIZATION_ENTRIES);
        await itemService.createOne({
            utilization_group: utilization_group?.id,
            date_start: DateHelper.formatDateToIso8601WithoutTimezone(date_start),
            date_end: DateHelper.formatDateToIso8601WithoutTimezone(date_end),
        });
    }

    async getUtilizationEntry(utilization_group: UtilizationsGroups, date_start: Date, date_end: Date){
        //console.log("getUtilizationEntry");
        let itemService = await this.itemsServiceCreator.getItemsService<UtilizationsEntries>(CollectionNames.UTILIZATION_ENTRIES);

        let allFoundEntries = await itemService.readByQuery(
            {
                filter: {
                    _and: [
                        {
                            utilization_group: {
                                _eq: utilization_group?.id
                            }
                        },
                        {
                            date_start: {
                                _eq: DateHelper.formatDateToIso8601WithoutTimezone(date_start)
                            }
                        },
                        {
                            date_end: {
                                _eq: DateHelper.formatDateToIso8601WithoutTimezone(date_end)
                            }
                        }
                    ]
                },
                fields: ['*'],
                limit: -1
            }
        );
        //console.log(allFoundEntries)
        return allFoundEntries[0];

        /**
          {
            id: 1,
            status: 'draft',
            sort: null,
            user_created: 'e2b46b90-5813-4dd7-818b-cb28900defbd',
            date_created: 1704558256553,
            user_updated: 'e2b46b90-5813-4dd7-818b-cb28900defbd',
            date_updated: 1704558879095,
            value_forecast_current: null,
            value_real: 50,
            date_start: 1703934000000,
            date_end: 1703934900000,
            utilization_group: 2
          }
         */
    }

    async countCashRegistersTransactionsForInterval(cashregisters: Cashregisters[], date_start: Date, date_end: Date){
        let transactions = 0;
        console.log("")
        console.log("countCashRegistersTransactionsForInterval")
        console.log("cashregister_ids")
        console.log("date_start: "+date_start.toString()+" date_end: "+date_end.toString());
        let cashregisterTransactionService = await this.itemsServiceCreator.getItemsService<CashregistersTransactions>(CollectionNames.CASHREGISTERS_TRANSACTIONS);

        const realisticAverage = 6000;
        const assumedMaxLimit = realisticAverage*10; // normally during a single day only 6000 transactions are realistic, we set a limit of 10 times that value

        for(let cashregister of cashregisters){
            console.log("cashregister_id: "+cashregister.id);

            // Instead we need to use the itemServiceCreator
            let transactions_for_cashregister = await cashregisterTransactionService.readByQuery({
                    filter: {
                        _and: [
                            {
                                cashregister: {
                                    _eq: cashregister.id
                                }
                            },
                            {
                                date: {
                                    _gte: DateHelper.formatDateToIso8601WithoutTimezone(date_start)
                                }
                            },
                            {
                                date: {
                                    _lt: DateHelper.formatDateToIso8601WithoutTimezone(date_end)
                                }
                            },
                        ]
                    },
                    fields: ['id'], // we only need the id and not the whole object, so we can count the transactions
                    limit: assumedMaxLimit // just a very high limit. "-1" would be technically correct but due to security
                });

            let amount_transactions_for_cashregister = transactions_for_cashregister.length;
            console.log("-- in timeslot: "+amount_transactions_for_cashregister)
            transactions += amount_transactions_for_cashregister;
        }
        console.log("total: "+transactions)

        return transactions;
    }

    async updateUtilizationEntryForCanteenAtDate(canteen: Canteens, utilization_group: UtilizationsGroups, cashregisters: Cashregisters[], date: Date, intervalMinutes: number){

        let now = new Date();

        let utilization_group_id = utilization_group?.id;

        let interval = await this.getInterval(intervalMinutes, date);

        for(let interval_entry of interval){
            let date_start = interval_entry.date_start
            let date_end = interval_entry.date_end;

            let utilizationEntryCurrent = await this.getUtilizationEntry(utilization_group, date_start, date_end);
            if(!utilizationEntryCurrent){ // when we update an existing entry
                await this.createUtilizationEntry(utilization_group, date_start, date_end);
                utilizationEntryCurrent = await this.getUtilizationEntry(utilization_group, date_start, date_end);
            }
            //console.log("utilizationEntryCurrent");
            //console.log(utilizationEntryCurrent);

            if(!!utilizationEntryCurrent){
                //console.log("date_start: "+date_start.toISOString()+" --> "+"date_end: "+date_end.toISOString())
                let isEntryInPast = false;
                if(date_start < now && date_end < now){ // if start AND end date is in the past.
                    isEntryInPast = true;
                }
                //console.log("isEntryInPast: "+isEntryInPast);

                if(!isEntryInPast){
                    utilizationEntryCurrent.value_forecast_current = await this.predictUtilizationForInterval(utilization_group, cashregisters, canteen, date_start, date_end);
                }
                if(isEntryInPast){
                    // we need just to count the cash register actions
                    let value_real = await this.countCashRegistersTransactionsForInterval(cashregisters, date_start, date_end);
                    //console.log("value_real: "+value_real);
                    utilizationEntryCurrent.value_real = value_real
                }

                let itemService = await this.itemsServiceCreator.getItemsService<UtilizationsEntries>(CollectionNames.UTILIZATION_ENTRIES);
                await itemService.updateOne(utilizationEntryCurrent.id, utilizationEntryCurrent);
            } else {
                console.log("Houston we got a problem")
            }
        }

    }

    /**
     * Simple prediction for the utilization of a canteen, assuming the same utilization as last week
     * TODO: Implement a more sophisticated prediction
     * @param utilization_group
     * @param cashregisters
     * @param canteen
     * @param date_start
     * @param date_end
     */
    async predictUtilizationForInterval(utilization_group: UtilizationsGroups, cashregisters: Cashregisters[], canteen: Canteens, date_start: Date, date_end: Date){
        // calc forecast - kept very simple
        let date_start_last_week = new Date(date_start)
        date_start_last_week.setDate(date_start.getDate()-7);

        let date_end_last_week = new Date(date_end)
        date_end_last_week.setDate(date_end.getDate()-7);

        let utilizationEntryLastWeek = await this.getUtilizationEntry(utilization_group, date_start_last_week, date_end_last_week);
        let last_week_forecast_value = utilizationEntryLastWeek?.value_forecast_current // if we want to predict beyond 7 days we need to predict using predicted values, better than displaying 0

        let value_forecast_current = utilizationEntryLastWeek?.value_real || last_week_forecast_value
        return value_forecast_current;
    }


    async getInterval(intervalMinutes: number, date: Date) {
        let minutesPerDay = 24 * 60;

        let interval = [];

        let currentDate = new Date(date);
        for(let i=0; i<minutesPerDay; i+=intervalMinutes){
            let date_start = new Date(currentDate);
            date_start.setMinutes(i);
            let date_end = new Date(date_start);
            date_end.setMinutes(i+intervalMinutes);
            interval.push({
                date_start: date_start,
                date_end: date_end
            });
        }


        return interval;
    }


    async deleteAllFutureUtilizationForecastEntries(utilization_group: UtilizationsGroups){
        //console.log("deleteAllFutureUtilizationForecastEntries")
        //console.log(utilization_group);
        //console.log("- for group: "+utilization_group?.id+" - "+utilization_group?.label);

        let utilization_group_id = utilization_group.id;
        let currentDate = new Date(); // Get the current date
        //console.log("currentDate: "+currentDate.toString())



        let itemService = await this.itemsServiceCreator.getItemsService<UtilizationsEntries>(CollectionNames.UTILIZATION_ENTRIES);

        let itemsToDelete = await itemService.readByQuery({
            filter: {
                _and: [
                    {
                        utilization_group: {
                            _eq: utilization_group_id
                        }
                    },
                    {
                        date_end: {
                            _gte: DateHelper.formatDateToIso8601WithoutTimezone(currentDate)
                        }
                    }
                ]
            },
            fields: ['*'],
            limit: -1
        })

        let idsToDelete = itemsToDelete.map(item => item.id);
        await itemService.deleteMany(idsToDelete);

    }

    setStatusPublished(json: any) {
        json["status"] = "published";
        return json;
    }

    async getAllCanteens(){
        let itemService = await this.itemsServiceCreator.getItemsService<Canteens>(CollectionNames.CANTEENS)
        return await itemService.readByQuery({
            limit: -1
        });
    }

    async getAllCashregistersForCanteen(canteen: Canteens){
        //console.log("getAllCashreigsterIdsForCanteen");
        let itemService = await this.itemsServiceCreator.getItemsService<Cashregisters>(CollectionNames.CASHREGISTERS)

        let list_of_cashregisters = await itemService.readByQuery({filter: {
                canteen: {
                    _eq: canteen?.id
                }
            },
            limit: -1});
        return list_of_cashregisters
    }

    async findOrCreateOrUpdateUtilizationGroupForCanteen(canteen: Canteens) {
        //console.log("findOrCreateOrUpdateUtilizationGroupForCanteen")
        const canteenItemService = await this.itemsServiceCreator.getItemsService<Canteens>(CollectionNames.CANTEENS);
        let utilization_group_id = canteen?.utilization_group;
        let itemService = await this.itemsServiceCreator.getItemsService<UtilizationsGroups>(CollectionNames.UTILIZATION_GROUPS);
        let foundOrCreatedGroup = null;
        if(utilization_group_id && typeof utilization_group_id === "string"){ // if group present, we have to update it
            //console.log("if(utilization_group_id){")
            foundOrCreatedGroup = await itemService.readOne(utilization_group_id)
        } else { // if no group present, we have to create one
            //console.log("} else {")
            let obj_json = this.setStatusPublished({});
            let obj_id = await itemService.createOne(obj_json);
            foundOrCreatedGroup = await itemService.readOne(obj_id);
            // and link it to our canteen
            canteen.utilization_group = foundOrCreatedGroup?.id;

            await canteenItemService.updateOne(canteen.id, {
                utilization_group: foundOrCreatedGroup?.id
            }); // update the canteen information
        }

        if(foundOrCreatedGroup){
            // update the label
            //console.log("foundOrCreatedGroup");
            //console.log(foundOrCreatedGroup);
            await itemService.updateOne(foundOrCreatedGroup.id, {
                alias: canteen?.alias
            })
            foundOrCreatedGroup = await itemService.readOne(foundOrCreatedGroup.id);
        } else {
            console.log("Error at findOrCreateOrUpdateUtilizationGroupForCanteen")
        }

        return foundOrCreatedGroup;
    }


}
