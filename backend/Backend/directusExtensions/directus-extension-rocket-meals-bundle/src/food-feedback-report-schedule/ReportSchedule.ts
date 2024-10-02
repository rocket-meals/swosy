import moment from "moment"
import {ReportGenerator, ReportType} from "./ReportGenerator";
import {ItemsServiceCreator} from "../helpers/ItemsServiceCreator";
import {CollectionNames} from "../helpers/CollectionNames";
import {ApiContext} from "../helpers/ApiContext";
import {
    CanteenFoodFeedbackReportSchedules,
    CanteenFoodFeedbackReportSchedulesCanteens,
    CanteenFoodFeedbackReportSchedulesReportRecipients,
    Canteens,
    ReportRecipients
} from "../databaseTypes/types";
import {MyDatabaseHelper} from "../helpers/MyDatabaseHelper";
import {DateHelper, Weekday} from "../helpers/DateHelper";
import {PrimaryKey} from "@directus/types";
import {EventContext} from "@directus/extensions/node_modules/@directus/types/dist/events";
import {EmailTemplatesEnum} from "../helpers/EmailTemplates";

const TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES = CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES


const SCHEDULE_NAME = "CanteenFoodFeedbackReportSchedule";

export class ReportSchedule {
    private apiContext: ApiContext;
    private eventContext?: EventContext;
    private myDatabaseHelper: MyDatabaseHelper;

    constructor(apiContext: ApiContext, eventContext?: EventContext) {
        this.apiContext = apiContext
        this.eventContext = eventContext;
        this.myDatabaseHelper = new MyDatabaseHelper(apiContext, eventContext);
    }

    async run() {
        let reportGenerator = new ReportGenerator(this.apiContext);

        try {
            // 1. get all recipients entries
            let reportSchedules = await this.getAllReportSchedules();

            // 2. check for every recipient if a report is needed to be sent
            for (let reportSchedule of reportSchedules) {

                //console.log("reportSchedule.id: "+reportSchedule.id)
                let referenceDateForReport = await this.getReferenceDateOfTheReport(reportSchedule);
                //console.log("referenceDateForReport: "+referenceDateForReport)
                if (referenceDateForReport) {
                    let startDate = ReportSchedule.getStartDateBasedOnReferenceDate(referenceDateForReport, reportSchedule);

                    let recipientEmailList = await this.getRecipientEmailList(reportSchedule);

                    if(recipientEmailList.length>0){
                        let canteenEntries = await this.getCanteenEntries(reportSchedule);
                        if(canteenEntries.length>0){
                            try {
                                // 3. send report
                                let endDate = new Date(referenceDateForReport);

                                let generated_report_data: ReportType = await reportGenerator.generateReportJSON(reportSchedule, startDate, endDate, canteenEntries)
                                if(!!generated_report_data){
                                    for(let toMail of recipientEmailList){
                                        await this.sendReport(generated_report_data, reportSchedule, canteenEntries, toMail);
                                    }
                                    //console.log("Report was sent successfully for the date: setting the next report date")
                                    await this.setNextReportDate(reportSchedule);
                                    await this.updateReportLogSuccess(referenceDateForReport, reportSchedule);
                                } else {
                                    await this.logReportSendError(reportSchedule, "No report could be generated. Please contact admin and tell him: await reportGenerator.generateReportForMail(referenceDateForReport)");
                                }
                            } catch (err) {
                                // 3.1 if sending the report failed, log the error
                                await this.logReportSendError(reportSchedule, err);
                            }
                        } else {
                            await this.logReportSendError(reportSchedule, "No canteen set.");
                        }
                    } else {
                        await this.logReportSendError(reportSchedule, "No emails given.");
                    }
                }
            }

            //console.log("Finished " + SCHEDULE_NAME);
        } catch (err) {
            console.log("Error in " + SCHEDULE_NAME);
            console.log(err);
        }
    }

