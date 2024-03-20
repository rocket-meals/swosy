import moment from "moment"
import {ItemsServiceCreator} from "../../helper/ItemsServiceCreator.js"

const TABLENAME_FLOWHOOKS = "app_settings";
const TABLENAME_CANTEENS = "canteens";
const TABLENAME_UTILIZATION_GROUS = "utilizations_groups";
const TABLENAME_UTILIZATION_ENTRIES = "utilizations_entries";

const TABLENAME_BUSINESSHOURS = "businesshours";
const TABLENAME_CASHREGISTERS_TRANSACTIONS = "cashregisters_transactions";
const TABLENAME_CASHREGISTERS = "cashregisters";


const SCHEDULE_NAME = "UtilizationSchedule";

export class ParseSchedule {

    //TODO stringfiy and cache results to reduce dublicate removing from foodOffers and Meals ...

    constructor(parser) {
        this.parser = parser;
        this.finished = true;
    }

    async init(getSchema, services, database, logger) {
        this.schema = await getSchema();
        this.database = database;
        this.logger = logger;
        this.services = services;
        this.itemsServiceCreator = new ItemsServiceCreator(services, database, this.schema);
    }

    async setStatus(status) {
        await this.database(TABLENAME_FLOWHOOKS).update({
            utilization_forecast_calculation_status: status
        });
    }

    async isEnabled() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.utilization_forecast_calculation_enabled;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async getStatus() {
        try {
            let tablename = TABLENAME_FLOWHOOKS;
            let flows = await this.database(tablename).first();
            if (!!flows) {
                return flows?.utilization_forecast_calculation_status;
            }
        } catch (err) {
            console.log(err);
        }
        return undefined;
    }

    async parse() {
        let enabled = await this.isEnabled();
        let status = await this.getStatus()
        let statusCheck = "start";
        let statusFinished = "finished";
        let statusRunning = "running";
        let statusFailed = "failed";

        if (enabled && status === statusCheck && this.finished) {
            console.log("[Start] "+SCHEDULE_NAME+" Parse Schedule");
            this.finished = false;
            await this.setStatus(statusRunning);

            try {
                // Get all Canteens
                //console.log("UtilizationSchedule: load all canteens");
                let canteens = await this.getAllCanteens();
                // For every canteen, get all cashregisters
                for(let i=0; i<canteens.length; i++){
                    let canteen = canteens[i];
                    await this.calcForecastForCanteen(canteen)
                }

                console.log("Finished");
                this.finished = true;
                await this.setStatus(statusFinished);
            } catch (err) {
                console.log("[UtilizationSchedule] Failed");
                console.log(err);
                this.finished = true;
                await this.setStatus(statusFailed);
            }

        } else if (!this.finished && status !== statusRunning) {
            await this.setStatus(statusRunning);
        }
    }

    async calcForecastForCanteen(canteen){
        //console.log("UtilizationSchedule: calc for canteen - label: "+canteen?.label);
        //console.log(canteen);

        // for every canteen create a utilization group or find it
        let utilization_group_for_canteen = await this.findOrCreateOrUpdateUtilizationGroupForCanteen(canteen)

        if(utilization_group_for_canteen){
            // delete all future utilization forecast entries for the canteen group
            await this.deleteAllFutureUtilizationForecastEntries(utilization_group_for_canteen);

            // Have a list of all transactions
            let cashregister_ids = await this.getAllCashreigsterIdsForCanteen(canteen);

            let businesshoursForCanteen = await this.getBusinesshours(canteen);

            // calculate the prediction using as input: the transactions in the last x days, the canteen business hours
            let intervalMinutes = 15;
            let amountDaysForecast = 8;

            let dates = [];
            let today = new Date();

            let useTestDate = false;
            if(useTestDate){
                let testDate = new Date('2023-12-05'); // test date
                today = testDate;
                amountDaysForecast=1;
            }

            today.setDate(today.getDate()-1); // start with yesterday, so happened events can be saved as such
            for(let i=0; i<amountDaysForecast; i++){
                dates.push(new Date(today));
                today.setDate(today.getDate()+1);
            }

            for(let i=0; i<dates.length; i++) {
                let date = dates[i];
                console.log("")
                console.log("###########");
                console.log("Calc for: "+date);

                await this.updateUtilizationEntryForCanteenAtDate(canteen, utilization_group_for_canteen, cashregister_ids, date, intervalMinutes, businesshoursForCanteen);
            }

        } else {
            console.log("Houston we got a problem at calcForecastForCanteen");
        }
    }