    static getStartDateBasedOnReferenceDate(referenceDate: Date, reportSchedule: CanteenFoodFeedbackReportSchedules): Date {
        // use foodoffers_days_limit to get the start date of the report. foodoffers_days_limit is the amount of days before the reference date
        const DEFAULT_FOODOFFERS_DAYS_LIMIT = 7;
        let foodoffers_days_limit = reportSchedule.foodoffers_days_limit || DEFAULT_FOODOFFERS_DAYS_LIMIT;
        if(foodoffers_days_limit < 0){
            foodoffers_days_limit = -foodoffers_days_limit;
        }
        if(foodoffers_days_limit === 0){
            foodoffers_days_limit = DEFAULT_FOODOFFERS_DAYS_LIMIT;
        }

        let startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - foodoffers_days_limit);
        return startDate;
    }

    async getRecipientEmailList(reportSchedule: CanteenFoodFeedbackReportSchedules): Promise<string[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);

        let report_schedule_report_recipients_service = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedulesReportRecipients>(CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_REPORT_RECIPIENTS)

        let report_schedule_report_recipients = await report_schedule_report_recipients_service.readByQuery({
            filter: {
                canteen_food_feedback_report_schedules_id: {
                    _eq: reportSchedule.id
                }
            },
            limit: -1
        });

        let report_recipients_primary_keys: PrimaryKey[] = []
        for(let report_schedule_report_recipient of report_schedule_report_recipients){
            let recipient_id = report_schedule_report_recipient.report_recipients_id;
            if(!!recipient_id && typeof recipient_id === "string"){
                report_recipients_primary_keys.push(recipient_id as PrimaryKey);
            }
        }

        let report_recipients_service = await itemsServiceCreator.getItemsService<ReportRecipients>(CollectionNames.REPORT_RECIPIENTS)
        let report_recipients = await report_recipients_service.readMany(report_recipients_primary_keys);

        let list: string[] = [];
        for(let report_recipient of report_recipients){
            let email = report_recipient.mail;
            if(!!email){
                list.push(email);
            }
        }

        return list;
    }



    async getCanteenEntries(recipientEntry: CanteenFoodFeedbackReportSchedules): Promise<Canteens[]>{
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedulesCanteens>(CollectionNames.CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES_CANTEENS)
        let scheduleCanteens = await itemService.readByQuery({
            filter: {
                canteen_food_feedback_report_schedules_id: {
                    _eq: recipientEntry.id
                }
            },
            limit: -1
        });
        let allCanteens = await this.myDatabaseHelper.getCanteensHelper().readAllItems();

        let canteen_primary_keys: PrimaryKey[] = []
        if(scheduleCanteens.length === 0){
            // if no canteen is set, we will use all canteens
            for(let canteen of allCanteens){
                canteen_primary_keys.push(canteen.id);
            }
        } else {
            for(let scheduleCanteen of scheduleCanteens){
                let canteen_id = scheduleCanteen.canteens_id;
                if(!!canteen_id && typeof canteen_id === "string"){
                    canteen_primary_keys.push(canteen_id as PrimaryKey);
                }
            }
        }

        let canteenService = await itemsServiceCreator.getItemsService<Canteens>(CollectionNames.CANTEENS)
        return await canteenService.readMany(canteen_primary_keys);
    }


    private getCanteenAliasForMail(canteenEntries: Canteens[]){
        let canteen_alias_list = ReportGenerator.getCanteenAliasList(canteenEntries);
        const previewAmount = 3;
        let canteen_alias = "";
        if(canteen_alias_list.length > previewAmount){
            canteen_alias_list = canteen_alias_list.slice(0, previewAmount);
            canteen_alias += ": " + canteen_alias_list.join(", ") + " ...";
        } else {
            canteen_alias += ": " + canteen_alias_list.join(", ");
        }

        return canteenEntries.length +" Mensen ("+canteen_alias+")";
    }

    async sendReport(generated_report_data: ReportType, recipientEntry: CanteenFoodFeedbackReportSchedules, canteenEntries: Canteens[], toMail: string){
        let canteen_alias = this.getCanteenAliasForMail(canteenEntries);

        let dateHumanReadable = generated_report_data.dateHumanReadable;

        let subject = "Mensa & Speise Report - Zeitraum "+dateHumanReadable+" - "+canteen_alias;

        await this.myDatabaseHelper.sendMail({
            recipient: toMail,
            subject: subject,
            template_name: EmailTemplatesEnum.CANTEEN_FOOD_FEEDBACK_REPORT,
            template_data: generated_report_data
        })
    }

    async setNextReportDate(recipientEntry: CanteenFoodFeedbackReportSchedules){
        //console.log(SCHEDULE_NAME + " setNextReportDate")
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        let tablename = TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
        // update when the next report is due
        let now = new Date();
        let new_date_next_report_is_due_iso = ReportSchedule.getNextReportIsDueDateIsoOrNull(recipientEntry, now);

        if(!new_date_next_report_is_due_iso){
            const messageNoSuitableNextReportDateFoundPleaseSelectAtLeastOneWeekday = "No suitable next report date found. Please select at least one weekday.";
            if(!recipientEntry.report_status_log || recipientEntry.report_status_log !== messageNoSuitableNextReportDateFoundPleaseSelectAtLeastOneWeekday){
                await this.updateReportLog(recipientEntry, messageNoSuitableNextReportDateFoundPleaseSelectAtLeastOneWeekday, false);
            }
        } else {
            //console.log("Next report due date was calculated: "+new_date_next_report_is_due_iso)
            //console.log("Update recipientEntry.id: "+recipientEntry.id)
            await itemService.updateOne(recipientEntry.id, {date_next_report_is_due: new_date_next_report_is_due_iso});
            //console.log("Update report_status_log after setting next report date")
            await this.updateReportLog(recipientEntry, "Next report date was not set. Set next report due date to: "+new_date_next_report_is_due_iso, true);
        }
    }

    async updateReportLogSuccess(generateReportForDate: Date, recipientEntry: CanteenFoodFeedbackReportSchedules){
        let logMessage = `
            Report was sent successfully for the date: ${generateReportForDate}
            Sent at: ${new Date().toISOString()}
        `
        await this.updateReportLog(recipientEntry, "Report was sent successfully for the date: " + generateReportForDate, true);
    }

    async logReportSendError(recipientEntry: CanteenFoodFeedbackReportSchedules, err: any){
        //console.log(SCHEDULE_NAME + " logReportSendError:")
        //console.log(err);
        await this.updateReportLog(recipientEntry, "Report sending failed: " + err.toString(), false);
    }

    async updateReportLog(recipientEntry: CanteenFoodFeedbackReportSchedules, log: string, success: boolean){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);

        try{
            let tablename = TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES;
            let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
            let updateData: Partial<CanteenFoodFeedbackReportSchedules> = {
                report_status_log: log,
                report_send_successfully: success
            }
            await itemService.updateOne(recipientEntry.id, updateData);
        } catch (err){
            console.log(SCHEDULE_NAME + " updateReportLog failed:")
            console.log(err);
        }
    }


    async getReferenceDateOfTheReport(recipientEntry: CanteenFoodFeedbackReportSchedules){
        //console.log("#############");
        //console.log(SCHEDULE_NAME + " getDateForWhichTheReportShouldBeSend")

        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        //console.log("Checking if report is due for to_recipient_email: " + recipientEntry.to_recipient_email);
        let tablename = TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)


        let enabled = recipientEntry.enabled;
        if (!enabled) {
            await this.updateReportLog(recipientEntry, "Report is disabled.", true);
            return null;
        }

        // okay, now we have to calculate the date for which the report should be generated
        let now = new Date();
        let now_moment_date = moment(now.toISOString());

        let send_once_now_for_date = recipientEntry?.send_once_now_for_reference_date;
        if(send_once_now_for_date){
            await itemService.updateOne(recipientEntry.id, {send_once_now_for_reference_date: null});
            return new Date(send_once_now_for_date);
        }

        let current_date_next_report_is_due = recipientEntry.date_next_report_is_due;
        //console.log("date_for_which_the_report_should_be_generated_moment_date: " + date_for_which_the_report_should_be_generated_moment_date);

        if(!current_date_next_report_is_due){
            //console.log("date_next_report_is_due is not set, lets set it")
            // if the date_next_report_is_due is not set, we have to set it
            // date_when_the_next_report_should_be_generated is date_for_which_the_report_should_be_generated_moment_date minus send_amount_days_before_offer_date
            await this.setNextReportDate(recipientEntry);
            return null; // we do not want to send a report now
        } else {
            // if the date_next_report_is_due is set, we have to check if the report is due
            if(now_moment_date.isAfter(current_date_next_report_is_due)){
                //console.log("Report is due for to_recipient_email: " + recipientEntry.to_recipient_email);
                //console.log("Report is due: "+date_for_which_the_report_should_be_generated_moment_date.toString());
                // date_for_which_the_report_should_be_generated_moment_date; to iso string

                return ReportSchedule.getReferenceDate(recipientEntry, now);
            } else {
                return null; // we do not want to send a report now
            }
        }
    }

    public static getReferenceDate(recipientEntry: Partial<CanteenFoodFeedbackReportSchedules>, now: Date): Date {
        let now_moment_date = moment(now.toISOString());

        let foodoffers_days_offset = recipientEntry.foodoffers_days_offset || 0; // for example we want to 4 days before the offer date notify the user
        //console.log("MOMENT 2 - now_moment_date: "+now_moment_date)
        let date_for_which_the_report_should_be_generated = moment(now_moment_date.toISOString()).add(foodoffers_days_offset, 'days').set({
            hour: 12,
            minute: 0,
            second: 0
        })
        let date_for_which_the_report_should_be_generated_iso = date_for_which_the_report_should_be_generated.toISOString();
        return new Date(date_for_which_the_report_should_be_generated_iso);
    }

    public static splitSendReportAtHhMm(recipientEntry: Partial<CanteenFoodFeedbackReportSchedules>){
        let send_report_at_hh_mm = recipientEntry.send_report_at_hh_mm;
        let send_report_at_hh_mm_splits = send_report_at_hh_mm?.split(":");
        let send_report_at_hh = parseInt(send_report_at_hh_mm_splits?.[0] || "06");
        let send_report_at_mm = parseInt(send_report_at_hh_mm_splits?.[1] || "00");
        let send_report_at_ss = parseInt(send_report_at_hh_mm_splits?.[2] || "00");
        return {
            send_report_at_hh,
            send_report_at_mm,
            send_report_at_ss
        }
    }

    public static getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry: Partial<CanteenFoodFeedbackReportSchedules>, now: Date): Date | null {
        //console.log("getNextReportIsDueToBeGeneratedDateOrNull")
        let now_copy = new Date(now);
        //console.log("MOMENT 1 - now_copy: "+now_copy)
        const now_moment_date = moment(now_copy);
        const send_report_at_splits = ReportSchedule.splitSendReportAtHhMm(recipientEntry);
        const send_report_at_hh = send_report_at_splits.send_report_at_hh;
        const send_report_at_mm = send_report_at_splits.send_report_at_mm;
        const send_report_at_ss = send_report_at_splits.send_report_at_ss;

        //console.log("MOMENT 2 - now_copy: "+now_copy)
        let date_when_the_next_report_should_be_generated = moment(now_copy).add(0, 'days').set({
            hour: send_report_at_hh,
            minute: send_report_at_mm,
            second: send_report_at_ss
        });
        if(now_moment_date.isAfter(date_when_the_next_report_should_be_generated)){
            //console.log("now_moment_date.isAfter(date_when_the_next_report_should_be_generated) - we missed the report")
            // since the date_when_the_next_report_should_be_generated is in the past and we "missed" the report, we have to set the next report date to tomorrow
            //console.log("MOMENT 3 - date_when_the_next_report_should_be_generated: "+date_when_the_next_report_should_be_generated)
            date_when_the_next_report_should_be_generated = moment(date_when_the_next_report_should_be_generated.toISOString()).add(1, 'days')
        } else {
            //console.log("now_moment_date.isBefore(date_when_the_next_report_should_be_generated) - we are in time for the report")
        }

        // Lets check if for the date the report should be generated, a weekday is set
        //console.log("date_for_which_the_report_should_be_generated_moment_date: "+date_for_which_the_report_should_be_generated_moment_date)
        const next_weekdayList_for_date_for_which_the_report_should_be_generated = DateHelper.getWeekdayListFromDate(new Date(date_when_the_next_report_should_be_generated.toISOString()));
        //console.log("next_weekdayList_for_date_for_which_the_report_should_be_generated: ")
        //console.log(next_weekdayList_for_date_for_which_the_report_should_be_generated)
        let found_suitable_weekday = false;
        let amount_days_to_add = 0;
        for(let weekday of next_weekdayList_for_date_for_which_the_report_should_be_generated){
            //console.log("Check if weekday is suitable: "+weekday)
            switch (weekday) {
                case Weekday.MONDAY:
                    if(recipientEntry.send_on_mondays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.TUESDAY:
                    if(recipientEntry.send_on_tuesdays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.WEDNESDAY:
                    if(recipientEntry.send_on_wednesdays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.THURSDAY:
                    if(recipientEntry.send_on_thursdays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.FRIDAY:
                    if(recipientEntry.send_on_fridays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.SATURDAY:
                    if(recipientEntry.send_on_saturdays){
                        found_suitable_weekday = true;
                    }
                    break;
                case Weekday.SUNDAY:
                    if(recipientEntry.send_on_sundays){
                        found_suitable_weekday = true;
                    }
                    break;
            }
            if(found_suitable_weekday){
                break;
            }
            //console.log("weekday is not suitable: "+weekday)
            amount_days_to_add++;
        }

        if(!found_suitable_weekday){
            //console.log("No suitable weekday found")
            return null;
        }

        //console.log("amount_days_to_add: "+amount_days_to_add)
        // we have to add the amount of days to the date_when_the_next_report_should_be_generated to get the next report date
        //console.log("MOMENT 4 - date_when_the_next_report_should_be_generated: "+date_when_the_next_report_should_be_generated)
        let suitable_date_when_the_next_report_should_be_generated_moment_date = moment(date_when_the_next_report_should_be_generated.toISOString()).add(amount_days_to_add, 'days')
        suitable_date_when_the_next_report_should_be_generated_moment_date = suitable_date_when_the_next_report_should_be_generated_moment_date.set({
            hour: send_report_at_hh,
            minute: send_report_at_mm,
            second: send_report_at_ss
        });

        let date_next_report_is_due_iso = suitable_date_when_the_next_report_should_be_generated_moment_date.toISOString();
        let date_next_report_is_due = new Date(date_next_report_is_due_iso);
        //console.log("date_next_report_is_due: "+date_next_report_is_due)
        return date_next_report_is_due;
    }

    public static getNextReportIsDueDateIsoOrNull(recipientEntry: Partial<CanteenFoodFeedbackReportSchedules>, now: Date): string | null {
        let nextReportIsDueDate = ReportSchedule.getNextReportIsDueToBeGeneratedDateOrNull(recipientEntry, now);
        if(!nextReportIsDueDate){
            return null;
        }
        return nextReportIsDueDate.toISOString();
    }

    public async getCanteenFoodFeedbackReportScheduleById(id: string){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext, this.eventContext);
        let tablename = TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
        try{
            let reportSchedule = await itemService.readOne(id);
            return reportSchedule;
        } catch (err){
            console.log("getCanteenFoodFeedbackReportScheduleById failed:")
            console.log(err);
            return null;
        }
        return null;
    }

    public static haveTimeSettingsChanged(
        currentCanteenFoodFeedbackReportSchedules: Partial<CanteenFoodFeedbackReportSchedules>,
        newCanteenFoodFeedbackReportSchedules: Partial<CanteenFoodFeedbackReportSchedules>
    ): boolean {
        const fieldsToCheck: Array<keyof CanteenFoodFeedbackReportSchedules> = [
            "send_report_at_hh_mm",
            "send_on_mondays",
            "send_on_tuesdays",
            "send_on_wednesdays",
            "send_on_thursdays",
            "send_on_fridays",
            "send_on_saturdays",
            "send_on_sundays",
        ];

        // Iterate over the fields and return true if any of the corresponding fields have changed
        return fieldsToCheck.some((field) => {
            // Only compare if the newCanteenFoodFeedbackReportSchedules field is defined
            if (newCanteenFoodFeedbackReportSchedules[field as keyof CanteenFoodFeedbackReportSchedules] !== undefined) {
                const currentValue = currentCanteenFoodFeedbackReportSchedules[field as keyof CanteenFoodFeedbackReportSchedules];
                const newValue = newCanteenFoodFeedbackReportSchedules[field as keyof CanteenFoodFeedbackReportSchedules];

                // Check if the values are different
                return currentValue !== newValue;
            }

            // If the field is not present in newCanteenFoodFeedbackReportSchedules, do not treat it as a change
            return false;
        });
    }

    async getAllReportSchedules(){
        const itemsServiceCreator = new ItemsServiceCreator(this.apiContext);
        let tablename = TABLENAME_CANTEEN_FOOD_FEEDBACK_REPORT_SCHEDULES;
        let itemService = await itemsServiceCreator.getItemsService<CanteenFoodFeedbackReportSchedules>(tablename)
        let list = await itemService.readByQuery({
            limit: -1});
        return list;
    }

}