    async createUtilizationEntry(utilization_group_id, date_start, date_end){
        let itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_UTILIZATION_ENTRIES);
        await itemService.createOne({
            utilization_group: utilization_group_id,
            date_start: date_start,
            date_end: date_end
        });
    }

    async getUtilizationEntry(utilization_group_id, date_start, date_end){
        //console.log("getUtilizationEntry");
        let itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_UTILIZATION_ENTRIES);

        let allFoundEntries = await itemService.readByQuery(
            {
                filter: {
                    _and: [
                        {
                            utilization_group: {
                                _eq: utilization_group_id
                            }
                        },
                        {
                            date_start: {
                                _eq: date_start
                            }
                        },
                        {
                            date_end: {
                                _eq: date_end
                            }
                        }
                    ]
                },
                fields: ['*']
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

    async countCashRegistersTransactionsForInterval(cashregister_ids, date_start, date_end){
        let transactions = 0;
        console.log("")
        console.log("countCashRegistersTransactionsForInterval")
        console.log("cashregister_ids")
        console.log(cashregister_ids);
        console.log("date_start: "+date_start.toString()+" date_end: "+date_end.toString());
        let cashregisterTransactionService = await this.itemsServiceCreator.getItemsService(TABLENAME_CASHREGISTERS_TRANSACTIONS);

        for(let i=0; i<cashregister_ids.length; i++){
            let cashregister_id = cashregister_ids[i];
            console.log("cashregister_id: "+cashregister_id);

            let transactions_for_cashregister_all = await cashregisterTransactionService.readByQuery({
                filter: {
                    cashregister: cashregister_id,
                },
                limit: 1000000
            });
            console.log("-- total for cashregister: "+transactions_for_cashregister_all.length);

            // Instead we need to use the itemServiceCreator
            let transactions_for_cashregister = await cashregisterTransactionService.readByQuery({
                    filter: {
                        _and: [
                            {
                                cashregister: {
                                    _eq: cashregister_id
                                }
                            },
                            {
                                date: {
                                    _gte: date_start
                                }
                            },
                            {
                                date: {
                                    _lt: date_end
                                }
                            },
                        ]
                    },
                    fields: ['*'], // List specific fields you want to retrieve or use '*' for all fields // we can remove this line
                    limit: 1000000 // just a very high limit. "-1" would be technically correct but due to security
                });

            let amount_transactions_for_cashregister = transactions_for_cashregister.length;
            console.log("-- in timeslot: "+amount_transactions_for_cashregister)
            transactions += amount_transactions_for_cashregister;
        }
        console.log("total: "+transactions)

        return transactions;
    }

    async updateUtilizationEntryForCanteenAtDate(canteen, utilization_group, cashregister_ids, date, intervalMinutes, businesshoursForCanteen){

        let now = new Date();

        let utilization_group_id = utilization_group?.id;

        let businesshoursForDate = await this.getCurrentValidBusinesshoursForDate(date, businesshoursForCanteen);
        let interval = await this.getInterval(intervalMinutes, businesshoursForDate, date);

        for(let interval_entry of interval){
            let date_start = interval_entry?.date_start
            let date_end = interval_entry?.date_end;

            let utilizationEntryCurrent = await this.getUtilizationEntry(utilization_group_id, date_start, date_end);
            if(!utilizationEntryCurrent){ // when we update an existing entry
                await this.createUtilizationEntry(utilization_group_id, date_start, date_end);
                utilizationEntryCurrent = await this.getUtilizationEntry(utilization_group_id, date_start, date_end);
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
                    // calc forecast - kept very simple
                    //console.log("entry is in the future")
                    let date_start_last_week = new Date(date_start)
                    date_start_last_week.setDate(date_start.getDate()-7);

                    let date_end_last_week = new Date(date_end)
                    date_end_last_week.setDate(date_end.getDate()-7);

                    //console.log("date_start_last_week: "+date_start_last_week.toISOString())
                    //console.log("date_end_last_week: "+date_end_last_week.toISOString())

                    let utilizationEntryLastWeek = await this.getUtilizationEntry(utilization_group_id, date_start_last_week, date_end_last_week);
                    let last_week_forecast_value = utilizationEntryLastWeek?.value_forecast_current // if we want to predict beyond 7 days we need to predict using predicted values, better than displaying 0
                    let last_week_real_value = utilizationEntryLastWeek?.value_real || last_week_forecast_value;
                    //console.log("last_week_real_value: "+last_week_real_value)
                    //console.log("last_week_real_value: "+last_week_real_value)
                    //console.log("utilizationEntryCurrent");
                    //console.log(utilizationEntryCurrent);
                    utilizationEntryCurrent.value_forecast_current = last_week_real_value
                }
                if(isEntryInPast){
                    // we need just to count the cash register actions
                    //console.log("entry is in the past");
                    let value_real = await this.countCashRegistersTransactionsForInterval(cashregister_ids, date_start, date_end);
                    //console.log("value_real: "+value_real);
                    utilizationEntryCurrent.value_real = value_real
                }

                let itemService = this.itemsServiceCreator.getItemsService(TABLENAME_UTILIZATION_ENTRIES);
                await itemService.updateOne(utilizationEntryCurrent.id, utilizationEntryCurrent);
            } else {
                console.log("Houston we got a problem")

            }


        }

    }

    async getCurrentValidBusinesshoursForDate(date, businessHoursForCanteen) {
        // Get the day of the week from the date
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let currentDate = new Date(date);
        const day = currentDate.getDay();
        //let dayOfWeek = dayNames[currentDate.getDay()];

        let businessObjsForCurrentDay = [];

        for (const businessHour of businessHoursForCanteen) {
            // Continue only if the day of the week matches
            //if (businessHour.dayOfTheWeek === dayOfWeek) {
            //    businessObjsForCurrentDay.push(businessHour);
            //}
            if(businessHour?.monday === true && day === 1){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.tuesday === true && day === 2){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.wednesday === true && day === 3){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.thursday === true && day === 4){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.friday === true && day === 5){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.saturday === true && day === 6){
                businessObjsForCurrentDay.push(businessHour);
            }
            if(businessHour?.sunday === true && day === 0){
                businessObjsForCurrentDay.push(businessHour);
            }
        }
        let currentValidBusinessHour = null;

        // check for the default business hour
        for(const businessHour of businessObjsForCurrentDay){
            if(!businessHour.date_valid_from && ! businessHour.date_valid_till){ // if we found the default date we set that first
                currentValidBusinessHour = businessHour;
            }
        }

        // check for special business hours
        for(const businessHour of businessObjsForCurrentDay){
            // Convert date string to Date object for comparison
            let validFromDate = businessHour.date_valid_from ? new Date(businessHour.date_valid_from) : null;
            let validTillDate = businessHour.date_valid_till ? new Date(businessHour.date_valid_till) : null;

            // Check if the current date falls within the valid date range
            let isDateInRange = true;
            if (validFromDate && currentDate < validFromDate) {
                isDateInRange = false;
            }
            if (validTillDate && currentDate > validTillDate) {
                isDateInRange = false;
            }

            // If the date is within the range and matches the day, add to valid list
            if (isDateInRange) {
                currentValidBusinessHour = businessHour
            }
        }

        return currentValidBusinessHour;
    }



    async getBusinesshours(canteen){
        let canteenService = this.itemsServiceCreator.getItemsService(TABLENAME_CANTEENS);
        let businessHoursService = this.itemsServiceCreator.getItemsService(TABLENAME_BUSINESSHOURS);

        let canteenWithBusinesshours = await canteenService.readOne(canteen?.id,  {"fields": ["*", "businesshours.*"]})
        let businessHoursDetails = [];
        for (const businessHourManyManyObj of canteenWithBusinesshours?.businesshours) {
            let businessHourId = businessHourManyManyObj?.businesshours_id;
            const businessHourDetails = await businessHoursService.readOne(businessHourId);
            businessHoursDetails.push(businessHourDetails);
        }
        return businessHoursDetails;

        /**
         businessHoursDetails
         [
           {
             date_created: '2024-01-06T13:02:23.409Z',
             date_updated: null,
             date_valid_from: null,
             date_valid_till: null,
             //dayOfTheWeek: 'Saturday',
                 monday: false,
                tuesday: false,
                wednesday: false,
                thursday: false,
                friday: false,
                saturday: true,
                sunday: false,
             id: 5,
             sort: null,
             status: 'draft',
             time_end: '11:00:00',
             time_start: '14:00:00',
             user_created: 'e2b46b90-5813-4dd7-818b-cb28900defbd',
             user_updated: null
         ...
         */
    }

    async getInterval(intervalMinutes, businesshoursForDate, date) {
        let time_start = businesshoursForDate?.time_start; // is in HH:MM:SS format
        let time_end = businesshoursForDate?.time_end; // is in HH:MM:SS format

        let interval = [];
        if (!time_start || !time_end) {
            return interval;
        }

        // Parse time_start and time_end
        const [startHours, startMinutes] = time_start.split(':').map(Number);
        const [endHours, endMinutes] = time_end.split(':').map(Number);

        // Set end_date hours and minutes from time_end
        let end_date = new Date(date);
        end_date.setHours(endHours, endMinutes, 0, 0);

        // Set current_start hours and minutes
        let current_start = new Date(date);
        current_start.setHours(startHours, startMinutes, 0, 0);

        // Set current_end and add intervalMinutes
        let current_end = new Date(current_start);
        current_end.setMinutes(current_end.getMinutes() + intervalMinutes);

        // While current_end <= end_date
        while (current_end <= end_date) {
            interval.push({
                date_start: new Date(current_start),
                date_end: new Date(current_end)
            });

            // Update current_start and current_end
            current_start = new Date(current_end);
            current_end.setMinutes(current_end.getMinutes() + intervalMinutes);
        }

        return interval;
    }


    async deleteAllFutureUtilizationForecastEntries(utilization_group){
        //console.log("deleteAllFutureUtilizationForecastEntries")
        //console.log(utilization_group);
        //console.log("- for group: "+utilization_group?.id+" - "+utilization_group?.label);

        let utilization_group_id = utilization_group.id;
        let currentDate = new Date(); // Get the current date
        //console.log("currentDate: "+currentDate.toString())



        let itemService = await this.itemsServiceCreator.getItemsService(TABLENAME_UTILIZATION_ENTRIES);

        let itemsToDelete = await itemService.readByQuery({
            filter: {
                utilization_group: utilization_group_id,
                date_end: {
                    _gt: currentDate
                }
            },
            fields: ['*']
        })

        let idsToDelete = itemsToDelete.map(item => item.id);
        await itemService.deleteMany(idsToDelete);

    }

    setStatusPublished(json) {
        json["status"] = "published";
        return json;
    }

    async getAllCanteens(){
        let tablename = TABLENAME_CANTEENS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename)
        let list = await itemService.readByQuery({});
        return list;
    }

    async getAllCashreigsterIdsForCanteen(canteen){
        //console.log("getAllCashreigsterIdsForCanteen");
        let tablename = TABLENAME_CASHREGISTERS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename)

        let list_of_cashregisters = await itemService.readByQuery({filter: {
                canteen: canteen?.id
            }});
        //console.log("list_of_cashregisters");
        //console.log(list_of_cashregisters)

        let ids = [];
        for(let i=0; i<list_of_cashregisters.length; i++){
            ids.push(list_of_cashregisters[i]?.id)
        }
        return ids;
    }

    async findOrCreateOrUpdateUtilizationGroupForCanteen(canteen) {
        //console.log("findOrCreateOrUpdateUtilizationGroupForCanteen")

        let utilization_group_id = canteen?.["utilization_group"];
        let tablename = TABLENAME_UTILIZATION_GROUS;
        let itemService = this.itemsServiceCreator.getItemsService(tablename);
        let foundOrCreatedGroup = null;
        if(utilization_group_id){ // since we have an id, there must be a group
            //console.log("if(utilization_group_id){")
            foundOrCreatedGroup = await itemService.readOne(utilization_group_id)
        } else { // if no group present, we have to create one
            //console.log("} else {")
            let obj_json = this.setStatusPublished({});
            let obj_id = await itemService.createOne(obj_json);
            foundOrCreatedGroup = await itemService.readOne(obj_id);
            // and link it to our canteen
            canteen["utilization_group"] = foundOrCreatedGroup?.id;
            await itemService.updateOne(canteen.id, canteen); // update the canteen information
        }

        if(foundOrCreatedGroup){
            // update the label
            //console.log("foundOrCreatedGroup");
            //console.log(foundOrCreatedGroup);
            await itemService.updateOne(foundOrCreatedGroup.id, {
                label: canteen?.label
            })
            foundOrCreatedGroup = await itemService.readOne(foundOrCreatedGroup.id);
        } else {
            console.log("Error at findOrCreateOrUpdateUtilizationGroupForCanteen")
        }

        return foundOrCreatedGroup;
    }


}
